// PhiksNiyar End-to-End Production Marketplace Smoke Test
// Validates full customer -> provider -> completion -> warranty journey

const assert = require('assert');
const path = require('path');
const crypto = require('crypto');

// Initialize database & services
const { db } = require('../src/lib/db/database');
const { BookingService } = require('../src/lib/bookings/bookingService');
const { generateSecureId } = require('../src/lib/security/cryptoUtils');

console.log('====================================================');
console.log('  PHIKSNIYAR END-TO-END MARKETPLACE SMOKE TEST     ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runSmokeTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }
}

// Setup dedicated test personas with dynamic unique phones
const testCustomer = {
  id: generateSecureId('usr-cust'),
  phone: '98' + crypto.randomInt(10000000, 99999999).toString(),
  name: 'Smoke Test Customer',
  role: 'CUSTOMER',
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const testProviderUser = {
  id: generateSecureId('usr-prov'),
  phone: '98' + crypto.randomInt(10000000, 99999999).toString(),
  name: 'Ravi Electrician Smoke',
  role: 'PROVIDER',
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const testProviderProfile = {
  id: generateSecureId('prov'),
  userId: testProviderUser.id,
  businessName: 'Ravi Electrical Works',
  primaryCategory: 'Electrician',
  categories: ['Electrician'],
  subcategories: ['switchboard_repair', 'mcb_replacement'],
  experienceYears: 8,
  bio: 'Expert electrician in Kalamandir Center, Chilakaluripet.',
  serviceRadiusKm: 15,
  locationArea: 'Kalamandir Center',
  latitude: 16.0885,
  longitude: 80.166,
  verificationStatus: 'VERIFIED',
  verificationDocuments: {
    idDocumentUploaded: true,
    tradeLicenseUploaded: true,
  },
  workingHours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    startTime: '08:00',
    endTime: '20:00',
    isAvailableToday: true,
  },
  pricingModel: {
    visitingCharge: 149,
    hourlyRate: 200,
    fixedServiceRates: { mcb_replacement: 350 },
  },
  metrics: {
    rating: 4.9,
    totalReviews: 12,
    completedJobs: 45,
    cancellationRate: 1,
    responseRate: 98,
    avgResponseMinutes: 10,
  },
  portfolioImages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 1. Database Health Check
runSmokeTest('SMK-01: Health Check - System returns healthy status with valid table schema', () => {
  const health = db.checkHealth();
  assert.strictEqual(health.healthy, true, 'Database must report healthy');
  assert.ok(health.stats.userCount >= 0);
  assert.ok(health.stats.bookingCount >= 0);
});

// 2. Persist Test Personas
runSmokeTest('SMK-02: Setup Personas - Customer & verified provider persisted cleanly', () => {
  db.saveUser(testCustomer);
  db.saveUser(testProviderUser);
  db.saveProvider(testProviderProfile);

  const fetchedCustomer = db.getUserById(testCustomer.id);
  const fetchedProvider = db.getProviderById(testProviderProfile.id);

  assert.strictEqual(fetchedCustomer.name, 'Smoke Test Customer');
  assert.strictEqual(fetchedProvider.verificationStatus, 'VERIFIED');
});

// 3. Service Discovery in Chilakaluripet
runSmokeTest('SMK-03: Service Discovery - Active search returns verified electrician in Chilakaluripet', () => {
  const providers = db.getProviders();
  assert.ok(providers.length > 0, 'Must return at least 1 verified electrician');
  const match = providers.find((p) => p.id === testProviderProfile.id);
  assert.ok(match, 'Must include newly registered verified test provider');
  assert.strictEqual(match.locationArea, 'Kalamandir Center');
});

// 4. Customer Creates Booking
let smokeBooking = null;
runSmokeTest('SMK-04: Booking Creation - Customer submits booking with secure ID & 4-digit OTP', () => {
  const customerSession = {
    userId: testCustomer.id,
    phone: testCustomer.phone,
    name: testCustomer.name,
    role: 'CUSTOMER',
  };

  smokeBooking = BookingService.createBooking(customerSession, {
    providerId: testProviderProfile.id,
    category: 'Electrician',
    description: 'Switchboard sparking in living room',
    scheduledDate: '2026-10-18',
    scheduledTime: '10:00 AM',
    address: {
      id: generateSecureId('addr'),
      street: '12-3 Pandaripuram Road',
      areaName: 'Pandaripuram',
      city: 'Chilakaluripet',
      pincode: '522616',
      latitude: 16.0885,
      longitude: 80.166,
      isDefault: true,
    },
  });

  assert.ok(smokeBooking.id.startsWith('bk-'), 'Booking ID must use secure prefix bk-');
  assert.strictEqual(smokeBooking.status, 'REQUESTED');
  assert.strictEqual(smokeBooking.pricing.visitingCharges, 149);
  assert.strictEqual(smokeBooking.startOtp.length, 4, 'Doorstep OTP must be exactly 4 digits');
});

// 5. Provider Accepts Booking
runSmokeTest('SMK-05: Provider Acceptance - Provider receives job and transitions to ACCEPTED', () => {
  const providerSession = {
    userId: testProviderUser.id,
    phone: testProviderUser.phone,
    name: testProviderUser.name,
    role: 'PROVIDER',
  };

  const result = BookingService.transitionBookingStatus(providerSession, {
    bookingId: smokeBooking.id,
    targetStatus: 'ACCEPTED',
    note: 'I am on my way with multimeter and tools',
  });

  assert.strictEqual(result.booking.status, 'ACCEPTED');
});

// 6. Doorstep Start-OTP Verification
runSmokeTest('SMK-06: Doorstep Start-OTP - Provider cannot start job without customer 4-digit OTP', () => {
  const providerSession = {
    userId: testProviderUser.id,
    phone: testProviderUser.phone,
    name: testProviderUser.name,
    role: 'PROVIDER',
  };

  // Provider departs and arrives at doorstep
  BookingService.transitionBookingStatus(providerSession, {
    bookingId: smokeBooking.id,
    targetStatus: 'ON_THE_WAY',
  });
  BookingService.transitionBookingStatus(providerSession, {
    bookingId: smokeBooking.id,
    targetStatus: 'ARRIVED',
  });

  // Wrong OTP attempt at doorstep
  assert.throws(() => {
    BookingService.transitionBookingStatus(providerSession, {
      bookingId: smokeBooking.id,
      targetStatus: 'IN_PROGRESS',
      startOtpInput: '0000',
    });
  }, /Invalid Doorstep Start-OTP/);

  // Correct OTP attempt
  const correctOtp = smokeBooking.startOtp;
  const startResult = BookingService.transitionBookingStatus(providerSession, {
    bookingId: smokeBooking.id,
    targetStatus: 'IN_PROGRESS',
    startOtpInput: correctOtp,
  });

  assert.strictEqual(startResult.booking.status, 'IN_PROGRESS');
  assert.strictEqual(startResult.booking.startOtp, undefined, 'Start-OTP must be deleted from database after verification');
});

// 7. Additional Scope Proposal & Approval
runSmokeTest('SMK-07: Transparent Price Approval - In-progress parts quote approved by customer', () => {
  const providerSession = {
    userId: testProviderUser.id,
    phone: testProviderUser.phone,
    name: testProviderUser.name,
    role: 'PROVIDER',
  };
  const customerSession = {
    userId: testCustomer.id,
    phone: testCustomer.phone,
    name: testCustomer.name,
    role: 'CUSTOMER',
  };

  // Provider proposes new MCB parts
  const awaitingApproval = BookingService.proposeAdditionalCharges(providerSession, {
    bookingId: smokeBooking.id,
    amount: 350,
    reason: 'Heavy-duty Havells 32A MCB replacement',
  });
  assert.strictEqual(awaitingApproval.status, 'AWAITING_PRICE_CONFIRMATION');

  // Customer approves quote
  const approved = BookingService.respondToAdditionalCharges(customerSession, {
    bookingId: smokeBooking.id,
    approved: true,
  });
  assert.strictEqual(approved.status, 'IN_PROGRESS');
  assert.strictEqual(approved.additionalCharges.customerApproved, true);
});

// 8. Cash Collection Report & Confirmation
runSmokeTest('SMK-08: Cash-on-Service & Warranty - Verified cash payment activates 7-Day Warranty', () => {
  const providerSession = {
    userId: testProviderUser.id,
    phone: testProviderUser.phone,
    name: testProviderUser.name,
    role: 'PROVIDER',
  };
  const customerSession = {
    userId: testCustomer.id,
    phone: testCustomer.phone,
    name: testCustomer.name,
    role: 'CUSTOMER',
  };

  // Provider reports cash
  const cashReported = BookingService.reportCashPayment(providerSession, {
    bookingId: smokeBooking.id,
    amount: 499,
  });
  assert.strictEqual(cashReported.cashPayment.status, 'CASH_REPORTED');

  // Customer confirms cash payment
  const completed = BookingService.confirmCashPayment(customerSession, {
    bookingId: smokeBooking.id,
  });
  assert.strictEqual(completed.status, 'COMPLETED');
  assert.ok(completed.warrantyId, 'Completed booking must have active warranty ID');

  // Check warranty in database
  const warranty = db.getWarrantyByBookingId(smokeBooking.id);
  assert.ok(warranty, 'Warranty record must exist in database');
  assert.strictEqual(warranty.status, 'ACTIVE');
  assert.strictEqual(warranty.customerId, testCustomer.id);
});

// 9. Ratings & Reviews
runSmokeTest('SMK-09: Customer Reviews - Verified customer leaves 5-star review', () => {
  const review = {
    id: generateSecureId('rev'),
    bookingId: smokeBooking.id,
    customerId: testCustomer.id,
    customerName: testCustomer.name,
    providerId: testProviderProfile.id,
    rating: 5,
    qualityRating: 5,
    professionalismRating: 5,
    valueRating: 5,
    comment: 'Excellent work, quick MCB replacement and very polite technician in Chilakaluripet!',
    createdAt: new Date().toISOString(),
  };

  db.saveReview(review);
  const reviews = db.getReviewsForProvider(testProviderProfile.id);
  assert.ok(reviews.length > 0);
  assert.strictEqual(reviews[0].rating, 5);
});

// 10. Privacy & Authorization Boundary (BOLA / IDOR)
runSmokeTest('SMK-10: Tenant Isolation - Attacker cannot view or modify smoke booking', () => {
  const attackerSession = {
    userId: 'usr-attacker-999',
    phone: '9999999999',
    name: 'Attacker Malicious',
    role: 'CUSTOMER',
  };

  assert.throws(() => {
    BookingService.transitionBookingStatus(attackerSession, {
      bookingId: smokeBooking.id,
      targetStatus: 'CANCELLED_BY_CUSTOMER',
      cancellationReason: 'Malicious cancel',
    });
  }, /Forbidden: You are not authorized to modify this booking/);
});

console.log('\n====================================================');
console.log(`   SMOKE TEST RESULTS: ${passedTests} / ${totalTests} PASSED   `);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
