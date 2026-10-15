-- ============================================================================
-- SEVANTA (సేవంత) MARKETPLACE - PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- Initial Market: Chilakaluripet, Andhra Pradesh, India (PIN: 522616)
-- 100% Idempotent Script: Safe to execute repeatedly without errors
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- ENUMS (Safely created with IF NOT EXISTS checks)
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('CUSTOMER', 'PROVIDER', 'SUPPORT', 'ADMIN');
  ELSE
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPPORT';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM (
      'PENDING',
      'UNDER_REVIEW',
      'VERIFIED',
      'REJECTED',
      'SUSPENDED',
      'INACTIVE',
      'DOCUMENT_SUBMITTED',
      'KYC_PROCESSING'
    );
  ELSE
    ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
    ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'INACTIVE';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM (
      'REQUESTED',
      'MATCHING',
      'PENDING_PROVIDER',
      'ACCEPTED',
      'ON_THE_WAY',
      'ARRIVED',
      'OTP_PENDING',
      'IN_PROGRESS',
      'AWAITING_PRICE_CONFIRMATION',
      'AWAITING_PAYMENT',
      'COMPLETED',
      'CANCELLED',
      'DISPUTED',
      'WARRANTY_ACTIVE',
      'WARRANTY_CLAIMED',
      'CLOSED',
      -- Backward compatibility aliases
      'SCHEDULED',
      'PROVIDER_ON_THE_WAY',
      'PAYMENT_PENDING',
      'PAID',
      'REJECTED'
    );
  ELSE
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'MATCHING';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'PENDING_PROVIDER';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'ON_THE_WAY';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'OTP_PENDING';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'AWAITING_PRICE_CONFIRMATION';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'WARRANTY_ACTIVE';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'WARRANTY_CLAIMED';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'CLOSED';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('UPI', 'CASH', 'RAZORPAY');
  END IF;
END $$;

-- ============================================================================
-- 1. CITIES & SERVICE AREAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL DEFAULT 'India',
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  radius_km NUMERIC(5, 2) NOT NULL DEFAULT 8.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. USERS & PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  email CITEXT,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_address_id UUID,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  emergency_phone VARCHAR(20),
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'te',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(50) NOT NULL DEFAULT 'Home',
  street TEXT NOT NULL,
  area_name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Chilakaluripet',
  state VARCHAR(100) NOT NULL DEFAULT 'Andhra Pradesh',
  pincode VARCHAR(10) NOT NULL DEFAULT '522616',
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. PROVIDER PROFILES & VERIFICATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(150) NOT NULL,
  bio TEXT,
  primary_category VARCHAR(100) NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  subcategories JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience_years INTEGER NOT NULL DEFAULT 1,
  service_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
  location_area VARCHAR(150) NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'PENDING',
  aadhaar_verified BOOLEAN NOT NULL DEFAULT false,
  aadhaar_verified_at TIMESTAMPTZ,
  aadhaar_hash VARCHAR(128),
  place_verified BOOLEAN NOT NULL DEFAULT true,
  place_verified_at TIMESTAMPTZ,
  workshop_gps_verified BOOLEAN NOT NULL DEFAULT true,
  circumvention_risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  circumvention_strikes INTEGER NOT NULL DEFAULT 0,
  verification_documents JSONB NOT NULL DEFAULT '{}'::jsonb,
  working_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  visiting_charge NUMERIC(10, 2) NOT NULL DEFAULT 199.00,
  hourly_rate NUMERIC(10, 2),
  fixed_rates JSONB NOT NULL DEFAULT '{}'::jsonb,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  cancellation_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  response_rate NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
  avg_response_minutes INTEGER NOT NULL DEFAULT 15,
  portfolio_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. SERVICE REQUESTS & INTENT PARSING
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  parsed_data JSONB NOT NULL,
  city VARCHAR(100) NOT NULL,
  area VARCHAR(150) NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. BOOKINGS & 16-STATE ENGINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(50) NOT NULL,
  status booking_status NOT NULL DEFAULT 'REQUESTED',
  customer_address JSONB NOT NULL,
  estimated_amount NUMERIC(10, 2) NOT NULL,
  final_amount NUMERIC(10, 2),
  visiting_charges NUMERIC(10, 2) NOT NULL,
  platform_commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  platform_commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  provider_payout_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  start_otp VARCHAR(6),
  otp_verified_at TIMESTAMPTZ,
  start_otp_attempts INTEGER NOT NULL DEFAULT 0,
  cancellation_reason TEXT,
  cancellation_flagged_collusion BOOLEAN NOT NULL DEFAULT false,
  price_matched_amount NUMERIC(10, 2),
  additional_charges_requested NUMERIC(10, 2),
  additional_charges_reason TEXT,
  additional_charges_approved BOOLEAN NOT NULL DEFAULT false,
  additional_charges_approved_at TIMESTAMPTZ,
  cash_payment_reported_amount NUMERIC(10, 2),
  cash_payment_status VARCHAR(50) NOT NULL DEFAULT 'NONE',
  cash_payment_confirmed_at TIMESTAMPTZ,
  cash_payment_reported_by UUID REFERENCES users(id),
  warranty_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status booking_status NOT NULL,
  note TEXT,
  updated_by_role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. WARRANTIES & REWORK GUARANTEE (7-Day Doorstep Guarantee)
