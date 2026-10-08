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

    // 1. Mandatory Authentication (BOLA / IDOR Prevention)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to access delivery tracking.' },
        { status: 401 }
      );
    }

    const order = db.getDeliveryTracking(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }

    // 2. Strict Authorization Check
    const isCustomer = session.userId === order.customer.id;
    const isPartner = session.userId === order.partner.id;
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPPORT';

    if (!isCustomer && !isPartner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view active deliveries assigned to your account.' },
        { status: 403 }
      );
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
