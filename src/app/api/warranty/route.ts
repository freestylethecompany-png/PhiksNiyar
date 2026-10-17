import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { getAuthSession } from '@/lib/auth/session';
import { generateSecureId } from '@/lib/security/cryptoUtils';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (bookingId) {
      const warranty = db.getWarrantyByBookingId(bookingId);
      if (!warranty) {
        return NextResponse.json({ error: 'Warranty record not found for this booking.' }, { status: 404 });
      }

      // Check ownership
      const isOwner = session.userId === warranty.customerId;
      const isAdmin = session.role === 'ADMIN' || session.role === 'SUPPORT';
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to this warranty record.' }, { status: 403 });
      }

      return NextResponse.json({ success: true, warranty });
    }

    // List customer warranties
    const warranties = db.getWarrantiesByCustomerId(session.userId);
    return NextResponse.json({ success: true, count: warranties.length, warranties });
  } catch (error) {
    console.error('Error in GET /api/warranty:', error);
    return NextResponse.json({ error: 'Failed to fetch warranty information.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, claimReason } = body;

    if (!bookingId || !claimReason) {
      return NextResponse.json({ error: 'bookingId and claimReason are required.' }, { status: 400 });
    }

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Strictly verify ownership
    if (booking.customerId !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: You can only file warranty claims on your own bookings.' }, { status: 403 });
    }

    const warranty = db.getWarrantyByBookingId(bookingId);
    if (!warranty) {
      return NextResponse.json({ error: 'No active warranty registered for this booking.' }, { status: 404 });
    }

    if (warranty.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Warranty is currently in '${warranty.status}' state.` }, { status: 400 });
    }

    // Check expiration (7-day policy window)
    const now = new Date().getTime();
    const expiry = new Date(warranty.warrantyEnd).getTime();
    if (now > expiry) {
      return NextResponse.json({ error: 'The 7-Day Free Rework warranty window for this booking has expired.' }, { status: 400 });
    }

    const reasonSanitized = String(claimReason).trim().slice(0, 500);
    const claimed = db.claimWarranty(warranty.id, reasonSanitized);

    if (!claimed) {
      return NextResponse.json({ error: 'Could not process warranty claim.' }, { status: 500 });
    }

    // Transition booking status to WARRANTY_CLAIMED
    booking.status = 'WARRANTY_CLAIMED';
    booking.updatedAt = new Date().toISOString();
    booking.statusHistory.push({
      status: 'WARRANTY_CLAIMED',
      timestamp: new Date().toISOString(),
      note: `Customer filed 7-day warranty rework claim: ${reasonSanitized}`,
      updatedByRole: 'CUSTOMER',
    });
    db.saveBooking(booking);

    // Audit log
    db.addAuditLog({
      id: generateSecureId('aud'),
      actorId: session.userId,
      actorRole: session.role,
      action: 'WARRANTY_CLAIMED',
      targetEntity: 'WARRANTY',
      targetId: warranty.id,
      details: { bookingId: booking.id, claimReason: reasonSanitized },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: '7-Day Warranty claim filed successfully. A service partner will contact you for free rework.',
      warranty: db.getWarrantyByBookingId(bookingId),
    });
  } catch (error) {
    console.error('Error in POST /api/warranty:', error);
    return NextResponse.json({ error: 'Failed to process warranty claim.' }, { status: 500 });
  }
}
