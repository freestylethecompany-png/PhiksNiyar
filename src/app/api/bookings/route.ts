import { NextResponse } from 'next/server';
import { db } from '@/lib/db/database';
import { canTransitionBooking } from '@/lib/db/stateMachine';
import { Booking, BookingStatus, UserRole } from '@/lib/db/types';
import { getAuthSession } from '@/lib/auth/session';
import { generateSecureDoorstepOtp } from '@/lib/security/cryptoUtils';

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
          'PROVIDER_ON_THE_WAY',
          'ARRIVED',
          'IN_PROGRESS',
          'PAYMENT_PENDING',
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

    // 1. Mandatory Authentication: Customer role required
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in with your phone to book a service.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      providerId,
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

    // 2. Authoritative customer identity from verified session (prevents impersonation)
    const customerUser = db.getUserById(session.userId);
    if (!customerUser) {
      return NextResponse.json({ error: 'Customer user profile not found' }, { status: 404 });
    }

    // 3. Authoritative server-side pricing calculation (prevents client price tampering)
    const settings = db.getSettings();
    const commissionPercent = settings.platformCommissionPercent || 10.0;
    const visitingCharge = Number(provider.pricingModel.visitingCharge) || 199;
    const estAmount = visitingCharge;
    const commissionAmt = Math.round(((estAmount * commissionPercent) / 100) * 100) / 100;
    const providerPayout = Math.round((estAmount - commissionAmt) * 100) / 100;

    // 4. Generate cryptographically sound 4-digit Doorstep Start-OTP
    const secureStartOtp = generateSecureDoorstepOtp();

    const providerUser = db.getUserById(provider.userId);

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      customerId: customerUser.id,
      customerName: customerUser.name,
      customerPhone: customerUser.phone,
      customerAddress: address || {
        id: `addr-${Date.now()}`,
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
      providerPhone: providerUser?.phone || '+91 8647 254999',
      category: category.trim().slice(0, 100),
      subcategory: subcategory ? subcategory.trim().slice(0, 100) : 'Standard Service',
      description: description.trim().slice(0, 500),
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || 'Today Evening (5:00 PM)',
      status: 'REQUESTED',
      startOtp: secureStartOtp,
      startOtpAttempts: 0,
      statusHistory: [
        {
          status: 'REQUESTED',
          timestamp: new Date().toISOString(),
          note: `Booking requested by customer via PhiksNiyar`,
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
      details: {
        providerId: provider.id,
        category: newBooking.category,
        visitingCharge,
      },
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

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 1. Strict Ownership / Authorization Verification
    const isCustomer = session.userId === booking.customerId;
    let isAssignedProvider = false;
    const provider = db.getProviderById(booking.providerId);
    if (provider && provider.userId === session.userId) {
      isAssignedProvider = true;
    }
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPPORT';

    if (!isCustomer && !isAssignedProvider && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to modify this booking.' },
        { status: 403 }
      );
    }

    // Never trust client-supplied actorRole; use verified session role
    const effectiveRole = session.role;

    // 2. Propose Additional Charges (Provider quotes extra parts/labor)
    if (proposeAdditionalCharges) {
      if (!isAssignedProvider && !isAdmin) {
        return NextResponse.json(
          { error: 'Only the assigned provider can propose additional charges.' },
          { status: 403 }
        );
      }
      const extraAmt = Number(proposeAdditionalCharges.amount);
      if (isNaN(extraAmt) || extraAmt <= 0 || extraAmt > 50000) {
        return NextResponse.json(
          { error: 'Invalid additional charges amount (must be positive, max ₹50,000).' },
          { status: 400 }
        );
      }

      booking.additionalCharges = {
        proposedAmount: extraAmt,
        reason: String(proposeAdditionalCharges.reason || 'Additional parts / repair scope').slice(0, 300),
        customerApproved: false,
      };
      booking.status = 'AWAITING_PRICE_CONFIRMATION';
      booking.updatedAt = new Date().toISOString();
      booking.statusHistory.push({
        status: 'AWAITING_PRICE_CONFIRMATION',
        timestamp: new Date().toISOString(),
        note: `Technician proposed additional ₹${extraAmt} (${booking.additionalCharges.reason}). Awaiting customer approval.`,
        updatedByRole: effectiveRole,
      });
      db.saveBooking(booking);

      db.addAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actorId: session.userId,
        actorRole: effectiveRole,
        action: 'ADDITIONAL_CHARGES_PROPOSED',
        targetEntity: 'BOOKING',
        targetId: booking.id,
        details: { proposedAmount: extraAmt, reason: booking.additionalCharges.reason },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        booking,
        message: 'Additional charges submitted for customer approval.',
      });
    }

    // 3. Approve / Reject Additional Charges (Customer explicit consent)
    if (approveAdditionalCharges !== undefined) {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json(
          { error: 'Only the customer or administrator can approve or reject additional charges.' },
          { status: 403 }
        );
      }
      if (!booking.additionalCharges) {
        return NextResponse.json(
          { error: 'No pending additional charges found on this booking.' },
          { status: 400 }
        );
      }

      if (approveAdditionalCharges === true) {
        booking.additionalCharges.customerApproved = true;
        booking.additionalCharges.approvedAt = new Date().toISOString();
        const baseAmount = booking.pricing.finalAmount || booking.pricing.estimatedAmount;
        const newTotal = baseAmount + booking.additionalCharges.proposedAmount;
        booking.pricing.finalAmount = newTotal;
        const comm = Math.round(((newTotal * booking.pricing.platformCommissionPercent) / 100) * 100) / 100;
        booking.pricing.platformCommissionAmount = comm;
        booking.pricing.providerPayoutAmount = Math.round((newTotal - comm) * 100) / 100;
        booking.status = 'IN_PROGRESS';
        booking.statusHistory.push({
          status: 'IN_PROGRESS',
          timestamp: new Date().toISOString(),
          note: `Customer approved additional ₹${booking.additionalCharges.proposedAmount}. New total: ₹${newTotal}.`,
          updatedByRole: 'CUSTOMER',
        });
      } else {
        booking.status = 'IN_PROGRESS';
        booking.statusHistory.push({
          status: 'IN_PROGRESS',
          timestamp: new Date().toISOString(),
          note: `Customer declined additional charges of ₹${booking.additionalCharges.proposedAmount}.`,
          updatedByRole: 'CUSTOMER',
        });
        delete booking.additionalCharges;
      }

      booking.updatedAt = new Date().toISOString();
      db.saveBooking(booking);

      db.addAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actorId: session.userId,
        actorRole: effectiveRole,
        action: approveAdditionalCharges ? 'ADDITIONAL_CHARGES_APPROVED' : 'ADDITIONAL_CHARGES_DECLINED',
        targetEntity: 'BOOKING',
        targetId: booking.id,
        details: { approved: approveAdditionalCharges },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        booking,
        message: approveAdditionalCharges ? 'Additional charges approved.' : 'Additional charges declined.',
      });
    }

    // 4. Report Cash Payment (Provider reports physical cash received)
    if (reportCashPayment) {
      if (!isAssignedProvider && !isAdmin) {
        return NextResponse.json(
          { error: 'Only the assigned provider can report cash collection.' },
          { status: 403 }
        );
      }
      const cashAmt = Number(reportCashPayment.amount);
      if (isNaN(cashAmt) || cashAmt <= 0) {
        return NextResponse.json({ error: 'Invalid cash collection amount.' }, { status: 400 });
      }

      booking.cashPayment = {
        reportedAmount: cashAmt,
        status: 'CASH_REPORTED',
        reportedByUserId: session.userId,
        reportedAt: new Date().toISOString(),
      };
      booking.payment = {
        method: 'CASH',
        status: 'PENDING',
        transactionRef: `CASH/REP/${booking.id}`,
        paidAt: new Date().toISOString(),
      };
      booking.updatedAt = new Date().toISOString();
      booking.statusHistory.push({
        status: booking.status,
        timestamp: new Date().toISOString(),
        note: `Technician reported cash collection of ₹${cashAmt}. Awaiting customer verification.`,
        updatedByRole: 'PROVIDER',
      });
      db.saveBooking(booking);

      db.addAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actorId: session.userId,
        actorRole: effectiveRole,
        action: 'CASH_PAYMENT_REPORTED',
        targetEntity: 'BOOKING',
        targetId: booking.id,
        details: { reportedAmount: cashAmt },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        booking,
        message: 'Cash payment reported. Awaiting confirmation.',
      });
    }

    // 5. Confirm Cash Payment (Customer or Admin validates cash handover)
    if (confirmCashPayment === true) {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json(
          { error: 'Only customer or administrator can confirm cash payments.' },
          { status: 403 }
        );
      }
      if (!booking.cashPayment || booking.cashPayment.status !== 'CASH_REPORTED') {
        return NextResponse.json(
          { error: 'No reported cash payment awaiting customer confirmation.' },
          { status: 400 }
        );
      }

      booking.cashPayment.status = 'CASH_CONFIRMED';
      booking.cashPayment.confirmedByUserId = session.userId;
      booking.cashPayment.confirmedAt = new Date().toISOString();
      if (booking.payment) {
        booking.payment.status = 'SUCCESS';
      }
      booking.status = 'COMPLETED';
      booking.updatedAt = new Date().toISOString();

      // Automatically activate 7-day warranty on completion
      const warranty = db.createWarranty({
        id: `war-${Date.now()}`,
        bookingId: booking.id,
        customerId: booking.customerId,
        providerId: booking.providerId,
        serviceCategory: booking.category,
        warrantyStart: new Date().toISOString(),
        warrantyEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
      });
      booking.warrantyId = warranty.id;

      booking.statusHistory.push({
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        note: `Cash payment of ₹${booking.cashPayment.reportedAmount} verified by customer. 7-Day Warranty activated.`,
        updatedByRole: effectiveRole,
      });
      db.saveBooking(booking);

      db.addAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actorId: session.userId,
        actorRole: effectiveRole,
        action: 'CASH_PAYMENT_CONFIRMED',
        targetEntity: 'BOOKING',
        targetId: booking.id,
        details: { confirmedAmount: booking.cashPayment.reportedAmount, warrantyId: warranty.id },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        booking,
        message: 'Cash payment confirmed and 7-Day Warranty activated.',
      });
    }

    // 6. Safe Price Matching (Anti-Circumvention Protection)
    if (priceMatchedAmount !== undefined) {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json(
          { error: 'Only the customer or administrator can confirm price matching.' },
          { status: 403 }
        );
      }

      const matchedNum = Number(priceMatchedAmount);
      // Validate bounds: Must be a positive reasonable number, not lower than minimum visit charge
      const minAllowable = Math.max(booking.pricing.visitingCharges * 0.5, 99);
      if (isNaN(matchedNum) || matchedNum < minAllowable || matchedNum > 50000) {
        return NextResponse.json(
          { error: `Invalid price matched amount. Must be between ₹${minAllowable} and ₹50,000.` },
          { status: 400 }
        );
      }

      booking.priceMatchedAmount = matchedNum;
      booking.pricing.finalAmount = matchedNum;
      const commission = Math.round(((matchedNum * booking.pricing.platformCommissionPercent) / 100) * 100) / 100;
      booking.pricing.platformCommissionAmount = commission;
      booking.pricing.providerPayoutAmount = Math.round((matchedNum - commission) * 100) / 100;
      booking.updatedAt = new Date().toISOString();
      booking.statusHistory.push({
        status: booking.status,
        timestamp: new Date().toISOString(),
        note: `Price matched to ₹${matchedNum} (Offline worker quote verified on PhiksNiyar)`,
        updatedByRole: 'CUSTOMER',
      });
      db.saveBooking(booking);

      db.addAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actorId: session.userId,
        actorRole: effectiveRole,
        action: 'PRICE_MATCHED_ON_PLATFORM',
        targetEntity: 'BOOKING',
        targetId: booking.id,
        details: { matchedAmount: matchedNum },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, booking, message: 'Price matched successfully on app' });
    }

    // 7. Status Transition Verification
    if (!targetStatus) {
      return NextResponse.json({ error: 'Target status is required' }, { status: 400 });
    }

    // Normalize backward compatible status aliases
    let normalizedTarget = targetStatus as BookingStatus;
    if ((targetStatus as any) === 'PROVIDER_ON_THE_WAY') normalizedTarget = 'ON_THE_WAY';
    if ((targetStatus as any) === 'PAYMENT_PENDING') normalizedTarget = 'AWAITING_PAYMENT';

    // Validate state machine transitions
    const check = canTransitionBooking(booking.status, normalizedTarget, effectiveRole);
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }

    // 8. Cryptographic Doorstep Start-OTP Validation (when starting active work)
    if (normalizedTarget === 'IN_PROGRESS' && booking.status !== 'IN_PROGRESS') {
      if (!isAssignedProvider && !isAdmin) {
        return NextResponse.json(
          { error: 'Only the assigned provider or admin can start work with the Doorstep OTP.' },
          { status: 403 }
        );
      }

      // Check brute force attempts on OTP (max 3 failed attempts)
      if ((booking.startOtpAttempts || 0) >= 3) {
        return NextResponse.json(
          { error: 'Maximum OTP verification attempts exceeded. Please contact PhiksNiyar Support.' },
          { status: 429 }
        );
      }

      const inputCode = String(startOtpInput || body.startOtp || '').trim();
      if (!booking.startOtp || inputCode !== String(booking.startOtp).trim()) {
        booking.startOtpAttempts = (booking.startOtpAttempts || 0) + 1;
        db.saveBooking(booking);

        db.addAuditLog({
          id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          actorId: session.userId,
          actorRole: effectiveRole,
          action: 'OTP_FAILED',
          targetEntity: 'BOOKING',
          targetId: booking.id,
          details: { attempt: booking.startOtpAttempts },
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json(
          {
            error: `Invalid Doorstep Start-OTP. Please ask customer for the 4-digit code shown on their screen. (${3 - booking.startOtpAttempts} attempts remaining)`,
          },
          { status: 400 }
        );
      }

      // OTP verified successfully
      booking.otpVerifiedAt = new Date().toISOString();
      delete booking.startOtp; // Invalidate OTP after successful doorstep verification

      db.addAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actorId: session.userId,
        actorRole: effectiveRole,
        action: 'OTP_VERIFIED',
        targetEntity: 'BOOKING',
        targetId: booking.id,
        details: { verifiedAt: booking.otpVerifiedAt },
        timestamp: new Date().toISOString(),
      });
    }

    // 9. Automatic 7-Day Warranty Activation upon COMPLETED transition
    if (normalizedTarget === 'COMPLETED' && !booking.warrantyId) {
      const warranty = db.createWarranty({
        id: `war-${Date.now()}`,
        bookingId: booking.id,
        customerId: booking.customerId,
        providerId: booking.providerId,
        serviceCategory: booking.category,
        warrantyStart: new Date().toISOString(),
        warrantyEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
      });
      booking.warrantyId = warranty.id;
    }

    // 10. Apply Status Transition
    booking.status = normalizedTarget;
    booking.updatedAt = new Date().toISOString();

    if (cancellationReason) {
      booking.cancellationReason = String(cancellationReason).slice(0, 300);
    }
    if (isCollusion && provider) {
      booking.cancellationFlaggedCollusion = true;
      provider.circumventionStrikes = (provider.circumventionStrikes || 0) + 1;
      provider.circumventionRiskScore = Math.min((provider.circumventionRiskScore || 0) + 30, 100);
      db.saveProvider(provider);
    }

    booking.statusHistory.push({
      status: normalizedTarget,
      timestamp: new Date().toISOString(),
      note: note ? String(note).slice(0, 300) : `Status updated to ${normalizedTarget} by ${effectiveRole}`,
      updatedByRole: effectiveRole,
    });

    db.saveBooking(booking);

    // Audit log
    db.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: session.userId,
      actorRole: effectiveRole,
      action: `BOOKING_STATUS_${normalizedTarget}`,
      targetEntity: 'BOOKING',
      targetId: booking.id,
      details: { previousStatus: booking.status, newStatus: normalizedTarget },
      timestamp: new Date().toISOString(),
    });

    // Sanitize response: do NOT return startOtp to provider
    const responseBooking = { ...booking };
    if (!isCustomer) {
      delete responseBooking.startOtp;
    }

    return NextResponse.json({
      success: true,
      booking: responseBooking,
      message: `Booking status updated to ${normalizedTarget}`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/bookings:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
