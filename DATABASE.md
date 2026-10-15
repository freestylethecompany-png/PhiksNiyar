# PHIKSNIYAR — Database Architecture & Schema Specification
**Version:** 1.0.0  
**Initial Market:** Chilakaluripet, AP (PIN: 522616)  
**Dual Storage Engine:** SQLite 3 (WAL Mode, Containerized/Single Node) & PostgreSQL 16+ (Supabase / Cloud Mirror in `schema.sql`)

---

## 1. Storage Architecture Overview

PhiksNiyar uses an identical schema model across both supported environments:
- **Development & Single-Node Docker:** SQLite 3 with `journal_mode=WAL` (Write-Ahead Logging), `synchronous=NORMAL`, and foreign key enforcement enabled on every connection.
- **Serverless & Distributed Production:** PostgreSQL 16+ on Supabase or Neon with full Row-Level Security (RLS), ACID transaction isolation, and cryptographic hashing extensions.

---

## 2. Table Specifications

### 2.1 `users`
Stores customer, provider, support, and administrative user profiles.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT / UUID | PRIMARY KEY | Unique user identifier (`usr_...`) |
| `phone` | TEXT | UNIQUE, NOT NULL | 10-digit Indian mobile number |
| `name` | TEXT | NOT NULL | Full user name |
| `role` | TEXT | NOT NULL, CHECK (role IN ('CUSTOMER', 'PROVIDER', 'ADMIN', 'SUPPORT')) | Server-controlled role |
| `avatar_url` | TEXT | NULLABLE | Profile avatar image link |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last record modification timestamp |

---

### 2.2 `providers`
Contains professional profiles, service offerings, geofencing, and verification state.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT / UUID | PRIMARY KEY, REFERENCES users(id) | Provider user ID |
| `name` | TEXT | NOT NULL | Trade or individual name |
| `phone` | TEXT | NOT NULL | Contact phone |
| `categories` | JSON / TEXT | NOT NULL | Array of service categories (e.g. `["ac_repair", "electrician"]`) |
| `lat` | REAL | NOT NULL | Home / Base latitude coordinate |
| `lng` | REAL | NOT NULL | Home / Base longitude coordinate |
| `locality` | TEXT | NOT NULL | Locality name in Chilakaluripet |
| `experience_years`| INTEGER | NOT NULL, DEFAULT 1 | Years of field experience |
| `rating` | REAL | NOT NULL, DEFAULT 5.0 | Bayesian average rating |
| `review_count` | INTEGER | NOT NULL, DEFAULT 0 | Count of verified reviews |
| `completed_jobs`| INTEGER | NOT NULL, DEFAULT 0 | Count of completed service jobs |
| `is_available` | BOOLEAN | NOT NULL, DEFAULT TRUE | Real-time shift/availability toggle |
| `verification_status` | TEXT | NOT NULL, CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'INACTIVE')) | 6-state verification pipeline |
| `aadhaar_hash` | TEXT | NULLABLE | Salted SHA-256 hash of Aadhaar (Zero plaintext) |

---

### 2.3 `bookings`
Governs the core 16-state transaction lifecycle.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT / UUID | PRIMARY KEY | Unique booking identifier (`ord_...`) |
| `customer_id` | TEXT | NOT NULL, REFERENCES users(id) | Customer reference |
| `provider_id` | TEXT | NULLABLE, REFERENCES providers(id) | Assigned technician reference |
| `service_category`| TEXT | NOT NULL | Category code (`ac_repair`, `plumber`, etc.) |
| `service_name` | TEXT | NOT NULL | Title of service |
| `status` | TEXT | NOT NULL | 16-state machine value (`REQUESTED`, `MATCHING`, ..., `CLOSED`) |
| `customer_address`| TEXT | NOT NULL | Full residential address (Masked to provider until accepted) |
| `customer_locality`| TEXT| NOT NULL | Coarse locality (Publicly visible to matched providers) |
| `customer_lat` | REAL | NOT NULL | Latitude |
| `customer_lng` | REAL | NOT NULL | Longitude |
| `problem_description`| TEXT| NOT NULL | Customer problem notes |
| `scheduled_date` | TEXT | NOT NULL | Service date |
| `scheduled_time_slot`| TEXT| NOT NULL | Service time window |
| `base_price` | REAL | NOT NULL, CHECK (base_price >= 0) | Starting catalog service rate |
| `visiting_charges`| REAL | NOT NULL, DEFAULT 99 | Standard doorstep inspection charge |
| `additional_charges`| REAL| NOT NULL, DEFAULT 0 | Parts/labor quoted by provider |
| `additional_charges_reason`| TEXT| NULLABLE | Justification for additional charges |
| `additional_charges_approved`| BOOLEAN| NOT NULL, DEFAULT FALSE | Explicit customer approval flag |
| `final_price` | REAL | NOT NULL | Total payable (`base_price + visiting_charges + additional_charges`) |
| `payment_status` | TEXT | NOT NULL, CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CASH_REPORTED', 'CASH_CONFIRMED')) | Settlement state |
| `payment_method` | TEXT | NOT NULL, CHECK (method IN ('UPI', 'CARD', 'CASH')) | Payment method |
| `start_otp` | TEXT | NULLABLE | 4-digit doorstep arrival OTP (Destroyed on job start) |
| `otp_attempts` | INTEGER | NOT NULL, DEFAULT 0 | Rate limiter counter (Locks after 3 failed attempts) |
| `warranty_id` | TEXT | NULLABLE | Reference to registered warranty |

