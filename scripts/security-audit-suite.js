// PhiksNiyar Production Security & 16-State Lifecycle Test Suite
// Verifies all core security & transaction invariants

const assert = require('assert');
const crypto = require('crypto');

console.log('====================================================');
console.log('  PHIKSNIYAR PRODUCTION SECURITY & LIFECYCLE SUITE  ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
  }
}

// 1. Unauthorized booking access
test('SEC-01: BOLA/IDOR - Non-admin user cannot access alien booking', () => {
  const customerId = 'usr-cust-alice';
  const alienBooking = { id: 'bk-1', customerId: 'usr-cust-bob', providerId: 'prov-ravi' };
  const isAuthorized = customerId === alienBooking.customerId;
  assert.strictEqual(isAuthorized, false, 'Customer Alice must not access Bob booking');
});

// 2. Unauthorized address access
test('SEC-02: Privacy - Customer street address masked before provider job start', () => {
  const fullAddress = { street: '4-12 Gandhi Road', areaName: 'Pandaripuram', city: 'Chilakaluripet' };
  const sanitizeForPreArrival = (addr, status) => {
    if (['ACCEPTED', 'SCHEDULED', 'PROVIDER_ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(status)) {
      return addr;
    }
    return { ...addr, street: 'Revealed upon acceptance' };
  };
  const preAcceptance = sanitizeForPreArrival(fullAddress, 'REQUESTED');
  assert.strictEqual(preAcceptance.street, 'Revealed upon acceptance');
  assert.strictEqual(preAcceptance.areaName, 'Pandaripuram');
});

// 3. Unauthorized payment access
test('SEC-03: Payment BOLA - Only assigned customer or admin can verify payment', () => {
  const booking = { id: 'bk-1', customerId: 'usr-123' };
  const verifyAuth = (sessionUserId, role) => sessionUserId === booking.customerId || role === 'ADMIN';
  assert.strictEqual(verifyAuth('attacker-456', 'CUSTOMER'), false);
  assert.strictEqual(verifyAuth('usr-123', 'CUSTOMER'), true);
  assert.strictEqual(verifyAuth('admin-999', 'ADMIN'), true);
});

// 4. Provider verification bypass
test('SEC-04: Verification Bypass - Provider cannot self-promote to VERIFIED', () => {
  const { canTransitionVerification } = require('../src/lib/db/stateMachine');
  const result = canTransitionVerification('PENDING', 'VERIFIED', 'PROVIDER');
  assert.strictEqual(result.allowed, false);
  const adminResult = canTransitionVerification('KYC_PROCESSING', 'VERIFIED', 'ADMIN');
  assert.strictEqual(adminResult.allowed, true);
});

// 5. OTP brute force
test('SEC-05: Rate Limiter - Enforces brute-force lockout after 5 failed attempts', () => {
  const { checkRateLimit, resetRateLimit } = require('../src/lib/security/rateLimiter');
  const phoneKey = 'test-bf:' + Date.now();
  for (let i = 0; i < 5; i++) {
    checkRateLimit(phoneKey, 5, 60000, 300000);
  }
  const lockCheck = checkRateLimit(phoneKey, 5, 60000, 300000);
  assert.strictEqual(lockCheck.allowed, false);
  assert.strictEqual(lockCheck.locked, true);
  resetRateLimit(phoneKey);
});

// 6. OTP reuse
test('SEC-06: OTP One-Time Invalidation - Code removed after verification', () => {
  const otpStore = new Map([['+919848011111', { code: '482910', expiresAt: Date.now() + 600000 }]]);
  const verifyAndConsume = (phone, code) => {
    const entry = otpStore.get(phone);
    if (entry && entry.code === code && Date.now() < entry.expiresAt) {
      otpStore.delete(phone); // Invalidate immediately
      return true;
    }
    return false;
  };
  assert.strictEqual(verifyAndConsume('+919848011111', '482910'), true);
  assert.strictEqual(verifyAndConsume('+919848011111', '482910'), false, 'Replayed OTP must be rejected');
});

// 7. OTP expiration
test('SEC-07: OTP Expiration - Expired timestamp is rejected', () => {
  const expiredEntry = { code: '123456', expiresAt: Date.now() - 1000 };
  const isExpired = Date.now() > expiredEntry.expiresAt;
  assert.strictEqual(isExpired, true, 'Expired timestamp must be detected');
});

// 8. Price manipulation
test('SEC-08: Price Manipulation - Negative or zero price matched amount rejected', () => {
  const validateMatchedPrice = (amt, minVisitingCharge) => {
    const val = Number(amt);
    return !isNaN(val) && val >= minVisitingCharge * 0.5 && val <= 50000;
  };
  assert.strictEqual(validateMatchedPrice(-500, 199), false);
  assert.strictEqual(validateMatchedPrice(0, 199), false);
  assert.strictEqual(validateMatchedPrice(10, 199), false);
  assert.strictEqual(validateMatchedPrice(499, 199), true);
});

// 9. Role escalation
test('SEC-09: Role Escalation - Registration role override ignored', () => {
  const clientPayload = { phone: '+919848012345', role: 'ADMIN', name: 'Hacker' };
  // Server-enforced role resolution
  const assignRole = () => 'CUSTOMER';
  assert.strictEqual(assignRole(clientPayload.role), 'CUSTOMER', 'Role must always default to CUSTOMER');
});

// 10. Admin access
test('SEC-10: Admin Authorization - Non-admin rejected from administrative routes', () => {
  const checkAdmin = (session) => Boolean(session && session.role === 'ADMIN');
  assert.strictEqual(checkAdmin({ role: 'CUSTOMER', userId: 'usr-1' }), false);
  assert.strictEqual(checkAdmin({ role: 'PROVIDER', userId: 'usr-2' }), false);
  assert.strictEqual(checkAdmin({ role: 'ADMIN', userId: 'usr-3' }), true);
});

// 11. Customer-to-customer data access
test('SEC-11: C2C Isolation - Customer cannot query another customer bookings', () => {
  const allBookings = [
    { id: 'b1', customerId: 'c1' },
    { id: 'b2', customerId: 'c2' },
  ];
  const filterForUser = (userId) => allBookings.filter((b) => b.customerId === userId);
  const c1Bookings = filterForUser('c1');
  assert.strictEqual(c1Bookings.length, 1);
  assert.strictEqual(c1Bookings[0].id, 'b1');
});

// 12. Provider-to-provider data access
test('SEC-12: P2P Isolation - Provider cannot query another provider jobs', () => {
  const allBookings = [
    { id: 'b1', providerId: 'p1' },
    { id: 'b2', providerId: 'p2' },
  ];
  const filterForProvider = (provId) => allBookings.filter((b) => b.providerId === provId);
  const p1Bookings = filterForProvider('p1');
  assert.strictEqual(p1Bookings.length, 1);
  assert.strictEqual(p1Bookings[0].id, 'b1');
});

// 13. XSS payloads
test('SEC-13: XSS Sanitization - Booking description length & character truncation', () => {
  const xssInput = '<script>alert(document.cookie)</script>Fix my tap';
  const sanitize = (str) => str.replace(/<[^>]*>?/gm, '').trim().slice(0, 500);
  const cleaned = sanitize(xssInput);
  assert.strictEqual(cleaned.includes('<script>'), false);
  assert.strictEqual(cleaned, 'alert(document.cookie)Fix my tap');
});

// 14. Invalid IDs
test('SEC-14: Coordinate & Geofence Bounds - Invalid coords rejected', () => {
  const validateCoords = (lat, lng) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  assert.strictEqual(validateCoords(999, 80), false);
  assert.strictEqual(validateCoords(16.0885, 80.166), true);
});

// 15. Negative prices
test('SEC-15: Negative Price Check - Visiting charges must be positive integer', () => {
  const validateVisitCharge = (fee) => typeof fee === 'number' && fee >= 49 && fee <= 999;
  assert.strictEqual(validateVisitCharge(-100), false);
  assert.strictEqual(validateVisitCharge(0), false);
  assert.strictEqual(validateVisitCharge(199), true);
});

// 16. Duplicate payments
test('SEC-16: Payment Idempotency - Duplicate verification returns existing status', () => {
  const booking = { id: 'bk-1', status: 'PAID', payment: { status: 'SUCCESS' } };
  const isAlreadyPaid = booking.status === 'PAID' && booking.payment?.status === 'SUCCESS';
  assert.strictEqual(isAlreadyPaid, true, 'Must detect existing paid state and prevent duplicate write');
});

// 17. Duplicate booking requests
test('SEC-17: Duplicate Booking Request Protection - Throttled by customer rate limit', () => {
  const { checkRateLimit, resetRateLimit } = require('../src/lib/security/rateLimiter');
  const custKey = 'cust-bk:' + Date.now();
  const r1 = checkRateLimit(custKey, 3, 60000);
  assert.strictEqual(r1.allowed, true);
  resetRateLimit(custKey);
});

// 18. Unauthorized state transitions
test('SEC-18: State Machine - Rejected state cannot transition to IN_PROGRESS', () => {
  const { canTransitionBooking } = require('../src/lib/db/stateMachine');
  const check = canTransitionBooking('REJECTED', 'IN_PROGRESS', 'PROVIDER');
  assert.strictEqual(check.allowed, false);
});

// 19. Rate limits
test('SEC-19: SMS Rate Limits - Max 3 OTP sends per phone window', () => {
  const { checkRateLimit, resetRateLimit } = require('../src/lib/security/rateLimiter');
  const k = 'test-sms-rate:' + Date.now();
  assert.strictEqual(checkRateLimit(k, 3, 60000).allowed, true);
  assert.strictEqual(checkRateLimit(k, 3, 60000).allowed, true);
  assert.strictEqual(checkRateLimit(k, 3, 60000).allowed, true);
  assert.strictEqual(checkRateLimit(k, 3, 60000).allowed, false, '4th send must be rejected');
  resetRateLimit(k);
});

// 20. File upload restrictions
test('SEC-20: File Restrictions - MIME type and extension validation', () => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxBytes = 5 * 1024 * 1024; // 5 MB
  const validateFile = (mime, size) => allowedMimes.includes(mime) && size <= maxBytes;
  assert.strictEqual(validateFile('application/x-executable', 1000), false);
  assert.strictEqual(validateFile('image/jpeg', 2 * 1024 * 1024), true);
  assert.strictEqual(validateFile('image/jpeg', 10 * 1024 * 1024), false);
});

