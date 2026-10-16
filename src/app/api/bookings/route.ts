import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { Booking } from '@/lib/db/types';
import { getAuthSession } from '@/lib/auth/session';
import { BookingService, BookingServiceError } from '@/lib/bookings/bookingService';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();

    // 1. Mandatory Authentication (BOLA / IDOR Prevention)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to view bookings.' },
        { status: 401 }
      );
    }

    let allBookings = db.getBookings();
    let accessibleBookings: Booking[] = [];

    if (session.role === 'ADMIN' || session.role === 'SUPPORT') {
      accessibleBookings = allBookings;
    } else if (session.role === 'PROVIDER') {
      const provider = db.getProviderByUserId(session.userId);
      if (!provider) {
        return NextResponse.json({ success: true, bookings: [] });
      }
      accessibleBookings = allBookings.filter((b) => b.providerId === provider.id);

      // SECURITY CRITICAL: Strip Doorstep Start-OTP and protect residential street addresses
      // Providers must NEVER see startOtp before or after arrival.
      accessibleBookings = accessibleBookings.map((b) => {
        const sanitized = { ...b };
        delete sanitized.startOtp; // Strip OTP from provider payload

        // If booking is not yet accepted/active, mask exact street address (locality only)
        const isActiveOrArrived = [
          'ACCEPTED',
          'SCHEDULED',
          'ON_THE_WAY',
          'PROVIDER_ON_THE_WAY',
          'ARRIVED',
          'IN_PROGRESS',
          'AWAITING_PRICE_CONFIRMATION',
          'AWAITING_PAYMENT',
          'PAYMENT_PENDING',
          'PAID',
          'COMPLETED',
        ].includes(b.status);

        if (!isActiveOrArrived && sanitized.customerAddress) {
          sanitized.customerAddress = {
            ...sanitized.customerAddress,
            street: 'Revealed upon acceptance',
          };
        }

        return sanitized;
      });
    } else {
      // CUSTOMER Role: strictly limited to their own bookings
      accessibleBookings = allBookings.filter((b) => b.customerId === session.userId);
    }

    return NextResponse.json({
      success: true,
      count: accessibleBookings.length,
      bookings: accessibleBookings,
      currentUserId: session.userId,
    });
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in with your phone to book a service.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const newBooking = BookingService.createBooking(session, body);

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (error: any) {
    if (error instanceof BookingServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookingId,
      status: targetStatus,
      note,
      priceMatchedAmount,
      cancellationReason,
      isCollusion,
      startOtpInput,
      proposeAdditionalCharges,
      approveAdditionalCharges,
      reportCashPayment,
      confirmCashPayment,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // 1. Propose Additional Charges
    if (proposeAdditionalCharges) {
      const updated = BookingService.proposeAdditionalCharges(session, {
        bookingId,
        amount: proposeAdditionalCharges.amount,
        reason: proposeAdditionalCharges.reason,
      });
      return NextResponse.json({
        success: true,
        booking: updated,
        message: 'Additional charges submitted for customer approval.',
      });
    }

    // 2. Approve / Reject Additional Charges
    if (approveAdditionalCharges !== undefined) {
      const updated = BookingService.respondToAdditionalCharges(session, {
        bookingId,
        approved: Boolean(approveAdditionalCharges),
      });
      return NextResponse.json({
        success: true,
        booking: updated,
        message: approveAdditionalCharges ? 'Additional charges approved.' : 'Additional charges declined.',
      });
    }

    // 3. Report Cash Payment
    if (reportCashPayment) {
      const updated = BookingService.reportCashPayment(session, {
        bookingId,
        amount: reportCashPayment.amount,
      });
      return NextResponse.json({
        success: true,
        booking: updated,
        message: 'Cash payment reported. Awaiting confirmation.',
      });
    }

    // 4. Confirm Cash Payment
    if (confirmCashPayment === true) {
      const updated = BookingService.confirmCashPayment(session, { bookingId });
      return NextResponse.json({
        success: true,
        booking: updated,
        message: 'Cash payment confirmed and 7-Day Warranty activated.',
      });
    }

    // 5. Price Matching
    if (priceMatchedAmount !== undefined) {
      const updated = BookingService.priceMatch(session, {
        bookingId,
        priceMatchedAmount,
      });
      return NextResponse.json({
        success: true,
        booking: updated,
        message: 'Price matched successfully on app',
      });
    }

    // 6. Status Transition
    if (!targetStatus) {
      return NextResponse.json({ error: 'Target status is required' }, { status: 400 });
    }

    const result = BookingService.transitionBookingStatus(session, {
      bookingId,
      targetStatus,
      note,
      startOtpInput: startOtpInput || body.startOtp,
      cancellationReason,
      isCollusion,
    });

    // Sanitize response: do NOT return startOtp to provider
    const responseBooking = { ...result.booking };
    if (session.role === 'PROVIDER') {
      delete responseBooking.startOtp;
    }

    return NextResponse.json({
      success: true,
      booking: responseBooking,
      idempotent: result.idempotent,
      message: result.message,
    });
  } catch (error: any) {
    if (error instanceof BookingServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error in PATCH /api/bookings:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