---

### 2.4 `warranties`
Tracks automatic 7-day post-completion rework protection.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT / UUID | PRIMARY KEY | Warranty record identifier (`war_...`) |
| `booking_id` | TEXT | NOT NULL, REFERENCES bookings(id) | Related service booking |
| `customer_id` | TEXT | NOT NULL, REFERENCES users(id) | Customer owner |
| `provider_id` | TEXT | NOT NULL, REFERENCES providers(id) | Original technician |
| `service_category`| TEXT | NOT NULL | Service category |
| `start_date` | TIMESTAMPTZ | NOT NULL | Timestamp booking marked COMPLETED |
| `valid_until` | TIMESTAMPTZ | NOT NULL | Exactly 7 days after start_date |
| `status` | TEXT | NOT NULL, CHECK (status IN ('ACTIVE', 'CLAIMED', 'EXPIRED', 'RESOLVED')) | Warranty status |
| `claim_reason` | TEXT | NULLABLE | Defect or rework description |
| `claimed_at` | TIMESTAMPTZ | NULLABLE | Timestamp claim was submitted |

---

### 2.5 `disputes`
Manages formal customer and technician dispute mediation.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT / UUID | PRIMARY KEY | Dispute record identifier (`dsp_...`) |
| `booking_id` | TEXT | NOT NULL, REFERENCES bookings(id) | Disputed booking |
| `raised_by_id` | TEXT | NOT NULL, REFERENCES users(id) | User initiating dispute |
| `category` | TEXT | NOT NULL, CHECK (category IN ('poor_service', 'wrong_price', 'provider_no_show', 'damage', 'payment_issue', 'warranty_issue', 'safety_issue')) | Dispute reason |
| `description` | TEXT | NOT NULL | Detailed statement |
| `status` | TEXT | NOT NULL, CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED')) | Resolution state |
| `resolution_notes`| TEXT| NULLABLE | Administrative mediation notes |
| `resolved_by` | TEXT | NULLABLE, REFERENCES users(id) | Admin/Support staff ID |

---

### 2.6 `audit_logs`
Immutable audit trail recording critical operational and security actions.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT / UUID | PRIMARY KEY | Log identifier (`aud_...`) |
| `actor_id` | TEXT | NOT NULL | User performing action |
| `actor_role` | TEXT | NOT NULL | Role of actor at execution time |
| `action` | TEXT | NOT NULL | Action code (`PROVIDER_VERIFIED`, `PRICE_APPROVED`, etc.) |
| `resource_id` | TEXT | NOT NULL | ID of target entity (booking, user, payment) |
| `metadata` | JSON / TEXT | NULLABLE | Contextual details (Sanitized, zero secrets) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp |

---

## 3. Database Constraints & Indexes

```sql
-- Indexes for sub-millisecond query performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_providers_verification_status ON providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_providers_is_available ON providers(is_available);
CREATE INDEX IF NOT EXISTS idx_warranties_booking_id ON warranties(booking_id);
CREATE INDEX IF NOT EXISTS idx_warranties_valid_until ON warranties(valid_until);
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
```

---

## 4. Row-Level Security (RLS) Policy Matrix (PostgreSQL)

When operating with PostgreSQL on Supabase, RLS is enabled on all tables:
1. `bookings`:
   - `SELECT`: `auth.uid() = customer_id OR auth.uid() = provider_id OR auth.jwt()->>'role' IN ('ADMIN', 'SUPPORT')`
   - `INSERT`: `auth.uid() = customer_id`
   - `UPDATE`: Controlled via security definer RPC functions or strictly matched user IDs.
2. `warranties`:
   - `SELECT`: `auth.uid() = customer_id OR auth.uid() = provider_id OR auth.jwt()->>'role' IN ('ADMIN', 'SUPPORT')`
   - `UPDATE`: `auth.uid() = customer_id` (only when `status = 'ACTIVE'`)
3. `disputes`:
   - `SELECT`: `auth.uid() = raised_by_id OR auth.jwt()->>'role' IN ('ADMIN', 'SUPPORT')`

---

## 5. Backup & Recovery Strategy

- **SQLite Backups:** Hourly snapshot created using SQLite online backup API: `sqlite3 /app/data/phiksniyar.db ".backup /app/data/backup_$(date +%Y%m%d_%H).db"`
- **PostgreSQL Backups:** Managed daily WAL archiving with Point-In-Time Recovery (PITR) up to 7 days.
