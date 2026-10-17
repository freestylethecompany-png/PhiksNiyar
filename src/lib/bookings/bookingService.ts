import { db } from '@/lib/db/database';
import { canTransitionBooking } from '@/lib/db/stateMachine';
import { Booking, BookingStatus, UserRole } from '@/lib/db/types';
import { AuthSessionPayload } from '@/lib/auth/session';
import { generateSecureDoorstepOtp, generateSecureId } from '@/lib/security/cryptoUtils';

export interface CreateBookingInput {
  providerId: string;
  category: string;
  subcategory?: string;
  description: string;
  scheduledDate?: string;
  scheduledTime?: string;
  address?: any;
}

export interface TransitionBookingInput {
  bookingId: string;
  targetStatus: string;
  note?: string;
  startOtpInput?: string;
  cancellationReason?: string;
  isCollusion?: boolean;
}

export interface ProposeAdditionalChargesInput {
  bookingId: string;
  amount: number;
  reason?: string;
}

export interface RespondAdditionalChargesInput {
  bookingId: string;
  approved: boolean;
}

export interface ReportCashPaymentInput {
  bookingId: string;
  amount: number;
}

export interface ConfirmCashPaymentInput {
  bookingId: string;
}

export interface PriceMatchInput {
  bookingId: string;
  priceMatchedAmount: number;
}

export class BookingServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'BookingServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * Authoritative Booking Service for PhiksNiyar Marketplace
 * Enforces canonical 16-state transitions, security authorization, and accurate audit history
 */