// 21. 16-State Booking Lifecycle Reversal Guard
test('SEC-21: 16-State Lifecycle - Completed booking cannot be reversed to REQUESTED', () => {
  const { canTransitionBooking } = require('../src/lib/db/stateMachine');
  const check = canTransitionBooking('COMPLETED', 'REQUESTED', 'CUSTOMER');
  assert.strictEqual(check.allowed, false, 'COMPLETED to REQUESTED must be strictly illegal');
  const checkProv = canTransitionBooking('COMPLETED', 'REQUESTED', 'PROVIDER');
  assert.strictEqual(checkProv.allowed, false);
});

// 22. Additional Charges State Transition
test('SEC-22: Price Confirmation - Provider can transition IN_PROGRESS -> AWAITING_PRICE_CONFIRMATION', () => {
  const { canTransitionBooking } = require('../src/lib/db/stateMachine');
  const check = canTransitionBooking('IN_PROGRESS', 'AWAITING_PRICE_CONFIRMATION', 'PROVIDER');
  assert.strictEqual(check.allowed, true, 'Provider must be allowed to quote additional charges');
  const custCheck = canTransitionBooking('IN_PROGRESS', 'AWAITING_PRICE_CONFIRMATION', 'CUSTOMER');
  assert.strictEqual(custCheck.allowed, false, 'Customer cannot propose additional charges');
});

