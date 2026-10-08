import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const session = await getAuthSession();

    let order = db.getDeliveryTracking(orderId);
    if (!order) {
      // If order not found, check if it's the default seeded order
      db.seedDeliveriesIfEmpty();
      order = db.getDeliveryTracking(orderId);
    }

    if (!order) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }

    // Security Check: If a session is active, verify that user has authorization
    // (Customer, assigned Partner, or Admin)
    if (session) {
      const isCustomer = session.userId === order.customer.id;
      const isPartner = session.userId === order.partner.id;
      const isAdmin = session.role === 'ADMIN';

      if (!isCustomer && !isPartner && !isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only track your own active deliveries.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error in GET /api/tracking/[orderId]:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking data' }, { status: 500 });
  }
}
