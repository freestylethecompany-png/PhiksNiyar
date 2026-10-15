import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';

const VALID_CATEGORIES = [
  'poor_service',
  'wrong_price',
  'provider_didnt_arrive',
  'damage',
  'payment_issue',
  'warranty_issue',
  'safety_issue',
];

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const allDisputes = db.getDisputes();

    if (session.role === 'ADMIN' || session.role === 'SUPPORT') {
      return NextResponse.json({ success: true, count: allDisputes.length, disputes: allDisputes });
    }

    // Customer or provider views only their disputes
    const userDisputes = allDisputes.filter((d) => {
      const b = db.getBookingById(d.bookingId);
      return d.raisedBy === session.userId || b?.customerId === session.userId || b?.providerId === session.userId;
    });

    return NextResponse.json({ success: true, count: userDisputes.length, disputes: userDisputes });
  } catch (error) {
    console.error('Error in GET /api/disputes:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, category, description, evidenceUrls } = body;

    if (!bookingId || !category || !description) {
      return NextResponse.json({ error: 'bookingId, category, and description are required.' }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid dispute category. Allowed: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Authorize participant
    const isCustomer = session.userId === booking.customerId;
    const provider = db.getProviderById(booking.providerId);
    const isProvider = provider && provider.userId === session.userId;
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPPORT';

    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You are not a party to this booking.' }, { status: 403 });
    }

    const dispute = db.createDispute({
      id: `dsp-${Date.now()}`,
      bookingId: booking.id,
      raisedBy: session.userId,
      raisedByRole: session.role,
      category,
      description: String(description).trim().slice(0, 1000),
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls.slice(0, 5) : [],
      status: 'OPEN',
    });

    // Transition booking state to DISPUTED
    booking.status = 'DISPUTED';
    booking.updatedAt = new Date().toISOString();
    booking.statusHistory.push({
      status: 'DISPUTED',
      timestamp: new Date().toISOString(),
      note: `Dispute raised (${category}) by ${session.role}: ${dispute.description.slice(0, 100)}`,
      updatedByRole: session.role,
    });
    db.saveBooking(booking);

    // Audit log
    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: session.userId,
      actorRole: session.role,
      action: 'DISPUTE_RAISED',
      targetEntity: 'DISPUTE',
      targetId: dispute.id,
      details: { bookingId: booking.id, category },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Dispute recorded. Platform support will investigate promptly.',
      dispute,
    });
  } catch (error) {
    console.error('Error in POST /api/disputes:', error);
    return NextResponse.json({ error: 'Failed to create dispute.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPPORT')) {
      return NextResponse.json({ error: 'Forbidden: Admin authorization required to update dispute status.' }, { status: 403 });
    }

    const body = await request.json();
    const { disputeId, status, resolutionNotes, refundAmount } = body;

    if (!disputeId) {
      return NextResponse.json({ error: 'disputeId is required.' }, { status: 400 });
    }

    const dispute = db.getDisputeById(disputeId);
    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found.' }, { status: 404 });
    }

    const updated = db.updateDispute(disputeId, {
      status: status || dispute.status,
      resolutionNotes: resolutionNotes || dispute.resolutionNotes,
      refundAmount: refundAmount !== undefined ? Number(refundAmount) : dispute.refundAmount,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Could not update dispute.' }, { status: 500 });
    }

    // Audit log
    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: session.userId,
      actorRole: session.role,
      action: 'DISPUTE_RESOLVED',
      targetEntity: 'DISPUTE',
      targetId: disputeId,
      details: { newStatus: status, resolutionNotes },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Dispute updated successfully.',
      dispute: db.getDisputeById(disputeId),
    });
  } catch (error) {
    console.error('Error in PATCH /api/disputes:', error);
    return NextResponse.json({ error: 'Failed to update dispute.' }, { status: 500 });
  }
}