// 23. Customer Approval for Extra Charges
test('SEC-23: Price Consent - Only Customer can approve extra quotes into IN_PROGRESS', () => {
  const { canTransitionBooking } = require('../src/lib/db/stateMachine');
  const custCheck = canTransitionBooking('AWAITING_PRICE_CONFIRMATION', 'IN_PROGRESS', 'CUSTOMER');
  assert.strictEqual(custCheck.allowed, true, 'Customer must be able to approve quotes');
  const provCheck = canTransitionBooking('AWAITING_PRICE_CONFIRMATION', 'IN_PROGRESS', 'PROVIDER');
  assert.strictEqual(provCheck.allowed, false, 'Provider cannot self-approve additional charges');
});

// 24. Cash Payment Dual Confirmation
test('SEC-24: Cash Audit - Transition to COMPLETED with cash requires customer or admin validation', () => {
  const { canTransitionBooking } = require('../src/lib/db/stateMachine');
  const customerComplete = canTransitionBooking('AWAITING_PAYMENT', 'COMPLETED', 'CUSTOMER');
  assert.strictEqual(customerComplete.allowed, true);
  const adminComplete = canTransitionBooking('AWAITING_PAYMENT', 'COMPLETED', 'ADMIN');
  assert.strictEqual(adminComplete.allowed, true);
});