export class BookingService {
  /**
   * Create a new booking with server-authoritative pricing and provider eligibility checks
   */
  static createBooking(session: AuthSessionPayload, input: CreateBookingInput): Booking {
    if (!session) {
      throw new BookingServiceError('Unauthorized: Please log in to book a service.', 401);
    }

    const {
      providerId,
      category,
      subcategory,
      description,
      scheduledDate,
      scheduledTime,
      address,
    } = input;

    if (!providerId || !category || !description) {
      throw new BookingServiceError('Missing required booking fields (providerId, category, description)', 400);
    }

    const provider = db.getProviderById(providerId);
    if (!provider) {
      throw new BookingServiceError('Selected provider not found', 404);
    }

    // Server-side provider eligibility check: Only VERIFIED providers can receive bookings
    if (provider.verificationStatus !== 'VERIFIED') {
      throw new BookingServiceError(
        'Selected provider is not currently verified to accept bookings on PhiksNiyar.',
        400
      );
    }

    const customerUser = db.getUserById(session.userId);
    if (!customerUser) {
      throw new BookingServiceError('Customer user profile not found', 404);
    }

    // Authoritative server-side pricing calculation
    const settings = db.getSettings();
    const commissionPercent = settings.platformCommissionPercent || 10.0;
    const visitingCharge = Number(provider.pricingModel?.visitingCharge) || 199;
    const estAmount = visitingCharge;
    const commissionAmt = Math.round(((estAmount * commissionPercent) / 100) * 100) / 100;
    const providerPayout = Math.round((estAmount - commissionAmt) * 100) / 100;

    // Cryptographically sound 4-digit Doorstep Start-OTP
    const secureStartOtp = generateSecureDoorstepOtp();
    const providerUser = db.getUserById(provider.userId);

    const bookingId = generateSecureId('bk');

    const newBooking: Booking = {
      id: bookingId,
      customerId: customerUser.id,
      customerName: customerUser.name,
      customerPhone: customerUser.phone,
      customerAddress: address || {
        id: generateSecureId('addr'),
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

    // Record audit log
    db.addAuditLog({
      id: generateSecureId('aud'),
      actorId: customerUser.id,
      actorRole: session.role || 'CUSTOMER',
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

    return newBooking;
  }

  /**
   * Helper to verify actor authorization and ownership for a booking
   */
  private static checkOwnership(booking: Booking, session: AuthSessionPayload): {
    isCustomer: boolean;
    isAssignedProvider: boolean;
    isAdmin: boolean;
    effectiveRole: UserRole;
  } {
    const isCustomer = session.userId === booking.customerId;
    let isAssignedProvider = false;
    const provider = db.getProviderById(booking.providerId);
    if (provider && provider.userId === session.userId) {
      isAssignedProvider = true;
    }
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPPORT';

    if (!isCustomer && !isAssignedProvider && !isAdmin) {
      throw new BookingServiceError('Forbidden: You are not authorized to modify this booking.', 403);
    }

    return {
      isCustomer,
      isAssignedProvider,
      isAdmin,
      effectiveRole: session.role,
    };
  }

  /**
   * Authoritatively transitions booking status through canonical state machine
   */
  static transitionBookingStatus(
    session: AuthSessionPayload,
    input: TransitionBookingInput
  ): { booking: Booking; idempotent: boolean; message: string } {
    const { bookingId, targetStatus, note, startOtpInput, cancellationReason, isCollusion } = input;

    if (!bookingId) {
      throw new BookingServiceError('bookingId is required', 400);
    }
    if (!targetStatus) {
      throw new BookingServiceError('targetStatus is required', 400);
    }

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      throw new BookingServiceError('Booking not found', 404);
    }

    const { isCustomer, isAssignedProvider, isAdmin, effectiveRole } = this.checkOwnership(booking, session);

    // Normalize backward compatible status aliases
    let normalizedTarget = targetStatus as BookingStatus;
    if ((targetStatus as any) === 'PROVIDER_ON_THE_WAY') normalizedTarget = 'ON_THE_WAY';
    if ((targetStatus as any) === 'PAYMENT_PENDING') normalizedTarget = 'AWAITING_PAYMENT';

    // Idempotency: If already in target status, return success safely without re-executing mutations
    if (booking.status === normalizedTarget) {
      return {
        booking,
        idempotent: true,
        message: `Booking is already in ${normalizedTarget} status.`,
      };
    }

    // Validate state machine rules
    const check = canTransitionBooking(booking.status, normalizedTarget, effectiveRole);
    if (!check.allowed) {
      throw new BookingServiceError(check.reason || 'Invalid state transition', 400);
    }

    // CAPTURE PREVIOUS STATUS ACCURATELY BEFORE ANY MODIFICATION
    const previousStatus = booking.status;

    // Doorstep OTP Verification (when starting active work)
    if (normalizedTarget === 'IN_PROGRESS' && previousStatus !== 'IN_PROGRESS') {
      if (!isAssignedProvider && !isAdmin) {
        throw new BookingServiceError('Only the assigned provider or admin can start work with the Doorstep OTP.', 403);
      }

      if ((booking.startOtpAttempts || 0) >= 3) {
        throw new BookingServiceError(
          'Maximum OTP verification attempts exceeded. Please contact PhiksNiyar Support.',
          429
        );
      }

      const inputCode = String(startOtpInput || '').trim();
      if (!booking.startOtp || inputCode !== String(booking.startOtp).trim()) {
        booking.startOtpAttempts = (booking.startOtpAttempts || 0) + 1;
        db.saveBooking(booking);

        db.addAuditLog({
          id: generateSecureId('aud'),
          actorId: session.userId,
          actorRole: effectiveRole,
          action: 'OTP_FAILED',
          targetEntity: 'BOOKING',
          targetId: booking.id,
          details: { attempt: booking.startOtpAttempts },
          timestamp: new Date().toISOString(),
        });

        throw new BookingServiceError(
          `Invalid Doorstep Start-OTP. Please ask customer for the 4-digit code shown on their screen. (${3 - booking.startOtpAttempts} attempts remaining)`,
          400
        );
      }

      // OTP verified successfully: invalidate OTP so it cannot be replayed
      booking.otpVerifiedAt = new Date().toISOString();
      delete booking.startOtp;

      db.addAuditLog({
        id: generateSecureId('aud'),
        actorId: session.userId,
        actorRole: effectiveRole,
        action: 'OTP_VERIFIED',
        targetEntity: 'BOOKING',
        targetId: booking.id,
        details: { verifiedAt: booking.otpVerifiedAt },
        timestamp: new Date().toISOString(),
      });
    }

    // Automatic 7-Day Warranty Activation upon COMPLETED transition
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

    // Cancellation handling
    if (cancellationReason) {
      booking.cancellationReason = String(cancellationReason).slice(0, 300);
    }
    if (isCollusion) {
      const provider = db.getProviderById(booking.providerId);
      if (provider) {
        booking.cancellationFlaggedCollusion = true;
        provider.circumventionStrikes = (provider.circumventionStrikes || 0) + 1;
        provider.circumventionRiskScore = Math.min((provider.circumventionRiskScore || 0) + 30, 100);
        db.saveProvider(provider);
      }
    }

    // Apply Transition
    booking.status = normalizedTarget;
    booking.updatedAt = new Date().toISOString();

    booking.statusHistory.push({
      status: normalizedTarget,
      timestamp: new Date().toISOString(),
      note: note ? String(note).slice(0, 300) : `Status updated from ${previousStatus} to ${normalizedTarget} by ${effectiveRole}`,
      updatedByRole: effectiveRole,
    });

    db.saveBooking(booking);

    // Audit log with accurate previousStatus and newStatus
    db.addAuditLog({
      id: generateSecureId('aud'),
      actorId: session.userId,
      actorRole: effectiveRole,
      action: `BOOKING_STATUS_${normalizedTarget}`,
      targetEntity: 'BOOKING',
      targetId: booking.id,
      details: { previousStatus, newStatus: normalizedTarget, reason: note || cancellationReason || null },
      timestamp: new Date().toISOString(),
    });

    return {
      booking,
      idempotent: false,
      message: `Booking status updated to ${normalizedTarget}`,
    };
  }

  /**
   * Provider proposes additional scope/charges
   */
  static proposeAdditionalCharges(
    session: AuthSessionPayload,
    input: ProposeAdditionalChargesInput
  ): Booking {
    const { bookingId, amount, reason } = input;
    const booking = db.getBookingById(bookingId);
    if (!booking) {
      throw new BookingServiceError('Booking not found', 404);
    }

    const { isAssignedProvider, isAdmin, effectiveRole } = this.checkOwnership(booking, session);
    if (!isAssignedProvider && !isAdmin) {
      throw new BookingServiceError('Only the assigned provider can propose additional charges.', 403);
    }

    const extraAmt = Number(amount);
    if (isNaN(extraAmt) || extraAmt <= 0 || extraAmt > 50000) {
      throw new BookingServiceError('Invalid additional charges amount (must be positive, max ₹50,000).', 400);
    }

    const previousStatus = booking.status;
    booking.additionalCharges = {
      proposedAmount: extraAmt,
      reason: String(reason || 'Additional parts / repair scope').slice(0, 300),
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
      id: generateSecureId('aud'),
      actorId: session.userId,
      actorRole: effectiveRole,
      action: 'ADDITIONAL_CHARGES_PROPOSED',
      targetEntity: 'BOOKING',
      targetId: booking.id,
      details: { previousStatus, proposedAmount: extraAmt, reason: booking.additionalCharges.reason },
      timestamp: new Date().toISOString(),
    });

    return booking;
  }

  /**
   * Customer approves or rejects proposed additional charges
   */
  static respondToAdditionalCharges(
    session: AuthSessionPayload,
    input: RespondAdditionalChargesInput
  ): Booking {
    const { bookingId, approved } = input;
    const booking = db.getBookingById(bookingId);
    if (!booking) {
      throw new BookingServiceError('Booking not found', 404);
    }

    const { isCustomer, isAdmin, effectiveRole } = this.checkOwnership(booking, session);
    if (!isCustomer && !isAdmin) {
      throw new BookingServiceError('Only customer or administrator can approve or decline additional charges.', 403);
    }

    if (!booking.additionalCharges) {
      throw new BookingServiceError('No pending additional charges found on this booking.', 400);
    }

    const previousStatus = booking.status;

    if (approved) {
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
      id: generateSecureId('aud'),
      actorId: session.userId,
      actorRole: effectiveRole,
      action: approved ? 'ADDITIONAL_CHARGES_APPROVED' : 'ADDITIONAL_CHARGES_DECLINED',
      targetEntity: 'BOOKING',
      targetId: booking.id,
      details: { previousStatus, approved },
      timestamp: new Date().toISOString(),
    });

    return booking;
  }

  /**
   * Provider reports cash payment received
   */
  static reportCashPayment(
    session: AuthSessionPayload,
    input: ReportCashPaymentInput
  ): Booking {
    const { bookingId, amount } = input;
    const booking = db.getBookingById(bookingId);
    if (!booking) {
      throw new BookingServiceError('Booking not found', 404);
    }

    const { isAssignedProvider, isAdmin, effectiveRole } = this.checkOwnership(booking, session);
    if (!isAssignedProvider && !isAdmin) {
      throw new BookingServiceError('Only the assigned provider can report cash collection.', 403);
    }

    const cashAmt = Number(amount);
    if (isNaN(cashAmt) || cashAmt <= 0) {
      throw new BookingServiceError('Invalid cash collection amount.', 400);
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
      id: generateSecureId('aud'),
      actorId: session.userId,
      actorRole: effectiveRole,
      action: 'CASH_PAYMENT_REPORTED',
      targetEntity: 'BOOKING',
      targetId: booking.id,
      details: { reportedAmount: cashAmt },
      timestamp: new Date().toISOString(),
    });

    return booking;
  }

