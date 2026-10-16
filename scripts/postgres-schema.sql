-- ==============================================================================
-- PHIKSNIYAR PRODUCTION POSTGRESQL SCHEMA (Managed Database Migration)
-- Compatible with Supabase, AWS RDS PostgreSQL, Google Cloud SQL, Neon, Render
-- ==============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'PROVIDER', 'SUPPORT', 'ADMIN')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. CUSTOMER PROFILES
CREATE TABLE IF NOT EXISTS customer_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_address_id VARCHAR(64),
    total_bookings INTEGER NOT NULL DEFAULT 0,
    emergency_phone VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'te'
);

-- 3. ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(60) NOT NULL,
    street TEXT NOT NULL,
    area_name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL DEFAULT 'Chilakaluripet',
    state VARCHAR(80) NOT NULL DEFAULT 'Andhra Pradesh',
    pincode VARCHAR(10) NOT NULL DEFAULT '522616',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- 4. PROVIDERS
CREATE TABLE IF NOT EXISTS providers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(160) NOT NULL,
    bio TEXT,
    primary_category VARCHAR(80) NOT NULL,
    categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    subcategories JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience_years INTEGER NOT NULL DEFAULT 1,
    service_radius_km DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    location_area VARCHAR(120) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    verification_status VARCHAR(40) NOT NULL DEFAULT 'DOCUMENT_SUBMITTED',
    verification_documents JSONB NOT NULL DEFAULT '{}'::jsonb,
    working_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
    visiting_charge DOUBLE PRECISION NOT NULL DEFAULT 199.0,
    hourly_rate DOUBLE PRECISION,
    fixed_rates JSONB DEFAULT '{}'::jsonb,
    rating DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    completed_jobs INTEGER NOT NULL DEFAULT 0,
    cancellation_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    response_rate DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    avg_response_minutes INTEGER NOT NULL DEFAULT 15,
    portfolio_images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(primary_category);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_providers_location ON providers(latitude, longitude);

-- 5. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    service_request_id VARCHAR(64),
    customer_id VARCHAR(64) NOT NULL REFERENCES users(id),
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address JSONB NOT NULL,
    provider_id VARCHAR(64) NOT NULL REFERENCES providers(id),
    provider_name VARCHAR(160) NOT NULL,
    provider_phone VARCHAR(20) NOT NULL,
    category VARCHAR(80) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    scheduled_date VARCHAR(20) NOT NULL,
    scheduled_time VARCHAR(20) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'REQUESTED',
    status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    pricing JSONB NOT NULL,
    payment JSONB,
    dispute JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- 6. PAYMENT ORDERS
CREATE TABLE IF NOT EXISTS payment_orders (
    order_id VARCHAR(80) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    method VARCHAR(20) NOT NULL DEFAULT 'RAZORPAY',
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    payment_id VARCHAR(80),
    signature TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_booking_id ON payment_orders(booking_id);

-- 7. REVIEWS & RATINGS
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider_id VARCHAR(64) NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) NOT NULL REFERENCES users(id),
    customer_name VARCHAR(120) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);

-- 8. WARRANTIES (7-Day Free Rework)
CREATE TABLE IF NOT EXISTS warranties (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) NOT NULL REFERENCES users(id),
    provider_id VARCHAR(64) NOT NULL REFERENCES providers(id),
    warranty_start TIMESTAMPTZ NOT NULL,
    warranty_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    rework_requested BOOLEAN NOT NULL DEFAULT FALSE,
    claim_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. DISPUTES
CREATE TABLE IF NOT EXISTS disputes (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    raised_by VARCHAR(64) NOT NULL REFERENCES users(id),
    raised_by_role VARCHAR(20) NOT NULL,
    category VARCHAR(60) NOT NULL,
    description TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT,
    refund_amount DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. OTP CODES (Atomic Storage & Verification)
CREATE TABLE IF NOT EXISTS otp_codes (
    phone VARCHAR(20) PRIMARY KEY,
    code VARCHAR(12) NOT NULL,
    expires_at BIGINT NOT NULL
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(80) NOT NULL,
    target_entity VARCHAR(60) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