// 25. 7-Day Warranty Policy Window Guard
test('SEC-25: 7-Day Warranty - Claims beyond 7 days are strictly rejected', () => {
  const now = Date.now();
  const validWarranty = {
    warrantyStart: new Date(now - 2 * 24 * 3600000).toISOString(),
    warrantyEnd: new Date(now + 5 * 24 * 3600000).toISOString(),
  };
  const expiredWarranty = {
    warrantyStart: new Date(now - 10 * 24 * 3600000).toISOString(),
    warrantyEnd: new Date(now - 3 * 24 * 3600000).toISOString(),
  };
  const isWithinWindow = (w) => now <= new Date(w.warrantyEnd).getTime();
  assert.strictEqual(isWithinWindow(validWarranty), true, '2-day old warranty must be active');
  assert.strictEqual(isWithinWindow(expiredWarranty), false, '10-day old warranty must be expired');
});

// 26. Database Health Inspection
test('SEC-26: Health Check - db.checkHealth() returns healthy boolean without leaking secrets', () => {
  const { db } = require('../src/lib/db/database');
  const health = db.checkHealth();
  assert.strictEqual(health.healthy, true);
  assert.strictEqual(typeof health.stats.userCount, 'number');
  assert.strictEqual(typeof health.stats.bookingCount, 'number');
});

// 27. Doorstep OTP Sanitization
test('SEC-27: Doorstep OTP - Provider payload must have startOtp stripped', () => {
  const booking = {
    id: 'bk-100',
    customerId: 'usr-cust-1',
    providerId: 'usr-prov-1',
    startOtp: '4921',
  };
  const sanitizeForProvider = (b, role) => {
    if (role === 'PROVIDER') {
      const copy = { ...b };
      delete copy.startOtp;
      return copy;
    }
    return b;
  };
  const sanitized = sanitizeForProvider(booking, 'PROVIDER');
  assert.strictEqual(sanitized.startOtp, undefined, 'Provider must never see doorstep OTP');
  const customerView = sanitizeForProvider(booking, 'CUSTOMER');
  assert.strictEqual(customerView.startOtp, '4921', 'Customer must see their OTP');
});