  /**
   * Customer confirms cash payment and completes booking with warranty
   */
  static confirmCashPayment(
    session: AuthSessionPayload,
    input: ConfirmCashPaymentInput
  ): Booking {
    const { bookingId } = input;
    const booking = db.getBookingById(bookingId);
    if (!booking) {
      throw new BookingServiceError('Booking not found', 404);
    }

    const { isCustomer, isAdmin, effectiveRole } = this.checkOwnership(booking, session);
    if (!isCustomer && !isAdmin) {
      throw new BookingServiceError('Only customer or administrator can confirm cash payments.', 403);
    }

    if (!booking.cashPayment || booking.cashPayment.status !== 'CASH_REPORTED') {
      throw new BookingServiceError('No reported cash payment awaiting customer confirmation.', 400);
    }

    const previousStatus = booking.status;
    booking.cashPayment.status = 'CASH_CONFIRMED';
    booking.cashPayment.confirmedByUserId = session.userId;
    booking.cashPayment.confirmedAt = new Date().toISOString();
    if (booking.payment) {
      booking.payment.status = 'SUCCESS';
    }
    booking.status = 'COMPLETED';
    booking.updatedAt = new Date().toISOString();

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
      id: generateSecureId('aud'),
      actorId: session.userId,
      actorRole: effectiveRole,
      action: 'CASH_PAYMENT_CONFIRMED',
      targetEntity: 'BOOKING',
      targetId: booking.id,
      details: { previousStatus, confirmedAmount: booking.cashPayment.reportedAmount, warrantyId: warranty.id },
      timestamp: new Date().toISOString(),
    });

    return booking;
  }

  /**
   * Price matching (Anti-Circumvention Protection)
   */
  static priceMatch(
    session: AuthSessionPayload,
    input: PriceMatchInput
  ): Booking {
    const { bookingId, priceMatchedAmount } = input;
    const booking = db.getBookingById(bookingId);
    if (!booking) {
      throw new BookingServiceError('Booking not found', 404);
    }

    const { isCustomer, isAdmin, effectiveRole } = this.checkOwnership(booking, session);
    if (!isCustomer && !isAdmin) {
      throw new BookingServiceError('Only the customer or administrator can confirm price matching.', 403);
    }

    const matchedNum = Number(priceMatchedAmount);
    const minAllowable = Math.max(booking.pricing.visitingCharges * 0.5, 99);
    if (isNaN(matchedNum) || matchedNum < minAllowable || matchedNum > 50000) {
      throw new BookingServiceError(
        `Invalid price matched amount. Must be between ₹${minAllowable} and ₹50,000.`,
        400
      );
    }

    const previousStatus = booking.status;
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
      id: generateSecureId('aud'),
      actorId: session.userId,
      actorRole: effectiveRole,
      action: 'PRICE_MATCHED_ON_PLATFORM',
      targetEntity: 'BOOKING',
      targetId: booking.id,
      details: { previousStatus, matchedAmount: matchedNum },
      timestamp: new Date().toISOString(),
    });

    return booking;
  }
}
