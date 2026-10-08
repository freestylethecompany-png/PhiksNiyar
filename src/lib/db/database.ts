// Persistent SQLite Database Repository for LOCALAI
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {
  User,
  CustomerProfile,
  ProviderProfile,
  Address,
  Booking,
  BookingStatus,
  Review,
  PlatformSettings,
  AuditLog,
  VerificationStatus,
  UserRole,
  DeliveryTrackingOrder,
  DeliveryStatus,
} from './types';
import { INITIAL_CITIES, CHILAKALURIPET_AREAS } from '../constants/locations';
import { SERVICE_CATEGORIES } from '../constants/categories';

// Ensure data directory exists in the workspace, container, or serverless environment
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
let dataDir = process.env.DATA_DIR || (isServerless ? '/tmp/data' : path.join(process.cwd(), 'data'));

try {
  if (!fs.existsSync(/* turbopackIgnore: true */ dataDir)) {
    fs.mkdirSync(/* turbopackIgnore: true */ dataDir, { recursive: true });
  }
} catch (dirErr) {
  console.warn('Could not initialize primary dataDir, falling back to /tmp/data:', dirErr);
  dataDir = '/tmp/data';
  if (!fs.existsSync(/* turbopackIgnore: true */ dataDir)) {
    try {
      fs.mkdirSync(/* turbopackIgnore: true */ dataDir, { recursive: true });
    } catch {}
  }
}

const legacyDbPath = path.join(dataDir, 'localai.db');
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'fixnear.db');

if (fs.existsSync(/* turbopackIgnore: true */ legacyDbPath) && !fs.existsSync(/* turbopackIgnore: true */ dbPath)) {
  try {
    fs.copyFileSync(legacyDbPath, dbPath);
  } catch (e) {
    console.warn('Could not copy legacy DB, creating new fixnear.db');
  }
}

const sqlite = new Database(dbPath);

// Enable WAL mode for high concurrency and performance
sqlite.pragma('journal_mode = WAL');

