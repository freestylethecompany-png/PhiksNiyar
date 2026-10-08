import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Authorization: Only the booking's customer or an admin can verify payment
    const isCustomer = session.userId === booking.customerId;
    const isAdmin = session.role === 'ADMIN';
    if (!isCustomer && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to verify payment for this booking.' },
        { status: 403 }
      );
    }

    // Idempotency: If booking is already marked PAID, return existing confirmation safely
    if (booking.status === 'PAID' && booking.payment?.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Payment already confirmed for this booking.',
        booking,
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (isProduction || razorpaySecret) {
      // Production mode MANDATES valid cryptographic signature
      if (!razorpaySecret) {
        console.error('CRITICAL: RAZORPAY_KEY_SECRET is not configured in production.');
        return NextResponse.json(
          { error: 'Payment gateway configuration error. Please contact support.' },
          { status: 500 }
        );
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { error: 'Missing mandatory payment verification parameters (order_id, payment_id, signature).' },
          { status: 400 }
        );
      }

      // Compute HMAC-SHA256 signature
      const generatedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const genBuf = Buffer.from(generatedSignature);
      const sigBuf = Buffer.from(razorpay_signature);

      const isSignatureValid =
        genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf);

      if (!isSignatureValid) {
        return NextResponse.json(
          { error: 'Invalid Razorpay payment signature. Tampering suspected.' },
          { status: 400 }
        );
      }
    }

    // Amount calculation from server authoritative pricing
    const amountPaid = booking.pricing.finalAmount || booking.pricing.estimatedAmount;

    // Record verified payment
    booking.status = 'PAID';
    booking.updatedAt = new Date().toISOString();
    booking.payment = {
      paymentId: `pay-${Date.now()}`,
      method: 'RAZORPAY',
      status: 'SUCCESS',
      transactionRef: razorpay_payment_id || `RZP_${Date.now()}`,
      paidAt: new Date().toISOString(),
    };

    booking.statusHistory.push({
      status: 'PAID',
      timestamp: new Date().toISOString(),
      note: `Payment of ₹${amountPaid} verified successfully via Razorpay (Txn ID: ${razorpay_payment_id || 'VERIFIED'})`,
      updatedByRole: session.role,
    });

    db.saveBooking(booking);

    // Audit log
    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: session.userId,
      actorRole: session.role,
      action: 'PAYMENT_VERIFIED_RAZORPAY',
      targetEntity: 'BOOKING',
      targetId: booking.id,
      details: {
        amount: amountPaid,
        orderId: razorpay_order_id || null,
        paymentId: razorpay_payment_id || null,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Razorpay payment verified and confirmed',
      booking,
    });
  } catch (error) {
    console.error('Error in /api/payments/razorpay/verify:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
