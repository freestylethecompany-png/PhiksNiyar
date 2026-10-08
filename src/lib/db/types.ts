// LOCALAI Database Types & Interfaces

export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'SUPPORT' | 'ADMIN';

export type VerificationStatus =
  | 'PENDING'
  | 'DOCUMENT_SUBMITTED'
  | 'KYC_PROCESSING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SCHEDULED'
  | 'PROVIDER_ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'COMPLETED'
  | 'DISPUTED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'UPI' | 'CASH' | 'RAZORPAY';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface City {
  id: string;
  name: string;
  state: string;
  district: string;
  country: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
}

export interface ServiceArea {
  id: string;
  cityId: string;
  name: string;
  pincode: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  teluguName?: string;
  teluguDescription?: string;
  subcategories: string[];
  basePriceEstimate: number;
  popular: boolean;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  defaultAddressId?: string;
  totalBookings: number;
  emergencyPhone?: string;
  preferredLanguage: string;
}

export interface Address {
  id: string;
  userId: string;
  title: string; // e.g. "Home", "Shop"
  street: string;
  areaName: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  primaryCategory: string;
  categories: string[];
  subcategories: string[];
  experienceYears: number;
  bio: string;
  serviceRadiusKm: number;
  locationArea: string;
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  verificationProvider?: string;
  providerReferenceId?: string;
  verificationTimestamp?: string;
  maskedIdentityReference?: string;
  placeVerified?: boolean;
  placeVerifiedAt?: string;
  workshopGpsVerified?: boolean;
  aadhaarVerified?: boolean;
  aadhaarVerifiedAt?: string;
  aadhaarHash?: string;
  circumventionRiskScore?: number; // 0 (clean) to 100 (high risk of cash collusion)
  circumventionStrikes?: number;   // Count of cancellations after arrival
  verificationDocuments: {
    idDocumentUploaded?: boolean;
    aadhaarUploaded?: boolean;
    tradeLicenseUploaded?: boolean;
    certificateUploaded?: boolean;
    idNumberMasked?: string;
    workshopPhotoUploaded?: boolean;
  };
  workingHours: {
    days: string[];
    startTime: string; // e.g. "08:00"
    endTime: string;   // e.g. "20:00"
    isAvailableToday: boolean;
  };
  pricingModel: {
    visitingCharge: number;
    hourlyRate?: number;
    fixedServiceRates?: Record<string, number>;
  };
  metrics: {
    rating: number; // 0 - 5
    totalReviews: number;
    completedJobs: number;
    cancellationRate: number; // 0 - 100%
    responseRate: number;     // 0 - 100%
    avgResponseMinutes: number;
  };
  portfolioImages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AIUnderstoodRequest {
  category: string;
  subcategory: string;
  issue: string;
  rawInput: string;
  detectedLanguage: 'en' | 'te' | 'tanglish' | 'unknown';
  preferredDate: string;
  preferredTime: string;
  urgency: 'low' | 'normal' | 'urgent';
  estimatedCostRange?: { min: number; max: number };
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  rawText: string;
  parsedData: AIUnderstoodRequest;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
  status: 'OPEN' | 'MATCHED' | 'BOOKED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
}

export interface ProviderMatchResult {
  provider: ProviderProfile;
  user: User;
  overallScore: number; // 0 - 100
  breakdown: {
    categoryMatchScore: number;   // weight default 30%
    distanceScore: number;        // weight default 20%
    distanceKm: number;
    availabilityScore: number;    // weight default 15%
    ratingScore: number;          // weight default 10%
    completionRateScore: number;  // weight default 10%
    responseRateScore: number;    // weight default 5%
    priceScore: number;           // weight default 10%
  };
}

export interface Booking {
  id: string;
  serviceRequestId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: Address;
  providerId: string;
  providerName: string;
  providerPhone: string;
  category: string;
  subcategory: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  status: BookingStatus;
  startOtp?: string; // 4-digit doorstep verification code (masked for providers)
  startOtpAttempts?: number; // Failed attempt tracking
  startOtpLockedUntil?: string; // Brute force lock
  otpVerifiedAt?: string; // Timestamp of doorstep verification
  cancellationReason?: string;
  cancellationFlaggedCollusion?: boolean;
  priceMatchedAmount?: number;
  statusHistory: {
    status: BookingStatus;
    timestamp: string;
    note?: string;
    updatedByRole: UserRole;
  }[];
  pricing: {
    estimatedAmount: number;
    finalAmount?: number;
    visitingCharges: number;
    platformCommissionPercent: number;
    platformCommissionAmount: number;
    providerPayoutAmount: number;
  };
  payment?: {
    paymentId?: string;
    method: PaymentMethod;
    status: PaymentStatus;
    transactionRef?: string;
    paidAt?: string;
  };
  dispute?: {
    id: string;
    reason: string;
    status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
    openedBy: UserRole;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  rating: number; // 1 to 5
  qualityRating: number;
  professionalismRating: number;
  valueRating: number;
  comment: string;
  createdAt: string;
}

export interface PlatformSettings {
  platformCommissionPercent: number; // e.g. 10
  matchingWeights: {
    categoryMatch: number;      // 0.30
    distance: number;           // 0.20
    availability: number;       // 0.15
    rating: number;             // 0.10
    completionRate: number;     // 0.10
    responseRate: number;       // 0.05
    priceCompatibility: number; // 0.10
  };
  defaultSearchRadiusKm: number;
  currency: string;
  supportPhone: string;
  supportEmail: string;
  upiVpa: string; // for platform QR testing
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetEntity: string;
  targetId: string;
  details: Record<string, any>;
  timestamp: string;
}

export type DeliveryStatus =
  | 'ORDER_CONFIRMED'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export type VehicleType = 'BIKE' | 'SCOOTER' | 'CAR' | 'VAN';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface PartnerLocationState extends GeoPoint {
  heading: number; // 0-360 degrees
  speedKmh: number; // in km/h
  updatedAt: string;
}

export interface DeliveryTrackingOrder {
  id: string;
  orderId: string;
  bookingId?: string;
  status: DeliveryStatus;
  statusHistory: {
    status: DeliveryStatus;
    timestamp: string;
    note: string;
  }[];
  customer: {
    id: string;
    name: string;
    phone: string;
    location: GeoPoint;
    address: string;
    landmark?: string;
  };
  pickup: {
    name: string;
    phone: string;
    location: GeoPoint;
    address: string;
    category: string;
  };
  partner: {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string;
    rating: number;
    vehicleType: VehicleType;
    vehicleNumber?: string;
    currentLocation: PartnerLocationState;
  };
  metrics: {
    etaMinutes: number;
    estimatedArrivalTimestamp: string;
    remainingDistanceKm: number;
    totalDistanceKm: number;
  };
  routeGeometry: GeoPoint[]; // Road-based route polyline coordinates
  trackingActive: boolean;
  trafficLevel: 'LOW' | 'MODERATE' | 'HEAVY';
  createdAt: string;
  updatedAt: string;
}