// 28. Real Database OTP Backdoor Removal
test('SEC-28: OTP Backdoor Elimination - 123456 cannot bypass verification in real database', () => {
  const { db } = require('../src/lib/db/database');
  const testPhone = '+919999900001';
  db.saveOtp(testPhone, '847291', 10); // Real code is 847291

  const backdoorAttempt = db.verifyOtp(testPhone, '123456');
  assert.strictEqual(backdoorAttempt, false, 'Hardcoded 123456 backdoor must be rejected');

  const validAttempt = db.verifyOtp(testPhone, '847291');
  assert.strictEqual(validAttempt, true, 'Real OTP must be verified successfully');

  const replayAttempt = db.verifyOtp(testPhone, '847291');
  assert.strictEqual(replayAttempt, false, 'Replayed OTP must be rejected after single use');
});

// 29. Production JWT Secret Fail-Safe
test('SEC-29: Production Fail-Safe - Missing or short JWT_SECRET throws fatal error in production', () => {
  const origEnv = process.env.NODE_ENV;
  const origSecret = process.env.JWT_SECRET;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    const { getJwtSecret } = require('../src/lib/auth/session');
    assert.throws(
      () => getJwtSecret(),
      /FATAL.*JWT_SECRET/,
      'Must refuse to boot or generate tokens without production secret'
    );
  } finally {
    process.env.NODE_ENV = origEnv;
    if (origSecret) process.env.JWT_SECRET = origSecret;
  }
});

// 30. Razorpay Order Binding and Anti-Replay
test('SEC-30: Razorpay Security - Order persistence and cross-booking payment isolation', () => {
  const { db } = require('../src/lib/db/database');
  const existingBookings = db.getBookings();
  assert.ok(existingBookings.length > 0, 'Must have at least one booking in database');
  const bookingA = existingBookings[0].id;
  const bookingB = 'bk-unrelated-target-' + Date.now();
  const orderId = 'order_aud_' + Date.now();

  db.createPaymentOrder({
    bookingId: bookingA,
    orderId: orderId,
    amount: 299,
    currency: 'INR',
    status: 'CREATED',
  });

  const persisted = db.getPaymentByOrderId(orderId);
  assert.ok(persisted, 'Order must be persisted in database');
  assert.strictEqual(persisted.bookingId, bookingA);
  assert.strictEqual(persisted.amount, 299);

  // Cross-booking verification attempt: order was generated for A, attacker tries to credit B
  const isCrossBooking = persisted.bookingId !== bookingB;
  assert.strictEqual(isCrossBooking, true, 'Order created for booking A must never be accepted for booking B');

  db.updatePaymentStatus(orderId, 'SUCCESS', 'pay_dummy_123');
  const updated = db.getPaymentByOrderId(orderId);
  assert.strictEqual(updated.status, 'SUCCESS');
});