-- ============================================================================
CREATE TABLE IF NOT EXISTS warranties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  service_category VARCHAR(100) NOT NULL,
  warranty_start TIMESTAMPTZ NOT NULL,
  warranty_end TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  claim_reason TEXT,
  claimed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. DISPUTES & MEDIATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES users(id),
  raised_by_role user_role NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  resolution_notes TEXT,
  refund_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. PAYMENTS & COMMISSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  amount NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL,
  provider_share NUMERIC(10, 2) NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'UPI',
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  transaction_ref VARCHAR(100),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. REVIEWS & AUDIT
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id),
  customer_name VARCHAR(150) NOT NULL,
  provider_id UUID NOT NULL REFERENCES providers(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quality_rating INTEGER NOT NULL DEFAULT 5,
  professionalism_rating INTEGER NOT NULL DEFAULT 5,
  value_rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID,
  actor_role user_role NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_entity VARCHAR(100) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
  commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  matching_weights JSONB NOT NULL,
  default_search_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  support_phone VARCHAR(20) NOT NULL DEFAULT '+91 8647 254999',
  support_email VARCHAR(100) NOT NULL DEFAULT 'support@sevanta.in',
  upi_vpa VARCHAR(100) NOT NULL DEFAULT 'sevanta.payments@okhdfcbank',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. LIVE DELIVERY TRACKING & OTP
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(100) UNIQUE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ORDER_CONFIRMED',
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer JSONB NOT NULL,
  pickup JSONB NOT NULL,
  partner JSONB NOT NULL,
  metrics JSONB NOT NULL,
  route_geometry JSONB NOT NULL DEFAULT '[]'::jsonb,
  tracking_active BOOLEAN NOT NULL DEFAULT true,
  traffic_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  phone VARCHAR(20) PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  expires_at BIGINT NOT NULL
);

-- ============================================================================
-- 11. INDEXES FOR HIGH-EFFICIENCY LOOKUPS & CONCURRENCY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(primary_category);
CREATE INDEX IF NOT EXISTS idx_providers_verification ON providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_providers_geo ON providers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_warranties_booking ON warranties(booking_id);
CREATE INDEX IF NOT EXISTS idx_warranties_customer ON warranties(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_city ON service_areas(city_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "Public read verified providers" ON providers;
CREATE POLICY "Public read verified providers" ON providers
  FOR SELECT USING (verification_status = 'VERIFIED');

DROP POLICY IF EXISTS "Users read own bookings" ON bookings;
CREATE POLICY "Users read own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() IN (SELECT user_id FROM providers WHERE id = bookings.provider_id)
  );

DROP POLICY IF EXISTS "Users read own warranties" ON warranties;
CREATE POLICY "Users read own warranties" ON warranties
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() IN (SELECT user_id FROM providers WHERE id = warranties.provider_id)
  );

DROP POLICY IF EXISTS "Users read own disputes" ON disputes;
CREATE POLICY "Users read own disputes" ON disputes
  FOR SELECT USING (
    auth.uid() = raised_by OR
    auth.uid() IN (SELECT customer_id FROM bookings WHERE id = disputes.booking_id) OR
    auth.uid() IN (SELECT p.user_id FROM providers p JOIN bookings b ON b.provider_id = p.id WHERE b.id = disputes.booking_id)
  );
