import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { canTransitionBooking } from '@/lib/db/stateMachine';
import { Booking, BookingStatus, UserRole, Review } from '@/lib/db/types';
import { getAuthSession } from '@/lib/auth/session';
import { generateDoorstepOtp } from '@/lib/security/aadhaarVerifier';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const role = (searchParams.get('role') as UserRole) || session?.role || 'CUSTOMER';
    const userId = searchParams.get('userId') || session?.userId;
    const providerId = searchParams.get('providerId');

    let bookings = db.getBookings();

    if (role === 'PROVIDER') {
      let targetProvId = providerId;
      if (!targetProvId && session && session.role === 'PROVIDER') {
        const prov = db.getProviderByUserId(session.userId);
        if (prov) targetProvId = prov.id;
      }
      targetProvId = targetProvId || 'prov-1';
      bookings = bookings.filter((b) => b.providerId === targetProvId);
    } else if (role === 'CUSTOMER') {
      const targetCustId = userId || 'usr-cust-1';
      bookings = bookings.filter((b) => b.customerId === targetCustId);
    }

    return NextResponse.json({ success: true, bookings, currentUserId: session?.userId });
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    const body = await request.json();
    const {
      providerId,
      customerId,
      category,
      subcategory,
      description,
      scheduledDate,
      scheduledTime,
      address,
    } = body;

    if (!providerId || !category || !description) {
      return NextResponse.json(
        { error: 'Missing required booking fields (providerId, category, description)' },
        { status: 400 }
      );
    }

    const provider = db.getProviderById(providerId);
    if (!provider) {
      return NextResponse.json({ error: 'Selected provider not found' }, { status: 404 });
    }

    // Authenticated user resolution
    const activeUserId = session?.userId || customerId || 'usr-cust-1';
    const customerUser = db.getUserById(activeUserId) || {
      id: activeUserId,
      name: session?.name || 'Suresh Babu',
      phone: session?.phone || '+91 98480 12345',
      role: 'CUSTOMER' as UserRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const settings = db.getSettings();
    const commissionPercent = settings.platformCommissionPercent;
    const visitingCharge = provider.pricingModel.visitingCharge;
    const estAmount = visitingCharge;
    const commissionAmt = (estAmount * commissionPercent) / 100;
    const providerPayout = estAmount - commissionAmt;

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      customerId: customerUser.id,
      customerName: customerUser.name,
      customerPhone: customerUser.phone,
      customerAddress: address || {
        id: 'addr-default',
        userId: customerUser.id,
        title: 'Home',
        street: 'Main Road',
        areaName: 'Kalamandir Center',
        city: 'Chilakaluripet',
        state: 'Andhra Pradesh',
        pincode: '522616',
        latitude: 16.0885,
        longitude: 80.166,
        isDefault: true,
      },
      providerId: provider.id,
      providerName: provider.businessName,
      providerPhone: db.getUserById(provider.userId)?.phone || '+91 94401 56789',
      category,
      subcategory: subcategory || 'Standard Service',
      description,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || 'Today Evening (5:00 PM)',
      status: 'REQUESTED',
      startOtp: generateDoorstepOtp(),
      statusHistory: [
        {
          status: 'REQUESTED',
          timestamp: new Date().toISOString(),
          note: `Booking requested by ${customerUser.name} via FixNear`,
          updatedByRole: 'CUSTOMER',
        },
      ],
      pricing: {
        estimatedAmount: estAmount,
        visitingCharges: visitingCharge,
        platformCommissionPercent: commissionPercent,
        platformCommissionAmount: commissionAmt,
        providerPayoutAmount: providerPayout,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveBooking(newBooking);

    // Audit log
    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: customerUser.id,
      actorRole: 'CUSTOMER',
      action: 'BOOKING_CREATED',
      targetEntity: 'BOOKING',
      targetId: newBooking.id,
      details: { providerId: provider.id, category, amount: estAmount },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession();
    const body = await request.json();
    const {
      bookingId,
      status: targetStatus,
      actorRole = session?.role || 'PROVIDER',
      note,
      finalAmount,
      priceMatchedAmount,
      paymentMethod,
      cancellationReason,
      isCollusion,
      startOtpInput,
    } = body;

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 1. Handling On-Platform Price Matching (Anti-Circumvention feature)
    if (priceMatchedAmount && priceMatchedAmount > 0) {
      booking.priceMatchedAmount = priceMatchedAmount;
      booking.pricing.finalAmount = priceMatchedAmount;
      const commission = (priceMatchedAmount * booking.pricing.platformCommissionPercent) / 100;
      booking.pricing.platformCommissionAmount = commission;
      booking.pricing.providerPayoutAmount = priceMatchedAmount - commission;
      booking.updatedAt = new Date().toISOString();
      booking.statusHistory.push({
        status: booking.status,
        timestamp: new Date().toISOString(),
        note: `Price matched to ₹${priceMatchedAmount} (Worker offline quote matched on app under FixNear Protection)`,
        updatedByRole: 'CUSTOMER',
      });
      db.saveBooking(booking);

      db.addAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actorId: session?.userId || booking.customerId,
        actorRole: 'CUSTOMER',
        action: 'PRICE_MATCHED_ON_PLATFORM',
        targetEntity: 'BOOKING',
        targetId: booking.id,
        details: { matchedAmount: priceMatchedAmount },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, booking, message: 'Price matched successfully on app' });
    }

    // 2. Doorstep Start-OTP validation before transitioning to IN_PROGRESS
    const startOtpValue = startOtpInput || body.startOtp;
    if (targetStatus === 'IN_PROGRESS' && booking.status !== 'IN_PROGRESS') {
      if (booking.startOtp && (!startOtpValue || String(startOtpValue).trim() !== String(booking.startOtp).trim())) {
        return NextResponse.json(
          { error: 'Invalid Doorstep Start-OTP. Please ask customer for the 4-digit code shown on their screen.' },
          { status: 400 }
        );
      }
    }

    // 3. State machine transition check
    const check = canTransitionBooking(booking.status, targetStatus as BookingStatus, actorRole as UserRole);
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }

    booking.status = targetStatus as BookingStatus;
    booking.updatedAt = new Date().toISOString();

    // 4. Anti-Circumvention Fraud & Collusion Strike Recording
    if (targetStatus === 'CANCELLED') {
      booking.cancellationReason = cancellationReason || note || 'Cancelled by user';
      if (isCollusion) {
        booking.cancellationFlaggedCollusion = true;
        // Penalize the provider for prompting off-platform cash collusion
        const provider = db.getProviderById(booking.providerId);
        if (provider) {
          provider.circumventionStrikes = (provider.circumventionStrikes || 0) + 1;
          provider.circumventionRiskScore = Math.min(100, (provider.circumventionRiskScore || 0) + 25);
          provider.metrics.cancellationRate = Math.min(100, provider.metrics.cancellationRate + 10);
          db.saveProvider(provider);

          db.addAuditLog({
            id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            actorId: session?.userId || booking.customerId,
            actorRole: 'CUSTOMER',
            action: 'PROVIDER_COLLUSION_SUSPECTED',
            targetEntity: 'PROVIDER',
            targetId: provider.id,
            details: {
              bookingId: booking.id,
              reason: cancellationReason,
              totalStrikes: provider.circumventionStrikes,
              riskScore: provider.circumventionRiskScore,
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    booking.statusHistory.push({
      status: targetStatus as BookingStatus,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${targetStatus}`,
      updatedByRole: actorRole as UserRole,
    });

    if (finalAmount && finalAmount > 0) {
      booking.pricing.finalAmount = finalAmount;
      const commission = (finalAmount * booking.pricing.platformCommissionPercent) / 100;
      booking.pricing.platformCommissionAmount = commission;
      booking.pricing.providerPayoutAmount = finalAmount - commission;
    }

    if (targetStatus === 'PAID') {
      const amountPaid = booking.pricing.finalAmount || booking.pricing.estimatedAmount;
      booking.payment = {
        paymentId: `pay-${Date.now()}`,
        method: paymentMethod || 'UPI',
        status: 'SUCCESS',
        transactionRef: `UPI/${Math.floor(100000000 + Math.random() * 900000000)}/FIXNEAR`,
        paidAt: new Date().toISOString(),
      };
    }

    if (targetStatus === 'COMPLETED') {
      const provider = db.getProviderById(booking.providerId);
      if (provider) {
        provider.metrics.completedJobs += 1;
        db.saveProvider(provider);
      }
    }

    db.saveBooking(booking);

    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: session?.userId || (actorRole === 'PROVIDER' ? booking.providerId : booking.customerId),
      actorRole: actorRole as UserRole,
      action: `BOOKING_STATUS_${targetStatus}`,
      targetEntity: 'BOOKING',
      targetId: booking.id,
      details: { newStatus: targetStatus, note, isCollusion },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Error in PATCH /api/bookings:', error);
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }
}

// Review submission
export async function PUT(request: Request) {
  try {
    const session = await getAuthSession();
    const body = await request.json();
    const {
      bookingId,
      customerId = session?.userId || 'usr-cust-1',
      rating,
      qualityRating,
      professionalismRating,
      valueRating,
      comment,
    } = body;

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Reviews can only be submitted for COMPLETED bookings' },
        { status: 400 }
      );
    }

    const existing = db.getReviews().find((r) => r.bookingId === bookingId);
    if (existing) {
      return NextResponse.json(
        { error: 'Review has already been submitted for this booking' },
        { status: 409 }
      );
    }

    const review: Review = {
      id: `rev-${Date.now()}`,
      bookingId,
      customerId,
      customerName: session?.name || booking.customerName,
      providerId: booking.providerId,
      rating: Number(rating) || 5,
      qualityRating: Number(qualityRating) || 5,
      professionalismRating: Number(professionalismRating) || 5,
      valueRating: Number(valueRating) || 5,
      comment: comment || 'Service completed satisfactorily.',
      createdAt: new Date().toISOString(),
    };

    db.saveReview(review);

    const provider = db.getProviderById(booking.providerId);
    if (provider) {
      const allReviews = db.getReviewsForProvider(provider.id);
      const totalScore = allReviews.reduce((sum, r) => sum + r.rating, 0);
      provider.metrics.totalReviews = allReviews.length;
      provider.metrics.rating = Math.round((totalScore / allReviews.length) * 10) / 10;
      db.saveProvider(provider);
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Error in PUT /api/bookings (Review):', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