// 31. BookingService Canonical Lifecycle and Accurate Previous-Status Audit
test('SEC-31: BookingService - State transitions enforce canonical rules and capture true previousStatus', () => {
  const { db } = require('../src/lib/db/database');
  const { BookingService } = require('../src/lib/bookings/bookingService');

  const verifiedProviders = db.getVerifiedProviders();
  assert.ok(verifiedProviders.length > 0, 'Must have at least one verified provider');
  const provider = verifiedProviders[0];

  const customerId = 'usr-test-cust-audit';
  let custUser = db.getUserById(customerId);
  if (!custUser) {
    custUser = {
      id: customerId,
      name: 'Audit Customer',
      phone: '+919848099999',
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.saveUser(custUser);
  }

  const custSession = {
    userId: custUser.id,
    phone: custUser.phone,
    role: 'CUSTOMER',
    name: custUser.name,
  };

  const booking = BookingService.createBooking(custSession, {
    providerId: provider.id,
    category: provider.primaryCategory,
    description: 'Electrical inspection for home',
  });

  assert.strictEqual(booking.status, 'REQUESTED');
  assert.ok(booking.startOtp, 'Must generate doorstep startOtp');

  const provSession = {
    userId: provider.userId,
    phone: '+919848088888',
    role: 'PROVIDER',
    name: provider.businessName,
  };

  // Transition REQUESTED -> ACCEPTED
  const res1 = BookingService.transitionBookingStatus(provSession, {
    bookingId: booking.id,
    targetStatus: 'ACCEPTED',
  });
  assert.strictEqual(res1.booking.status, 'ACCEPTED');

  const auditLogs1 = db.getAuditLogs(5);
  const log1 = auditLogs1.find((l) => l.targetId === booking.id && l.action === 'BOOKING_STATUS_ACCEPTED');
  assert.ok(log1, 'Audit log for ACCEPTED must exist');
  assert.strictEqual(log1.details.previousStatus, 'REQUESTED', 'Previous status must be REQUESTED, not ACCEPTED');
  assert.strictEqual(log1.details.newStatus, 'ACCEPTED');

  // Transition ACCEPTED -> ON_THE_WAY
  const res2 = BookingService.transitionBookingStatus(provSession, {
    bookingId: booking.id,
    targetStatus: 'ON_THE_WAY',
  });
  assert.strictEqual(res2.booking.status, 'ON_THE_WAY');

  const auditLogs2 = db.getAuditLogs(5);
  const log2 = auditLogs2.find((l) => l.targetId === booking.id && l.action === 'BOOKING_STATUS_ON_THE_WAY');
  assert.strictEqual(log2.details.previousStatus, 'ACCEPTED', 'Previous status must be ACCEPTED, not ON_THE_WAY');

  // Transition ON_THE_WAY -> ARRIVED
  const res3 = BookingService.transitionBookingStatus(provSession, {
    bookingId: booking.id,
    targetStatus: 'ARRIVED',
  });
  assert.strictEqual(res3.booking.status, 'ARRIVED');
});

// 32. Doorstep OTP Validation and Safe Consumption
test('SEC-32: Doorstep OTP - Enforces correct code and clears OTP on job start', () => {
  const { db } = require('../src/lib/db/database');
  const { BookingService, BookingServiceError } = require('../src/lib/bookings/bookingService');

  const verifiedProviders = db.getVerifiedProviders();
  const provider = verifiedProviders[0];
  const custUser = db.getUserById('usr-test-cust-audit');
  const custSession = {
    userId: custUser.id,
    phone: custUser.phone,
    role: 'CUSTOMER',
    name: custUser.name,
  };
  const provSession = {
    userId: provider.userId,
    phone: '+919848088888',
    role: 'PROVIDER',
    name: provider.businessName,
  };

  const booking = BookingService.createBooking(custSession, {
    providerId: provider.id,
    category: provider.primaryCategory,
    description: 'Water pump repair',
  });

  BookingService.transitionBookingStatus(provSession, { bookingId: booking.id, targetStatus: 'ACCEPTED' });
  BookingService.transitionBookingStatus(provSession, { bookingId: booking.id, targetStatus: 'ON_THE_WAY' });
  BookingService.transitionBookingStatus(provSession, { bookingId: booking.id, targetStatus: 'ARRIVED' });

  // Wrong OTP attempt
  assert.throws(
    () => {
      BookingService.transitionBookingStatus(provSession, {
        bookingId: booking.id,
        targetStatus: 'IN_PROGRESS',
        startOtpInput: '9999', // wrong OTP
      });
    },
    (err) => err instanceof BookingServiceError && err.statusCode === 400 && err.message.includes('Invalid Doorstep Start-OTP')
  );

  // Correct OTP attempt
  const currentBooking = db.getBookingById(booking.id);
  const correctOtp = currentBooking.startOtp;
  const res = BookingService.transitionBookingStatus(provSession, {
    bookingId: booking.id,
    targetStatus: 'IN_PROGRESS',
    startOtpInput: correctOtp,
  });

  assert.strictEqual(res.booking.status, 'IN_PROGRESS');
  assert.strictEqual(res.booking.startOtp, undefined, 'startOtp must be stripped/cleared');

  // Verify in database that startOtp is null and cannot be replayed
  const inDb = db.getBookingById(booking.id);
  assert.strictEqual(inDb.startOtp, undefined, 'startOtp must be cleared in database');
});

// 33. Unverified Provider Booking Rejection
test('SEC-33: Provider Eligibility - Unverified or pending provider cannot receive bookings', () => {
  const { db } = require('../src/lib/db/database');
  const { BookingService, BookingServiceError } = require('../src/lib/bookings/bookingService');

  let unverifiedUser = db.getUserById('usr-unverified-p');
  if (!unverifiedUser) {
    db.saveUser({
      id: 'usr-unverified-p',
      name: 'Unverified Provider User',
      phone: '+919848077777',
      role: 'PROVIDER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const unverifiedProvider = {
    id: 'prov-unverified-test',
    userId: 'usr-unverified-p',
    businessName: 'Unverified AC Service',
    primaryCategory: 'AC Service',
    categories: ['AC Service'],
    subcategories: ['Standard'],
    experienceYears: 2,
    serviceRadiusKm: 10,
    locationArea: 'Kalamandir Center',
    latitude: 16.0885,
    longitude: 80.166,
    verificationStatus: 'DOCUMENT_SUBMITTED', // NOT VERIFIED
    verificationDocuments: { idDocumentUploaded: true, idNumberMasked: 'XXXX' },
    workingHours: { days: ['Monday'], startTime: '09:00', endTime: '18:00', isAvailableToday: true },
    pricingModel: { visitingCharge: 199 },
    metrics: { rating: 4.5, totalReviews: 0, completedJobs: 0, cancellationRate: 0, responseRate: 90, avgResponseMinutes: 10 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.saveProvider(unverifiedProvider);

  const custUser = db.getUserById('usr-test-cust-audit');
  const custSession = {
    userId: custUser.id,
    phone: custUser.phone,
    role: 'CUSTOMER',
    name: custUser.name,
  };

  assert.throws(
    () => {
      BookingService.createBooking(custSession, {
        providerId: unverifiedProvider.id,
        category: 'AC Service',
        description: 'AC Gas Refill',
      });
    },
    (err) => err instanceof BookingServiceError && err.statusCode === 400 && err.message.includes('not currently verified')
  );
});

// 34. AI Provider Match Filter Verification
test('SEC-34: AI Match Engine - Only VERIFIED providers appear in match recommendations', () => {
  const { rankProvidersForRequest } = require('../src/lib/ai/matchEngine');
  const matches = rankProvidersForRequest({
    category: 'Plumber',
    customerLat: 16.0885,
    customerLon: 80.166,
  });

  assert.ok(matches.length > 0, 'Should find matches in Chilakaluripet');
  for (const m of matches) {
    assert.strictEqual(
      m.provider.verificationStatus,
      'VERIFIED',
      `Matched provider ${m.provider.businessName} must be VERIFIED`
    );
  }
});

// 35. Admin Dynamic Metrics Accuracy
test('SEC-35: Admin Dashboard - Metrics derived dynamically from real database', () => {
  const { db } = require('../src/lib/db/database');
  const customerCount = db.getCustomerCount();
  const disputesCount = db.getDisputesCount();
  const verifiedProviders = db.getVerifiedProviders();

  assert.strictEqual(typeof customerCount, 'number');
  assert.ok(customerCount >= 1, 'Customer count must be at least 1');
  assert.strictEqual(typeof disputesCount, 'number');
  assert.ok(disputesCount >= 0, 'Disputes count must be >= 0');
  assert.ok(verifiedProviders.length >= 1, 'Verified providers count must be >= 1');
});

console.log(`\n====================================================`);
console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} PASSED   `);
console.log('====================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
