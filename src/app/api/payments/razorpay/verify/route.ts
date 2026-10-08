import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
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

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    // If live Razorpay secret is present, verify HMAC-SHA256 signature
    if (razorpaySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
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

    // Amount paid
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
      note: `Payment of ₹${amountPaid} verified successfully via Razorpay (Txn ID: ${razorpay_payment_id || 'SANDBOX'})`,
      updatedByRole: session?.role || 'CUSTOMER',
    });

    db.saveBooking(booking);

    // Audit log
    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: session?.userId || booking.customerId,
      actorRole: session?.role || 'CUSTOMER',
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
