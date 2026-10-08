import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';
import { broadcastTrackingEvent } from '@/lib/tracking/eventBus';
import { DeliveryStatus } from '@/lib/db/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const session = await getAuthSession();
    const body = await request.json();
    const { status, note } = body;

    const validStatuses: DeliveryStatus[] = [
      'ORDER_CONFIRMED',
      'PREPARING',
      'PICKED_UP',
      'ON_THE_WAY',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const order = db.getDeliveryTracking(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = db.updateDeliveryStatus(orderId, status as DeliveryStatus, note);
    if (!updatedOrder) {
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // If order is linked to a booking, synchronize booking state
    if (updatedOrder.bookingId) {
      const booking = db.getBookingById(updatedOrder.bookingId);
      if (booking) {
        if (status === 'ON_THE_WAY') {
          booking.status = 'PROVIDER_ON_THE_WAY';
        } else if (status === 'DELIVERED') {
          booking.status = 'ARRIVED';
        }
        booking.updatedAt = new Date().toISOString();
        db.saveBooking(booking);
      }
    }

    // Broadcast status change across real-time bus
    const eventType = status === 'DELIVERED' ? 'DELIVERY_COMPLETED' : 'STATUS_UPDATE';
    broadcastTrackingEvent(eventType, updatedOrder);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error in PATCH /api/tracking/[orderId]/status:', error);
    return NextResponse.json({ error: 'Failed to update delivery status' }, { status: 500 });
  }
}
