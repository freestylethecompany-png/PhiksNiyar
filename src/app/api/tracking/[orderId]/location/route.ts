import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';
import { broadcastTrackingEvent } from '@/lib/tracking/eventBus';
import { isOffRoute, fetchRoadRoute } from '@/lib/tracking/routingService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const session = await getAuthSession();
    const body = await request.json();

    const { latitude, longitude, heading = 0, speedKmh = 0 } = body;

    // 1. Coordinate Validation
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates provided. Latitude must be -90..90, Longitude -180..180.' },
        { status: 400 }
      );
    }

    // 2. Physical Speed Validation (Prevent unrealistic GPS spoofing > 140 km/h)
    if (speedKmh < 0 || speedKmh > 140) {
      return NextResponse.json(
        { error: 'Unrealistic vehicle speed detected.' },
        { status: 400 }
      );
    }

    // 3. Find Order
    let order = db.getDeliveryTracking(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 4. Authentication & Authorization: Only assigned partner or admin can report location
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }
    const isPartner = session.userId === order.partner.id;
    const isAdmin = session.role === 'ADMIN';
    if (!isPartner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only the assigned delivery partner can update location coordinates.' },
        { status: 403 }
      );
    }

    // 5. Security: Enforce tracking stop when delivery is complete
    if (!order.trackingActive || order.status === 'DELIVERED') {
      return NextResponse.json(
        { error: 'Live tracking has concluded for this delivery order.' },
        { status: 400 }
      );
    }

    // 5. Update Partner Location
    let updatedOrder = db.updateDeliveryPartnerLocation(
      orderId,
      latitude,
      longitude,
      heading,
      speedKmh
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Failed to update partner location' }, { status: 500 });
    }

    let routeRecalculated = false;

    // 6. Off-Route Cross-Track Deviation Check
    // If delivery partner has deviated by > 65 meters from current road route,
    // recalculate new road route dynamically!
    const partnerPoint = { latitude, longitude };
    const customerPoint = updatedOrder.customer.location;

    if (isOffRoute(partnerPoint, updatedOrder.routeGeometry, 65)) {
      console.log(`[ROUTING ENGINE] Off-route deviation detected for ${orderId}. Recalculating path...`);
      try {
        const newRoute = await fetchRoadRoute(partnerPoint, customerPoint);
        updatedOrder.routeGeometry = newRoute.geometry;
        updatedOrder.metrics.remainingDistanceKm = newRoute.distanceKm;
        updatedOrder.metrics.etaMinutes = newRoute.durationMinutes;
        updatedOrder.metrics.estimatedArrivalTimestamp = new Date(
          Date.now() + newRoute.durationMinutes * 60000
        ).toISOString();
        updatedOrder = db.saveDeliveryTracking(updatedOrder);
        routeRecalculated = true;
      } catch (err) {
        console.warn('Dynamic route recalculation error:', err);
      }
    }

    // 7. Broadcast in real time to all connected clients
    broadcastTrackingEvent(
      routeRecalculated ? 'ROUTE_RECALCULATED' : 'LOCATION_UPDATE',
      updatedOrder
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      routeRecalculated,
    });
  } catch (error) {
    console.error('Error in POST /api/tracking/[orderId]/location:', error);
    return NextResponse.json({ error: 'Failed to process location update' }, { status: 500 });
  }
}
