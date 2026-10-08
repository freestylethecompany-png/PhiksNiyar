// Booking State Machine and Transition Guard
import { BookingStatus, UserRole } from './types';

export interface TransitionRule {
  from: BookingStatus[];
  to: BookingStatus;
  allowedRoles: UserRole[];
  description: string;
}

export const VALID_TRANSITIONS: TransitionRule[] = [
  // 1. Initial Flow
  {
    from: ['REQUESTED'],
    to: 'ACCEPTED',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider accepts the incoming service booking request',
  },
  {
    from: ['REQUESTED'],
    to: 'REJECTED',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider rejects the incoming request with a reason',
  },
  {
    from: ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'PROVIDER_ON_THE_WAY', 'ARRIVED'],
    to: 'CANCELLED',
    allowedRoles: ['CUSTOMER', 'ADMIN'],
    description: 'Customer or Admin cancels the booking prior to active repair',
  },
  {
    from: ['ACCEPTED'],
    to: 'SCHEDULED',
    allowedRoles: ['PROVIDER', 'CUSTOMER', 'ADMIN'],
    description: 'Booking scheduled for a confirmed time slot',
  },
  // 2. Execution Flow
  {
    from: ['ACCEPTED', 'SCHEDULED'],
    to: 'PROVIDER_ON_THE_WAY',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider departs for the customer location in Chilakaluripet',
  },
  {
    from: ['PROVIDER_ON_THE_WAY'],
    to: 'ARRIVED',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Provider reaches the customer doorstep / location',
  },
  {
    from: ['ARRIVED'],
    to: 'IN_PROGRESS',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Service diagnosis and active repair started',
  },
  // 3. Payment & Completion Flow
  {
    from: ['IN_PROGRESS'],
    to: 'PAYMENT_PENDING',
    allowedRoles: ['PROVIDER', 'ADMIN'],
    description: 'Service completed, final invoice/charges generated for customer payment',
  },
  {
    from: ['PAYMENT_PENDING'],
    to: 'PAID',
    allowedRoles: ['CUSTOMER', 'PROVIDER', 'ADMIN'],
    description: 'UPI or Cash payment received and verified',
  },
  {
    from: ['PAID', 'PAYMENT_PENDING'],
    to: 'COMPLETED',
    allowedRoles: ['PROVIDER', 'CUSTOMER', 'ADMIN'],
    description: 'Booking successfully closed and unlocked for customer rating',
  },
  // 4. Dispute
  {
    from: ['IN_PROGRESS', 'PAYMENT_PENDING', 'PAID', 'COMPLETED'],
    to: 'DISPUTED',
    allowedRoles: ['CUSTOMER', 'PROVIDER', 'ADMIN'],
    description: 'Dispute raised regarding work quality, pricing, or conduct',
  },
];

export function canTransitionBooking(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
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
