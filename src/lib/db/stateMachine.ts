// PhiksNiyar 16-State Booking State Machine and Provider Lifecycle Transition Guard
import { BookingStatus, UserRole, VerificationStatus } from './types';

export interface TransitionRule {
  from: BookingStatus[];
  to: BookingStatus;
  allowedRoles: UserRole[];
  description: string;
}

export const VALID_TRANSITIONS: TransitionRule[] = [
  // 1. Initial Discovery & Matching Flow
  {
    from: ['REQUESTED'],
    to: 'MATCHING',
    allowedRoles: ['ADMIN', 'SUPPORT'],
    description: 'AI or dispatcher initiates provider matching in Chilakaluripet',
  },
  {
    from: ['MATCHING'],
    to: 'PENDING_PROVIDER',
    allowedRoles: ['ADMIN', 'SUPPORT'],
    description: 'Booking matched and routed to candidate service partner',
  },
  {
    from: ['REQUESTED', 'PENDING_PROVIDER', 'MATCHING'],
    to: 'ACCEPTED',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider accepts the incoming service booking request',
  },
  {
    from: ['REQUESTED', 'PENDING_PROVIDER'],
    to: 'REJECTED',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider declines request, triggering re-match or notification',
  },
  {
    from: ['ACCEPTED'],
    to: 'SCHEDULED',
    allowedRoles: ['PROVIDER', 'CUSTOMER', 'ADMIN'],
    description: 'Booking confirmed for a specific future time slot',
  },

  // 2. Cancellation Guard (Only allowed before active doorstep work starts)
  {
    from: [
      'REQUESTED',
      'MATCHING',
      'PENDING_PROVIDER',
      'ACCEPTED',
      'SCHEDULED',
      'ON_THE_WAY',
      'PROVIDER_ON_THE_WAY',
      'ARRIVED',
      'OTP_PENDING',
    ],
    to: 'CANCELLED',
    allowedRoles: ['CUSTOMER', 'ADMIN'],
    description: 'Customer or Admin cancels the booking prior to active repair work',
  },

  // 3. Dispatch & Transit Flow
  {
    from: ['ACCEPTED', 'SCHEDULED'],
    to: 'ON_THE_WAY',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider departs for customer doorstep in Chilakaluripet',
  },
  {
    from: ['ACCEPTED', 'SCHEDULED'],
    to: 'PROVIDER_ON_THE_WAY',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Backward compatible alias: Provider departs for customer location',
  },
  {
    from: ['ON_THE_WAY', 'PROVIDER_ON_THE_WAY'],
    to: 'ARRIVED',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider reaches customer doorstep and requests Start-OTP',
  },

  // 4. Doorstep OTP Handshake & Work Execution
  {
    from: ['ARRIVED'],
    to: 'OTP_PENDING',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Customer received 4-digit Doorstep OTP; awaiting technician input',
  },
  {
    from: ['ARRIVED', 'OTP_PENDING'],
    to: 'IN_PROGRESS',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Doorstep Start-OTP verified; active repair and diagnosis begun',
  },

  // 5. Price Quotation & Confirmation Flow
  {
    from: ['IN_PROGRESS'],
    to: 'AWAITING_PRICE_CONFIRMATION',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Technician quotes additional replacement parts or scope of work',
  },
  {
    from: ['AWAITING_PRICE_CONFIRMATION'],
    to: 'IN_PROGRESS',
    allowedRoles: ['CUSTOMER', 'ADMIN'],
    description: 'Customer explicitly approves quote on screen, continuing work',
  },

  // 6. Invoicing & Payment Flow
  {
    from: ['IN_PROGRESS', 'AWAITING_PRICE_CONFIRMATION'],
    to: 'AWAITING_PAYMENT',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Physical work finished; invoice generated for customer payment',
  },
  {
    from: ['IN_PROGRESS', 'AWAITING_PRICE_CONFIRMATION'],
    to: 'PAYMENT_PENDING',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Backward compatible alias: Work finished, payment pending',
  },
  {
    from: ['AWAITING_PAYMENT', 'PAYMENT_PENDING'],
    to: 'PAID',
    allowedRoles: ['CUSTOMER', 'PROVIDER', 'ADMIN'],
    description: 'Payment collected via UPI QR, online checkout, or cash confirmation',
  },
  {
    from: ['PAID', 'AWAITING_PAYMENT', 'PAYMENT_PENDING'],
    to: 'COMPLETED',
    allowedRoles: ['PROVIDER', 'CUSTOMER', 'ADMIN'],
    description: 'Booking closed; customer unlocked for rating and review',
  },

  // 7. 7-Day Warranty Lifecycle
  {
    from: ['COMPLETED'],
    to: 'WARRANTY_ACTIVE',
    allowedRoles: ['CUSTOMER', 'ADMIN'],
    description: '7-Day Free Rework warranty period active for customer',
  },
  {
    from: ['WARRANTY_ACTIVE', 'COMPLETED'],
    to: 'WARRANTY_CLAIMED',
    allowedRoles: ['CUSTOMER', 'ADMIN'],
    description: 'Customer raises rework warranty claim within 7-day policy window',
  },
  {
    from: ['WARRANTY_CLAIMED'],
    to: 'IN_PROGRESS',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Technician assigned for free warranty rework visit',
  },
  {
    from: ['WARRANTY_ACTIVE', 'WARRANTY_CLAIMED', 'COMPLETED'],
    to: 'CLOSED',
    allowedRoles: ['ADMIN'],
    description: 'Job completed, warranty elapsed, booking permanently archived',
  },

  // 8. Dispute & Mediation Flow
  {
    from: [
      'IN_PROGRESS',
      'AWAITING_PRICE_CONFIRMATION',
      'AWAITING_PAYMENT',
      'PAYMENT_PENDING',
      'PAID',
      'COMPLETED',
      'WARRANTY_ACTIVE',
      'WARRANTY_CLAIMED',
    ],
    to: 'DISPUTED',
    allowedRoles: ['CUSTOMER', 'PROVIDER', 'ADMIN'],
    description: 'Dispute raised regarding work quality, pricing, damage, or conduct',
  },
  {
    from: ['DISPUTED'],
    to: 'COMPLETED',
    allowedRoles: ['ADMIN', 'SUPPORT'],
    description: 'Dispute resolved in favor of service completion',
  },
  {
    from: ['DISPUTED'],
    to: 'CANCELLED',
    allowedRoles: ['ADMIN', 'SUPPORT'],
    description: 'Dispute resolved with full cancellation / refund',
  },
  {
    from: ['DISPUTED'],
    to: 'CLOSED',
    allowedRoles: ['ADMIN'],
    description: 'Dispute administratively closed after mediation',
  },
];

