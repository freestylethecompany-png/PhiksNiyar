import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
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
            receipt: `rcpt_${booking.id}`,
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
        console.warn('Live Razorpay API call failed, falling back to simulated sandbox:', e);
      }
    }

    // Sandbox / Development Order
    const simulatedOrderId = `order_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    return NextResponse.json({
      success: true,
      isProduction: false,
      message: 'Razorpay sandbox order created. Configure RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env for production payments.',
      orderId: simulatedOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: razorpayKeyId || 'rzp_test_SANDBOX_KEY_LOCALAI',
    });
  } catch (error) {
    console.error('Error in /api/payments/razorpay/create-order:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
