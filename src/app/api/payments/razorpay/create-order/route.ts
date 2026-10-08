import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Ownership check: Customer or Admin only
    const isCustomer = session.userId === booking.customerId;
    const isAdmin = session.role === 'ADMIN';
    if (!isCustomer && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to create payment orders for this booking.' },
        { status: 403 }
      );
    }

    const amount = booking.pricing.finalAmount || booking.pricing.estimatedAmount;
    const amountInPaise = Math.round(amount * 100);

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (razorpayKeyId && razorpayKeySecret) {
      try {
        const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${booking.id.slice(0, 30)}`,
            notes: {
              bookingId: booking.id,
              market: 'Chilakaluripet',
              category: booking.category,
            },
          }),
        });

        if (rzpResponse.ok) {
          const order = await rzpResponse.json();
          return NextResponse.json({
            success: true,
            isProduction: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: razorpayKeyId,
          });
        }
      } catch (e) {
        console.warn('Live Razorpay API call error:', e);
      }
    }

    // Development fallback order
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return NextResponse.json(
        { error: 'Payment gateway is temporarily unavailable. Please pay via UPI QR or Cash on Delivery.' },
        { status: 503 }
      );
    }

    const simulatedOrderId = `order_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    return NextResponse.json({
      success: true,
      isProduction: false,
      message: 'Razorpay sandbox order created.',
      orderId: simulatedOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: razorpayKeyId || 'rzp_test_SANDBOX_KEY_FIXNEAR',
    });
  } catch (error) {
    console.error('Error in /api/payments/razorpay/create-order:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