export function canTransitionBooking(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
  // Prevent any status update to current status
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const rule = VALID_TRANSITIONS.find(
    (t) => t.to === targetStatus && t.from.includes(currentStatus)
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `Illegal state transition: Cannot change booking status from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  if (!rule.allowedRoles.includes(actorRole)) {
    return {
      allowed: false,
      reason: `Unauthorized: User role '${actorRole}' is not permitted to transition booking to '${targetStatus}'.`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// PROVIDER VERIFICATION STATE MACHINE (6 Canonical States)
// PENDING -> UNDER_REVIEW -> VERIFIED / REJECTED / SUSPENDED / INACTIVE
// ============================================================================
export interface VerificationTransitionRule {
  from: VerificationStatus[];
  to: VerificationStatus;
  allowedRoles: UserRole[];
  description: string;
}

export const VALID_VERIFICATION_TRANSITIONS: VerificationTransitionRule[] = [
  {
    from: ['PENDING'],
    to: 'UNDER_REVIEW',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider submits documents; verification team begins audit',
  },
  {
    from: ['PENDING'],
    to: 'DOCUMENT_SUBMITTED',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Backward compat: documents submitted',
  },
  {
    from: ['PENDING', 'DOCUMENT_SUBMITTED', 'UNDER_REVIEW'],
    to: 'KYC_PROCESSING',
    allowedRoles: ['ADMIN', 'SUPPORT'],
    description: 'Backward compat: KYC processing initiated',
  },
  {
    from: ['UNDER_REVIEW', 'KYC_PROCESSING', 'DOCUMENT_SUBMITTED'],
    to: 'VERIFIED',
    allowedRoles: ['ADMIN'],
    description: 'Administrator approves documents and grants verified partner status',
  },
  {
    from: ['UNDER_REVIEW', 'KYC_PROCESSING', 'DOCUMENT_SUBMITTED', 'PENDING'],
    to: 'REJECTED',
    allowedRoles: ['ADMIN'],
    description: 'Administrator rejects onboarding due to invalid credentials or policy',
  },
  {
    from: ['VERIFIED', 'UNDER_REVIEW', 'KYC_PROCESSING'],
    to: 'SUSPENDED',
    allowedRoles: ['ADMIN'],
    description: 'Administrator suspends partner for policy violations or investigation',
  },
  {
    from: ['VERIFIED', 'UNDER_REVIEW', 'PENDING', 'SUSPENDED'],
    to: 'INACTIVE',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider marks profile temporarily inactive / off-duty',
  },
  {
    from: ['INACTIVE'],
    to: 'UNDER_REVIEW',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Inactive partner requests reactivation and review',
  },
  {
    from: ['SUSPENDED', 'REJECTED'],
    to: 'UNDER_REVIEW',
    allowedRoles: ['ADMIN'],
    description: 'Administrator reopens case for re-audit',
  },
];

export function canTransitionVerification(
  currentStatus: VerificationStatus,
  targetStatus: VerificationStatus,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
  // Client can never self-verify
  if (targetStatus === 'VERIFIED' && actorRole !== 'ADMIN') {
    return {
      allowed: false,
      reason: 'Unauthorized: Only platform administrators can grant VERIFIED status.',
    };
  }

  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const rule = VALID_VERIFICATION_TRANSITIONS.find(
    (t) => t.to === targetStatus && t.from.includes(currentStatus)
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `Illegal verification transition: Cannot transition provider from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  if (!rule.allowedRoles.includes(actorRole)) {
    return {
      allowed: false,
      reason: `Unauthorized: Role '${actorRole}' is not authorized to transition verification status to '${targetStatus}'.`,
    };
  }

  return { allowed: true };
}