// Initialize Tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'CUSTOMER',
    avatarUrl TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customer_profiles (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE NOT NULL,
    defaultAddressId TEXT,
    totalBookings INTEGER NOT NULL DEFAULT 0,
    emergencyPhone TEXT,
    preferredLanguage TEXT DEFAULT 'te',
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Home',
    street TEXT NOT NULL,
    areaName TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
    pincode TEXT NOT NULL DEFAULT '522616',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    isDefault INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE NOT NULL,
    businessName TEXT NOT NULL,
    bio TEXT,
    primaryCategory TEXT NOT NULL,
    categories TEXT NOT NULL, -- JSON array
    subcategories TEXT NOT NULL, -- JSON array
    experienceYears INTEGER NOT NULL DEFAULT 1,
    serviceRadiusKm REAL NOT NULL DEFAULT 10.0,
    locationArea TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    verificationStatus TEXT NOT NULL DEFAULT 'UNVERIFIED',
    verificationDocuments TEXT NOT NULL, -- JSON
    workingHours TEXT NOT NULL, -- JSON
    visitingCharge REAL NOT NULL DEFAULT 199.0,
    hourlyRate REAL,
    fixedRates TEXT, -- JSON
    rating REAL NOT NULL DEFAULT 5.0,
    totalReviews INTEGER NOT NULL DEFAULT 0,
    completedJobs INTEGER NOT NULL DEFAULT 0,
    cancellationRate REAL NOT NULL DEFAULT 0.0,
    responseRate REAL NOT NULL DEFAULT 100.0,
    avgResponseMinutes INTEGER NOT NULL DEFAULT 15,
    portfolioImages TEXT, -- JSON array
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    serviceRequestId TEXT,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    customerAddress TEXT NOT NULL, -- JSON Address
    providerId TEXT NOT NULL,
    providerName TEXT NOT NULL,
    providerPhone TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    description TEXT NOT NULL,
    scheduledDate TEXT NOT NULL,
    scheduledTime TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    statusHistory TEXT NOT NULL, -- JSON array
    pricing TEXT NOT NULL, -- JSON
    payment TEXT, -- JSON
    dispute TEXT, -- JSON
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(customerId) REFERENCES users(id),
    FOREIGN KEY(providerId) REFERENCES providers(id)
  );

  CREATE TABLE IF NOT EXISTS booking_messages (
    id TEXT PRIMARY KEY,
    bookingId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    senderRole TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(bookingId) REFERENCES bookings(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    bookingId TEXT UNIQUE NOT NULL,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    providerId TEXT NOT NULL,
    rating INTEGER NOT NULL,
    qualityRating INTEGER NOT NULL,
    professionalismRating INTEGER NOT NULL,
    valueRating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(bookingId) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY(customerId) REFERENCES users(id),
    FOREIGN KEY(providerId) REFERENCES providers(id)
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    id TEXT PRIMARY KEY,
    commissionPercent REAL NOT NULL DEFAULT 10.0,
    matchingWeights TEXT NOT NULL, -- JSON
    defaultSearchRadiusKm REAL NOT NULL DEFAULT 15.0,
    currency TEXT NOT NULL DEFAULT 'INR',
    supportPhone TEXT NOT NULL DEFAULT '+91 8647 254999',
    supportEmail TEXT NOT NULL DEFAULT 'support@sevanta.in',
    upiVpa TEXT NOT NULL DEFAULT 'sevanta.payments@okhdfcbank',
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actorId TEXT,
    actorRole TEXT NOT NULL,
    action TEXT NOT NULL,
    targetEntity TEXT NOT NULL,
    targetId TEXT NOT NULL,
    details TEXT NOT NULL, -- JSON
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expiresAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS delivery_tracking (
    id TEXT PRIMARY KEY,
    orderId TEXT UNIQUE NOT NULL,
    bookingId TEXT,
    status TEXT NOT NULL DEFAULT 'ORDER_CONFIRMED',
    statusHistory TEXT NOT NULL,      -- JSON array
    customer TEXT NOT NULL,           -- JSON
    pickup TEXT NOT NULL,             -- JSON
    partner TEXT NOT NULL,            -- JSON
    metrics TEXT NOT NULL,            -- JSON
    routeGeometry TEXT NOT NULL,      -- JSON array of GeoPoint
    trackingActive INTEGER NOT NULL DEFAULT 1,
    trafficLevel TEXT NOT NULL DEFAULT 'LOW',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// High-security Aadhaar & Place verification, Doorstep OTP, and Anti-Circumvention migrations
const addColumnSafe = (table: string, columnDef: string) => {
  try {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (e) {
    // Column already exists
  }
};

addColumnSafe('providers', 'aadhaarVerified INTEGER DEFAULT 0');
addColumnSafe('providers', 'aadhaarVerifiedAt TEXT');
addColumnSafe('providers', 'aadhaarHash TEXT');
addColumnSafe('providers', 'placeVerified INTEGER DEFAULT 1');
addColumnSafe('providers', 'placeVerifiedAt TEXT');
addColumnSafe('providers', 'workshopGpsVerified INTEGER DEFAULT 1');
addColumnSafe('providers', 'circumventionRiskScore REAL DEFAULT 0.0');
addColumnSafe('providers', 'circumventionStrikes INTEGER DEFAULT 0');

addColumnSafe('bookings', 'startOtp TEXT');
addColumnSafe('bookings', 'cancellationReason TEXT');
addColumnSafe('bookings', 'cancellationFlaggedCollusion INTEGER DEFAULT 0');
addColumnSafe('bookings', 'priceMatchedAmount REAL');

// Repository Class providing type-safe CRUD
class PersistentDatabase {
  constructor() {
    this.seedIfEmpty();
    this.seedDeliveriesIfEmpty();
  }

  // --- SETTINGS ---
  public getSettings(): PlatformSettings {
    const row = sqlite.prepare('SELECT * FROM platform_settings WHERE id = ?').get('global') as any;
    if (!row) {
      const defaultSettings: PlatformSettings = {
        platformCommissionPercent: 10.0,
        matchingWeights: {
          categoryMatch: 0.30,
          distance: 0.20,
          availability: 0.15,
          rating: 0.10,
          completionRate: 0.10,
          responseRate: 0.05,
          priceCompatibility: 0.10,
        },
        defaultSearchRadiusKm: 15.0,
        currency: 'INR',
        supportPhone: '+91 8647 254999',
        supportEmail: 'support@sevanta.in',
        upiVpa: 'sevanta.payments@okhdfcbank',
      };

      sqlite.prepare(`
        INSERT INTO platform_settings (id, commissionPercent, matchingWeights, defaultSearchRadiusKm, currency, supportPhone, supportEmail, upiVpa, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          commissionPercent = excluded.commissionPercent,
          matchingWeights = excluded.matchingWeights,
          defaultSearchRadiusKm = excluded.defaultSearchRadiusKm,
          currency = excluded.currency,
          supportPhone = excluded.supportPhone,
          supportEmail = excluded.supportEmail,
          upiVpa = excluded.upiVpa,
          updatedAt = excluded.updatedAt
      `).run(
        'global',
        defaultSettings.platformCommissionPercent,
        JSON.stringify(defaultSettings.matchingWeights),
        defaultSettings.defaultSearchRadiusKm,
        defaultSettings.currency,
        defaultSettings.supportPhone,
        defaultSettings.supportEmail,
        defaultSettings.upiVpa,
        new Date().toISOString()
      );

      return defaultSettings;
    }
    return {
      platformCommissionPercent: row.commissionPercent,
      matchingWeights: JSON.parse(row.matchingWeights),
      defaultSearchRadiusKm: row.defaultSearchRadiusKm,
      currency: row.currency,
      supportPhone: row.supportPhone,
      supportEmail: row.supportEmail,
      upiVpa: row.upiVpa,
    };
  }

  public updateSettings(settings: Partial<PlatformSettings>) {
    const row = sqlite.prepare('SELECT * FROM platform_settings WHERE id = ?').get('global') as any;
    const defaultWeights = {
      categoryMatch: 0.30,
      distance: 0.20,
      availability: 0.15,
      rating: 0.10,
      completionRate: 0.10,
      responseRate: 0.05,
      priceCompatibility: 0.10,
    };

    const commission = settings.platformCommissionPercent !== undefined
      ? settings.platformCommissionPercent
      : (row ? row.commissionPercent : 10.0);
    const weights = settings.matchingWeights
      ? settings.matchingWeights
      : (row ? JSON.parse(row.matchingWeights) : defaultWeights);
    const radius = settings.defaultSearchRadiusKm !== undefined
      ? settings.defaultSearchRadiusKm
      : (row ? row.defaultSearchRadiusKm : 15.0);
    const currency = settings.currency || (row ? row.currency : 'INR');
    const supportPhone = settings.supportPhone || (row ? row.supportPhone : '+91 8647 254999');
    const supportEmail = settings.supportEmail || (row ? row.supportEmail : 'support@sevanta.in');
    const upiVpa = settings.upiVpa || (row ? row.upiVpa : 'sevanta.payments@okhdfcbank');

    const stmt = sqlite.prepare(`
      INSERT INTO platform_settings (id, commissionPercent, matchingWeights, defaultSearchRadiusKm, currency, supportPhone, supportEmail, upiVpa, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        commissionPercent = excluded.commissionPercent,
        matchingWeights = excluded.matchingWeights,
        defaultSearchRadiusKm = excluded.defaultSearchRadiusKm,
        currency = excluded.currency,
        supportPhone = excluded.supportPhone,
        supportEmail = excluded.supportEmail,
        upiVpa = excluded.upiVpa,
        updatedAt = excluded.updatedAt
    `);
    stmt.run(
      'global',
      commission,
      JSON.stringify(weights),
      radius,
      currency,
      supportPhone,
      supportEmail,
      upiVpa,
      new Date().toISOString()
    );
  }

  // --- USERS ---
  public getUserById(id: string): User | undefined {
    const row = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      phone: row.phone,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public getUserByPhone(phone: string): User | undefined {
    const row = sqlite.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      phone: row.phone,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public saveUser(user: User): User {
    const stmt = sqlite.prepare(`
      INSERT INTO users (id, phone, name, email, role, avatarUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        phone = excluded.phone,
        name = excluded.name,
        email = excluded.email,
        role = excluded.role,
        avatarUrl = excluded.avatarUrl,
        updatedAt = excluded.updatedAt
    `);
    stmt.run(
      user.id,
      user.phone,
      user.name,
      user.email || null,
      user.role,
      user.avatarUrl || null,
      user.createdAt,
      user.updatedAt
    );
    return user;
  }

  // --- PROVIDERS ---
  public getProviders(): ProviderProfile[] {
    const rows = sqlite.prepare('SELECT * FROM providers').all() as any[];
    return rows.map(this.mapProviderRow);
  }

  public getProviderById(id: string): ProviderProfile | undefined {
    const row = sqlite.prepare('SELECT * FROM providers WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return this.mapProviderRow(row);
  }

  public getProviderByUserId(userId: string): ProviderProfile | undefined {
    const row = sqlite.prepare('SELECT * FROM providers WHERE userId = ?').get(userId) as any;
    if (!row) return undefined;
    return this.mapProviderRow(row);
  }

  public saveProvider(provider: ProviderProfile): ProviderProfile {
    const stmt = sqlite.prepare(`
      INSERT INTO providers (
        id, userId, businessName, bio, primaryCategory, categories, subcategories,
        experienceYears, serviceRadiusKm, locationArea, latitude, longitude,
        verificationStatus, verificationDocuments, workingHours, visitingCharge,
        hourlyRate, fixedRates, rating, totalReviews, completedJobs, cancellationRate,
        responseRate, avgResponseMinutes, portfolioImages, createdAt, updatedAt,
        aadhaarVerified, aadhaarVerifiedAt, aadhaarHash, placeVerified, placeVerifiedAt,
        workshopGpsVerified, circumventionRiskScore, circumventionStrikes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        businessName = excluded.businessName,
        bio = excluded.bio,
        primaryCategory = excluded.primaryCategory,
        categories = excluded.categories,
        subcategories = excluded.subcategories,
        experienceYears = excluded.experienceYears,
        serviceRadiusKm = excluded.serviceRadiusKm,
        locationArea = excluded.locationArea,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        verificationStatus = excluded.verificationStatus,
        verificationDocuments = excluded.verificationDocuments,
        workingHours = excluded.workingHours,
        visitingCharge = excluded.visitingCharge,
        hourlyRate = excluded.hourlyRate,
        fixedRates = excluded.fixedRates,
        rating = excluded.rating,
        totalReviews = excluded.totalReviews,
        completedJobs = excluded.completedJobs,
        cancellationRate = excluded.cancellationRate,
        responseRate = excluded.responseRate,
        avgResponseMinutes = excluded.avgResponseMinutes,
        portfolioImages = excluded.portfolioImages,
        updatedAt = excluded.updatedAt,
        aadhaarVerified = COALESCE(excluded.aadhaarVerified, providers.aadhaarVerified),
        aadhaarVerifiedAt = COALESCE(excluded.aadhaarVerifiedAt, providers.aadhaarVerifiedAt),
        aadhaarHash = COALESCE(excluded.aadhaarHash, providers.aadhaarHash),
        placeVerified = COALESCE(excluded.placeVerified, providers.placeVerified),
        placeVerifiedAt = COALESCE(excluded.placeVerifiedAt, providers.placeVerifiedAt),
        workshopGpsVerified = COALESCE(excluded.workshopGpsVerified, providers.workshopGpsVerified),
        circumventionRiskScore = COALESCE(excluded.circumventionRiskScore, providers.circumventionRiskScore),
        circumventionStrikes = COALESCE(excluded.circumventionStrikes, providers.circumventionStrikes)
    `);

    stmt.run(
      provider.id,
      provider.userId,
      provider.businessName,
      provider.bio,
      provider.primaryCategory,
      JSON.stringify(provider.categories),
      JSON.stringify(provider.subcategories),
      provider.experienceYears,
      provider.serviceRadiusKm,
      provider.locationArea,
      provider.latitude,
      provider.longitude,
      provider.verificationStatus,
      JSON.stringify(provider.verificationDocuments),
      JSON.stringify(provider.workingHours),
      provider.pricingModel.visitingCharge,
      provider.pricingModel.hourlyRate || null,
      JSON.stringify(provider.pricingModel.fixedServiceRates || {}),
      provider.metrics.rating,
      provider.metrics.totalReviews,
      provider.metrics.completedJobs,
      provider.metrics.cancellationRate,
      provider.metrics.responseRate,
      provider.metrics.avgResponseMinutes,
      JSON.stringify(provider.portfolioImages || []),
      provider.createdAt,
      provider.updatedAt,
      provider.aadhaarVerified ? 1 : 0,
      provider.aadhaarVerifiedAt || null,
      provider.aadhaarHash || null,
      provider.placeVerified ? 1 : 0,
      provider.placeVerifiedAt || null,
      provider.workshopGpsVerified ? 1 : 0,
      provider.circumventionRiskScore || 0,
      provider.circumventionStrikes || 0
    );

    return provider;
  }

  // --- BOOKINGS ---
  public getBookings(): Booking[] {
    const rows = sqlite.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all() as any[];
    return rows.map(this.mapBookingRow);
  }

  public getBookingById(id: string): Booking | undefined {
    const row = sqlite.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return this.mapBookingRow(row);
  }

  public saveBooking(booking: Booking): Booking {
    const stmt = sqlite.prepare(`
      INSERT INTO bookings (
        id, serviceRequestId, customerId, customerName, customerPhone,
        customerAddress, providerId, providerName, providerPhone,
        category, subcategory, description, scheduledDate, scheduledTime,
        status, statusHistory, pricing, payment, dispute, createdAt, updatedAt,
        startOtp, cancellationReason, cancellationFlaggedCollusion, priceMatchedAmount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        statusHistory = excluded.statusHistory,
        pricing = excluded.pricing,
        payment = excluded.payment,
        dispute = excluded.dispute,
        updatedAt = excluded.updatedAt,
        startOtp = COALESCE(excluded.startOtp, bookings.startOtp),
        cancellationReason = COALESCE(excluded.cancellationReason, bookings.cancellationReason),
        cancellationFlaggedCollusion = MAX(excluded.cancellationFlaggedCollusion, bookings.cancellationFlaggedCollusion),
        priceMatchedAmount = COALESCE(excluded.priceMatchedAmount, bookings.priceMatchedAmount)
    `);

    stmt.run(
      booking.id,
      booking.serviceRequestId || null,
      booking.customerId,
      booking.customerName,
      booking.customerPhone,
      JSON.stringify(booking.customerAddress),
      booking.providerId,
      booking.providerName,
      booking.providerPhone,
      booking.category,
      booking.subcategory,
      booking.description,
      booking.scheduledDate,
      booking.scheduledTime,
      booking.status,
      JSON.stringify(booking.statusHistory),
      JSON.stringify(booking.pricing),
      booking.payment ? JSON.stringify(booking.payment) : null,
      booking.dispute ? JSON.stringify(booking.dispute) : null,
      booking.createdAt,
      booking.updatedAt,
      booking.startOtp || null,
      booking.cancellationReason || null,
      booking.cancellationFlaggedCollusion ? 1 : 0,
      booking.priceMatchedAmount || null
    );

    return booking;
  }

  // --- MESSAGES ---
  public getMessagesForBooking(bookingId: string) {
    return sqlite.prepare('SELECT * FROM booking_messages WHERE bookingId = ? ORDER BY createdAt ASC').all(bookingId) as any[];
  }

  public addMessage(msg: { id: string; bookingId: string; senderId: string; senderRole: string; text: string; createdAt: string }) {
    sqlite.prepare(`
      INSERT INTO booking_messages (id, bookingId, senderId, senderRole, text, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(msg.id, msg.bookingId, msg.senderId, msg.senderRole, msg.text, msg.createdAt);
  }

  // --- REVIEWS ---
  public getReviews(): Review[] {
    const rows = sqlite.prepare('SELECT * FROM reviews ORDER BY createdAt DESC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      customerId: r.customerId,
      customerName: r.customerName,
      providerId: r.providerId,
      rating: r.rating,
      qualityRating: r.qualityRating,
      professionalismRating: r.professionalismRating,
      valueRating: r.valueRating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  }

  public getReviewsForProvider(providerId: string): Review[] {
    const rows = sqlite.prepare('SELECT * FROM reviews WHERE providerId = ? ORDER BY createdAt DESC').all(providerId) as any[];
    return rows.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      customerId: r.customerId,
      customerName: r.customerName,
      providerId: r.providerId,
      rating: r.rating,
      qualityRating: r.qualityRating,
      professionalismRating: r.professionalismRating,
      valueRating: r.valueRating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  }

  public saveReview(review: Review): Review {
    sqlite.prepare(`
      INSERT INTO reviews (
        id, bookingId, customerId, customerName, providerId, rating,
        qualityRating, professionalismRating, valueRating, comment, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      review.id,
      review.bookingId,
      review.customerId,
      review.customerName,
      review.providerId,
      review.rating,
      review.qualityRating,
      review.professionalismRating,
      review.valueRating,
      review.comment,
      review.createdAt
    );
    return review;
  }

  // --- AUDIT LOGS ---
  public addAuditLog(log: AuditLog) {
    sqlite.prepare(`
      INSERT INTO audit_logs (id, actorId, actorRole, action, targetEntity, targetId, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      log.id,
      log.actorId,
      log.actorRole,
      log.action,
      log.targetEntity,
      log.targetId,
      JSON.stringify(log.details),
      log.timestamp
    );
  }

  public getAuditLogs(limit = 20): AuditLog[] {
    const rows = sqlite.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      actorRole: r.actorRole as UserRole,
      action: r.action,
      targetEntity: r.targetEntity,
      targetId: r.targetId,
      details: JSON.parse(r.details || '{}'),
      timestamp: r.timestamp,
    }));
  }

  // --- OTP VERIFICATION ---
  public saveOtp(phone: string, code: string, expiryMinutes = 10) {
    const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
    sqlite.prepare(`
      INSERT INTO otp_codes (phone, code, expiresAt)
      VALUES (?, ?, ?)
      ON CONFLICT(phone) DO UPDATE SET code = excluded.code, expiresAt = excluded.expiresAt
    `).run(phone, code, expiresAt);
  }

  public verifyOtp(phone: string, inputCode: string): boolean {
    const row = sqlite.prepare('SELECT * FROM otp_codes WHERE phone = ?').get(phone) as any;
    if (!row) return false;
    if (Date.now() > row.expiresAt) return false;
    // Support either exact code or demo bypass 123456
    if (row.code === inputCode || inputCode === '123456') {
      sqlite.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);
      return true;
    }
    return false;
  }

  // Mappers
  private mapProviderRow(row: any): ProviderProfile {
    return {
      id: row.id,
      userId: row.userId,
      businessName: row.businessName,
      bio: row.bio,
      primaryCategory: row.primaryCategory,
      categories: JSON.parse(row.categories || '[]'),
      subcategories: JSON.parse(row.subcategories || '[]'),
      experienceYears: row.experienceYears,
      serviceRadiusKm: row.serviceRadiusKm,
      locationArea: row.locationArea,
      latitude: row.latitude,
      longitude: row.longitude,
      verificationStatus: row.verificationStatus as VerificationStatus,
      aadhaarVerified: Boolean(row.aadhaarVerified || (row.verificationStatus === 'VERIFIED')),
      aadhaarVerifiedAt: row.aadhaarVerifiedAt || (row.verificationStatus === 'VERIFIED' ? row.createdAt : undefined),
      aadhaarHash: row.aadhaarHash || undefined,
      placeVerified: Boolean(row.placeVerified ?? 1),
      placeVerifiedAt: row.placeVerifiedAt || row.createdAt,
      workshopGpsVerified: Boolean(row.workshopGpsVerified ?? 1),
      circumventionRiskScore: row.circumventionRiskScore || 0,
      circumventionStrikes: row.circumventionStrikes || 0,
      verificationDocuments: JSON.parse(row.verificationDocuments || '{}'),
      workingHours: JSON.parse(row.workingHours || '{}'),
      pricingModel: {
        visitingCharge: row.visitingCharge,
        hourlyRate: row.hourlyRate || undefined,
        fixedServiceRates: JSON.parse(row.fixedRates || '{}'),
      },
      metrics: {
        rating: row.rating,
        totalReviews: row.totalReviews,
        completedJobs: row.completedJobs,
        cancellationRate: row.cancellationRate,
        responseRate: row.responseRate,
        avgResponseMinutes: row.avgResponseMinutes,
      },
      portfolioImages: JSON.parse(row.portfolioImages || '[]'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapBookingRow(row: any): Booking {
    return {
      id: row.id,
      serviceRequestId: row.serviceRequestId || undefined,
      customerId: row.customerId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerAddress: JSON.parse(row.customerAddress),
      providerId: row.providerId,
      providerName: row.providerName,
      providerPhone: row.providerPhone,
      category: row.category,
      subcategory: row.subcategory,
      description: row.description,
      scheduledDate: row.scheduledDate,
      scheduledTime: row.scheduledTime,
      status: row.status as BookingStatus,
      statusHistory: JSON.parse(row.statusHistory || '[]'),
      pricing: JSON.parse(row.pricing),
      payment: row.payment ? JSON.parse(row.payment) : undefined,
      dispute: row.dispute ? JSON.parse(row.dispute) : undefined,
      startOtp: row.startOtp || undefined,
      cancellationReason: row.cancellationReason || undefined,
      cancellationFlaggedCollusion: Boolean(row.cancellationFlaggedCollusion),
      priceMatchedAmount: row.priceMatchedAmount || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  // --- DELIVERY TRACKING ---
  public getDeliveryTracking(orderId: string): DeliveryTrackingOrder | undefined {
    const row = sqlite.prepare('SELECT * FROM delivery_tracking WHERE orderId = ? OR id = ?').get(orderId, orderId) as any;
    if (!row) return undefined;
    return this.mapDeliveryTrackingRow(row);
  }

  public getAllActiveDeliveries(): DeliveryTrackingOrder[] {
    const rows = sqlite.prepare('SELECT * FROM delivery_tracking ORDER BY updatedAt DESC').all() as any[];
    return rows.map(this.mapDeliveryTrackingRow);
  }

  public saveDeliveryTracking(order: DeliveryTrackingOrder): DeliveryTrackingOrder {
    const stmt = sqlite.prepare(`
      INSERT INTO delivery_tracking (
        id, orderId, bookingId, status, statusHistory, customer, pickup,
        partner, metrics, routeGeometry, trackingActive, trafficLevel,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(orderId) DO UPDATE SET
        status = excluded.status,
        statusHistory = excluded.statusHistory,
        customer = excluded.customer,
        pickup = excluded.pickup,
        partner = excluded.partner,
        metrics = excluded.metrics,
        routeGeometry = excluded.routeGeometry,
        trackingActive = excluded.trackingActive,
        trafficLevel = excluded.trafficLevel,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      order.id,
      order.orderId,
      order.bookingId || null,
      order.status,
      JSON.stringify(order.statusHistory),
      JSON.stringify(order.customer),
      JSON.stringify(order.pickup),
      JSON.stringify(order.partner),
      JSON.stringify(order.metrics),
      JSON.stringify(order.routeGeometry),
      order.trackingActive ? 1 : 0,
      order.trafficLevel,
      order.createdAt,
      order.updatedAt
    );

    return order;
  }

  public updateDeliveryPartnerLocation(
    orderId: string,
    latitude: number,
    longitude: number,
    heading = 0,
    speedKmh = 0
  ): DeliveryTrackingOrder | undefined {
    const order = this.getDeliveryTracking(orderId);
    if (!order) return undefined;

    // If already delivered, live tracking is locked
    if (!order.trackingActive || order.status === 'DELIVERED') {
      return order;
    }

    order.partner.currentLocation = {
      latitude,
      longitude,
      heading,
      speedKmh,
      updatedAt: new Date().toISOString(),
    };

    // Calculate remaining Euclidean distance to customer
    const dest = order.customer.location;
    const dLat = (dest.latitude - latitude) * (Math.PI / 180);
    const dLng = (dest.longitude - longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(latitude * (Math.PI / 180)) *
        Math.cos(dest.latitude * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDistKm = 6371 * c;
    const estRoadDistKm = Math.round(straightDistKm * 1.25 * 10) / 10;
    
    // Estimate ETA based on current speed or standard city speed (25 km/h)
    const effectiveSpeed = Math.max(15, Math.min(speedKmh, 50));
    const etaMinutes = Math.max(1, Math.round((estRoadDistKm / effectiveSpeed) * 60));

    order.metrics.remainingDistanceKm = estRoadDistKm;
    order.metrics.etaMinutes = etaMinutes;
    order.metrics.estimatedArrivalTimestamp = new Date(Date.now() + etaMinutes * 60000).toISOString();
    order.updatedAt = new Date().toISOString();

    return this.saveDeliveryTracking(order);
  }

  public updateDeliveryStatus(
    orderId: string,
    status: DeliveryStatus,
    note?: string
  ): DeliveryTrackingOrder | undefined {
    const order = this.getDeliveryTracking(orderId);
    if (!order) return undefined;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (status === 'DELIVERED' || status === 'CANCELLED') {
      order.trackingActive = false;
      order.metrics.remainingDistanceKm = 0;
      order.metrics.etaMinutes = 0;
    } else {
      order.trackingActive = true;
    }

    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Delivery milestone: ${status.replace('_', ' ')}`,
    });

    return this.saveDeliveryTracking(order);
  }

  private mapDeliveryTrackingRow(row: any): DeliveryTrackingOrder {
    return {
      id: row.id,
      orderId: row.orderId,
      bookingId: row.bookingId || undefined,
      status: row.status as DeliveryStatus,
      statusHistory: JSON.parse(row.statusHistory || '[]'),
      customer: JSON.parse(row.customer),
      pickup: JSON.parse(row.pickup),
      partner: JSON.parse(row.partner),
      metrics: JSON.parse(row.metrics),
      routeGeometry: JSON.parse(row.routeGeometry || '[]'),
      trackingActive: Boolean(row.trackingActive),
      trafficLevel: (row.trafficLevel as any) || 'LOW',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  // --- SEEDING (DEVELOPMENT / TEST ONLY) ---
  private seedIfEmpty() {
    // SECURITY: Never inject synthetic test profiles, fake ratings, or dummy bookings in production.
    const isProduction = process.env.NODE_ENV === 'production';
    const allowSeed = process.env.SEED_DEMO_DATA === 'true' && !isProduction;
    if (isProduction || !allowSeed) {
      return;
    }

    const userCount = (sqlite.prepare('SELECT count(*) as count FROM users').get() as any).count;
    if (userCount > 0) return;

    console.log('Seeding development database with initial test fixtures...');

    // 1. Customer User
    this.saveUser({
      id: 'usr-cust-1',
      name: 'Suresh Babu',
      phone: '+91 98480 12345',
      email: 'suresh.babu@gmail.com',
      role: 'CUSTOMER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Admin User
    this.saveUser({
      id: 'usr-admin-1',
      name: 'Sevanta Platform Admin',
      phone: '+91 90000 00001',
      email: 'admin@sevanta.in',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Provider 1: Ravi Kumar (AC Repair) - VERIFIED
    this.saveUser({
      id: 'usr-prov-1',
      name: 'Ravi Kumar',
      phone: '+91 94401 56789',
      role: 'PROVIDER',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.saveProvider({
      id: 'prov-1',
      userId: 'usr-prov-1',
      businessName: 'RK Cool Care & AC Services',
      primaryCategory: 'AC Repair & Service',
      categories: ['AC Repair & Service', 'Refrigerator Repair'],
      subcategories: ['Not Cooling', 'Gas Leakage / Refill', 'Deep Cleaning / Service', 'Installation / Uninstallation'],
      experienceYears: 8,
      bio: 'Expert AC technician with 8+ years experience in Voltas, Daikin, LG, and Blue Star split & inverter ACs in Chilakaluripet.',
      serviceRadiusKm: 15,
      locationArea: 'Pandaripuram',
      latitude: 16.0910,
      longitude: 80.1695,
      verificationStatus: 'VERIFIED',
      verificationDocuments: {
        aadhaarUploaded: true,
        tradeLicenseUploaded: true,
        certificateUploaded: true,
        idNumberMasked: 'XXXX-XXXX-4812',
      },
      workingHours: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '08:00',
        endTime: '20:30',
        isAvailableToday: true,
      },
      pricingModel: {
        visitingCharge: 249,
        hourlyRate: 350,
        fixedServiceRates: {
          'Deep Jet Cleaning': 499,
          'Gas Refill': 1799,
        },
      },
      metrics: {
        rating: 4.85,
        totalReviews: 48,
        completedJobs: 134,
        cancellationRate: 1.5,
        responseRate: 98,
        avgResponseMinutes: 8,
      },
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 4. Provider 2: G. Venkatesh (Electrician) - VERIFIED
    this.saveUser({
      id: 'usr-prov-2',
      name: 'G. Venkatesh',
      phone: '+91 98492 34567',
      role: 'PROVIDER',
      avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.saveProvider({
      id: 'prov-2',
      userId: 'usr-prov-2',
      businessName: 'Sri Venkateswara Electrical Works',
      primaryCategory: 'Electrician',
      categories: ['Electrician'],
      subcategories: ['Switchboard & Socket Repair', 'Ceiling Fan Repair / Installation', 'Inverter / Battery Wiring', 'MCB / Fuse Tripping', 'House Wiring / Rewiring'],
      experienceYears: 12,
      bio: 'Government licensed wireman in Chilakaluripet. 12+ years experience in domestic wiring, inverter connection, and motor starters.',
      serviceRadiusKm: 12,
      locationArea: 'Clock Tower Center (Ganta Sthambham)',
      latitude: 16.0898,
      longitude: 80.1678,
      verificationStatus: 'VERIFIED',
      verificationDocuments: {
        aadhaarUploaded: true,
        tradeLicenseUploaded: true,
        idNumberMasked: 'XXXX-XXXX-9931',
      },
      workingHours: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '08:30',
        endTime: '20:00',
        isAvailableToday: true,
      },
      pricingModel: {
        visitingCharge: 199,
        hourlyRate: 200,
      },
      metrics: {
        rating: 4.92,
        totalReviews: 76,
        completedJobs: 248,
        cancellationRate: 0.8,
        responseRate: 99,
        avgResponseMinutes: 5,
      },
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 5. Provider 3: Ch. Srinivasa Rao (Plumber) - VERIFIED
    this.saveUser({
      id: 'usr-prov-3',
      name: 'Ch. Srinivasa Rao (Seenu)',
      phone: '+91 97000 87654',
      role: 'PROVIDER',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.saveProvider({
      id: 'prov-3',
      userId: 'usr-prov-3',
      businessName: 'Seenu Plumbing Works',
      primaryCategory: 'Plumber',
      categories: ['Plumber'],
      subcategories: ['Tap Repair / Replacement', 'Pipe Blockage & Drainage', 'Water Motor Pump Repair'],
      experienceYears: 9,
      bio: 'Prompt plumbing solutions for tap leakage, overhead water tank connection, and bathroom fittings in Chilakaluripet.',
      serviceRadiusKm: 14,
      locationArea: 'Ganapavaram Road',
      latitude: 16.0820,
      longitude: 80.1550,
      verificationStatus: 'VERIFIED',
      verificationDocuments: {
        aadhaarUploaded: true,
        idNumberMasked: 'XXXX-XXXX-6122',
      },
      workingHours: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '07:30',
        endTime: '19:30',
        isAvailableToday: true,
      },
      pricingModel: {
        visitingCharge: 199,
        hourlyRate: 250,
      },
      metrics: {
        rating: 4.74,
        totalReviews: 35,
        completedJobs: 98,
        cancellationRate: 2.1,
        responseRate: 94,
        avgResponseMinutes: 12,
      },
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 6. Provider 4: Nagaraju K. (Cleaning & Pest Control) - PENDING
    this.saveUser({
      id: 'usr-prov-6',
      name: 'Nagaraju K.',
      phone: '+91 91234 56780',
      role: 'PROVIDER',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.saveProvider({
      id: 'prov-6',
      userId: 'usr-prov-6',
      businessName: 'Swachh Home Cleaning & Pest Control',
      primaryCategory: 'Home Cleaning',
      categories: ['Home Cleaning', 'Pest Control'],
      subcategories: ['Deep Bathroom Cleaning', 'Full Home Deep Cleaning', 'Cockroach Herbal Gel Treatment'],
      experienceYears: 4,
      bio: 'Eco-friendly deep cleaning & herbal pest control team based in Purushothapatnam, Chilakaluripet.',
      serviceRadiusKm: 12,
      locationArea: 'Purushothapatnam',
      latitude: 16.1050,
      longitude: 80.1740,
      verificationStatus: 'PENDING', // Ready for admin verification
      verificationDocuments: {
        aadhaarUploaded: true,
        tradeLicenseUploaded: true,
        idNumberMasked: 'XXXX-XXXX-3341',
      },
      workingHours: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '08:00',
        endTime: '18:00',
        isAvailableToday: true,
      },
      pricingModel: {
        visitingCharge: 299,
        hourlyRate: 350,
      },
      metrics: {
        rating: 4.5,
        totalReviews: 8,
        completedJobs: 15,
        cancellationRate: 4.0,
        responseRate: 90,
        avgResponseMinutes: 25,
      },
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Historical completed booking
    this.saveBooking({
      id: 'bk-hist-1',
      customerId: 'usr-cust-1',
      customerName: 'Suresh Babu',
      customerPhone: '+91 98480 12345',
      customerAddress: {
        id: 'addr-cust-1',
        userId: 'usr-cust-1',
        title: 'Home',
        street: 'D.No 4-22, Near Gandhi Statue, Kalamandir Center',
        areaName: 'Kalamandir Center',
        city: 'Chilakaluripet',
        state: 'Andhra Pradesh',
        pincode: '522616',
        latitude: 16.0885,
        longitude: 80.166,
        isDefault: true,
      },
      providerId: 'prov-1',
      providerName: 'RK Cool Care & AC Services',
      providerPhone: '+91 94401 56789',
      category: 'AC Repair & Service',
      subcategory: 'Not Cooling',
      description: 'Split AC cooling coil service',
      scheduledDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      scheduledTime: '11:00 AM',
      status: 'COMPLETED',
      statusHistory: [
        { status: 'REQUESTED', timestamp: new Date(Date.now() - 5 * 86400000 - 3600000).toISOString(), updatedByRole: 'CUSTOMER' },
        { status: 'ACCEPTED', timestamp: new Date(Date.now() - 5 * 86400000 - 3000000).toISOString(), updatedByRole: 'PROVIDER' },
        { status: 'COMPLETED', timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), updatedByRole: 'PROVIDER' },
      ],
      pricing: {
        estimatedAmount: 499,
        finalAmount: 499,
        visitingCharges: 249,
        platformCommissionPercent: 10,
        platformCommissionAmount: 49.9,
        providerPayoutAmount: 449.1,
      },
      payment: {
        paymentId: 'pay-hist-1',
        method: 'UPI',
        status: 'SUCCESS',
        transactionRef: 'UPI/384910294/FIXNEAR',
        paidAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    });

    // Seed reviews
    this.saveReview({
      id: 'rev-1',
      bookingId: 'bk-hist-1',
      customerId: 'usr-cust-1',
      customerName: 'Suresh Babu',
      providerId: 'prov-1',
      rating: 5,
      qualityRating: 5,
      professionalismRating: 5,
      valueRating: 5,
      comment: 'Ravi garu reached Kalamandir Center within 25 minutes. Fixed my Daikin AC cooling issue quickly and charged exactly as committed. Very polite!',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    });

    // Initial audit log
    this.addAuditLog({
      id: 'aud-init',
      actorId: 'usr-admin-1',
      actorRole: 'ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      targetEntity: 'DATABASE',
      targetId: 'sqlite',
      details: { market: 'Chilakaluripet', verifiedProvidersSeeded: 3 },
      timestamp: new Date().toISOString(),
    });
  }

  public seedDeliveriesIfEmpty() {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const allowSeed = process.env.SEED_DEMO_DATA === 'true' && !isProduction;
      if (isProduction || !allowSeed) {
        return;
      }

      const count = (sqlite.prepare('SELECT count(*) as count FROM delivery_tracking').get() as any).count;
      if (count > 0) return;

      const initialRoute = [
        { latitude: 16.090927, longitude: 80.169479 },
        { latitude: 16.090973, longitude: 80.169305 },
        { latitude: 16.091023, longitude: 80.169101 },
        { latitude: 16.091095, longitude: 80.168827 },
        { latitude: 16.09115, longitude: 80.16856 },
        { latitude: 16.091167, longitude: 80.168473 },
        { latitude: 16.091231, longitude: 80.168184 },
        { latitude: 16.091177, longitude: 80.168172 },
        { latitude: 16.091139, longitude: 80.168156 },
        { latitude: 16.091086, longitude: 80.168105 },
        { latitude: 16.090623, longitude: 80.168002 },
        { latitude: 16.090078, longitude: 80.167925 },
        { latitude: 16.090145, longitude: 80.167402 },
        { latitude: 16.089762, longitude: 80.167312 },
        { latitude: 16.089464, longitude: 80.167228 },
        { latitude: 16.08944, longitude: 80.167219 },
        { latitude: 16.089137, longitude: 80.167113 },
        { latitude: 16.088888, longitude: 80.166993 },
        { latitude: 16.088687, longitude: 80.166852 },
        { latitude: 16.088714, longitude: 80.166668 },
        { latitude: 16.088717, longitude: 80.166595 },
        { latitude: 16.088708, longitude: 80.166495 },
        { latitude: 16.088706, longitude: 80.166296 },
        { latitude: 16.088745, longitude: 80.165997 },
        { latitude: 16.0885, longitude: 80.165996 },
      ];

      this.saveDeliveryTracking({
        id: 'del-cpt-101',
        orderId: 'CPT-DEL-101',
        bookingId: 'bk-1791385037898',
        status: 'ON_THE_WAY',
        statusHistory: [
          { status: 'ORDER_CONFIRMED', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), note: 'Order confirmed by FixNear Services' },
          { status: 'PREPARING', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), note: 'AC replacement parts & diagnostic kit packed' },
          { status: 'PICKED_UP', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), note: 'Ravi Kumar picked up package from Pandaripuram Spares Hub' },
          { status: 'ON_THE_WAY', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), note: 'Delivery partner is on the way to customer doorstep' },
        ],
        customer: {
          id: 'usr-cust-1',
          name: 'Suresh Babu',
          phone: '+91 98480 12345',
          location: { latitude: 16.0885, longitude: 80.1660 },
          address: 'D.No 4-22, Near Gandhi Statue, Kalamandir Center, Chilakaluripet',
          landmark: 'Opposite Kalamandir Cloth Showroom',
        },
        pickup: {
          name: 'FixNear Pandaripuram Parts Hub',
          phone: '+91 8647 254999',
          location: { latitude: 16.0910, longitude: 80.1695 },
          address: 'Main Road, Pandaripuram, Chilakaluripet',
          category: 'AC Spare Parts & Electronics Hub',
        },
        partner: {
          id: 'usr-prov-1',
          name: 'Ravi Kumar',
          phone: '+91 94401 56789',
          avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
          rating: 4.88,
          vehicleType: 'BIKE',
          vehicleNumber: 'AP 07 CK 4821',
          currentLocation: {
            latitude: 16.090623,
            longitude: 80.168002,
            heading: 235,
            speedKmh: 28,
            updatedAt: new Date().toISOString(),
          },
        },
        metrics: {
          etaMinutes: 4,
          estimatedArrivalTimestamp: new Date(Date.now() + 4 * 60000).toISOString(),
          remainingDistanceKm: 0.42,
          totalDistanceKm: 0.62,
        },
        routeGeometry: initialRoute,
        trackingActive: true,
        trafficLevel: 'LOW',
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not seed deliveries:', e);
    }
  }

  // Compat getters for legacy code
  public get settings() {
    return this.getSettings();
  }
}

// Global Singleton
const globalForDb = globalThis as unknown as { localaiPersistentDb?: PersistentDatabase };
export const db = globalForDb.localaiPersistentDb || new PersistentDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.localaiPersistentDb = db;
