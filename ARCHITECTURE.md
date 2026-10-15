# PHIKSNIYAR — System Architecture Specification
**Version:** 1.0.0  
**Product:** PhiksNiyar (ఫిక్స్ నియర్)  
**Tagline:** Local help. Right when you need it. (లోకల్ సాయం. మీకు అవసరమైనప్పుడే.)  
**Initial Market:** Chilakaluripet, Palnadu District, Andhra Pradesh, India (PIN: 522616)

---

## 1. Executive Architecture Overview

PhiksNiyar is designed as a **server-authoritative, transaction-focused hyperlocal services platform**. Unlike legacy discovery directories that merely broker contact details, PhiksNiyar governs every stage of the service lifecycle—from AI-assisted intent interpretation to doorstep cryptographic verification, customer-approved extra charges, dual-verified cash settlements, automatic 7-day warranty registration, and administrative dispute resolution.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  - Next.js 16 App Router (React 19)                                                  |
|  - Bilingual UI: English + Telugu (Noto Sans Telugu font stack)                      |
|  - Canonical PhiksNiyar Design System (#182B49 Deep Indigo, #0F9D72 Emerald, #F59E0B) |
|  - Role-aware Interfaces: Customer, Provider, Admin, Support                          |
+-------------------------------------------+-------------------------------------------+
                                            | HTTPS / Secure HTTP-Only Cookies
+-------------------------------------------v-------------------------------------------+
|                                 EDGE & ROUTING LAYER                                  |
|  - Next.js Edge Middleware                                                            |
|  - Security Headers (CSP, HSTS, X-Content-Type-Options, Frame-Ancestors)               |
|  - Sliding-Window In-Memory Rate Limiting (IP, Phone, User bounds)                   |
|  - Request Sanitization & Content-Length Enforcement                                 |
+-------------------------------------------+-------------------------------------------+
                                            |
+-------------------------------------------v-------------------------------------------+
|                                  APPLICATION SERVICES                                 |
|                                                                                       |
|  +--------------------+  +----------------------+  +-------------------------------+  |
|  | Auth & Session     |  | Booking Engine       |  | Provider Lifecycle            |  |
|  | - JWT (HS256)      |  | - 16-State Machine   |  | - 6-State Verification        |  |
|  | - Role Verification|  | - Doorstep OTP (4-D) |  | - Locality Geofencing         |  |
|  | - BOLA Enforcement |  | - Address Masking    |  | - Shift & Availability State  |  |
|  +--------------------+  +----------------------+  +-------------------------------+  |
|                                                                                       |
|  +--------------------+  +----------------------+  +-------------------------------+  |
|  | Financial Engine   |  | AI Matching Engine   |  | Post-Service Protection       |  |
|  | - Base & Parts Snap|  | - Telugu/English NLP |  | - 7-Day Free Rework Warranty  |  |
|  | - Razorpay HMAC    |  | - 10-Factor Ranking  |  | - 7-Category Dispute Claims   |  |
|  | - Cash Dual Confirm|  | - Zero DB Exposure   |  | - Immutable Audit Logging     |  |
|  +--------------------+  +----------------------+  +-------------------------------+  |
+-------------------------------------------+-------------------------------------------+
                                            |
+-------------------------------------------v-------------------------------------------+
|                                   DATA & STORAGE LAYER                                |
|                                                                                       |
|  [Primary Container/Edge]                     [Scalable Multi-Node Production]       |
|  SQLite 3 (WAL Mode, synchronous=NORMAL)     PostgreSQL 16+ (Supabase / Neon)        |
|  - Foreign Key Constraints                    - Row Level Security (RLS)              |
|  - In-Memory Indexing                         - ACID Transactions & Strict Constraints|
+---------------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

### 2.1 Server Authoritative State
No business decision or state transition is accepted from the client without strict server-side verification:
- **Prices:** Fixed base rates and visiting charges are derived from backend catalog rules. Additional parts quotes require explicit customer approval before becoming payable.
- **Roles:** The client never specifies authorization roles. Roles (`CUSTOMER`, `PROVIDER`, `ADMIN`, `SUPPORT`) are baked into signed JWT tokens and re-verified against database records.
- **Doorstep Verification:** Technicians cannot enter `IN_PROGRESS` status without supplying the customer's cryptographically random 4-digit OTP.

### 2.2 Radical Privacy & Data Protection (DPDP Act 2023)
- **Address Privacy:** Street addresses are masked from providers during discovery and search. Providers only receive the coarse locality (e.g., "Kalamandir Center, Chilakaluripet") until they accept the booking.
- **Identity Protection:** Government identity documents (Aadhaar/PAN) are never stored in plaintext. They are processed via KYC verification providers, and records store only cryptographic salted hashes (`sha256(aadhaar + salt)`).
- **Transient Live Tracking:** Provider geolocation coordinates are only tracked and broadcast via Server-Sent Events (SSE) while the booking is actively in `ON_THE_WAY` or `ARRIVED`.

### 2.3 Bilingual First-Class Architecture
PhiksNiyar provides equal parity for Telugu (తెలుగు) and English:
- **Typography:** Rendered using Google Font `Noto Sans Telugu` with unicode normalization, ensuring zero broken glyphs or stacked consonants.
- **AI Matching:** The NLP intent parser extracts intent seamlessly from pure Telugu (`"మా AC cooling సరిగ్గా లేదు"`), Tanglish (`"Maa fridge cooling ledu bro"`), and English (`"My washing machine is leaking"`).

---

## 3. Component Architecture & Interactions

### 3.1 Customer Booking & Service Lifecycle
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (వినియోగదారుడు)
    participant API as PhiksNiyar API
    participant AI as 10-Factor Matching
    actor Provider as Provider (ప్రొవైడర్)
    participant DB as PhiksNiyar Database

    Customer->>API: 1. POST /api/bookings (Category, Locality, Problem)
    API->>AI: 2. Parse intent & score verified providers
    AI->>API: 3. Rank by Distance, Rating, Availability
    API->>DB: 4. Create booking (State: REQUESTED -> MATCHING)
    API-->>Customer: 5. Booking created, waiting for acceptance
    API->>Provider: 6. Dispatch notification (Locality only, no house no.)
    Provider->>API: 7. PATCH /api/bookings (Action: accept)
    API->>DB: 8. State: ACCEPTED (Full address unlocked for technician)
    Provider->>API: 9. PATCH /api/bookings (Action: arrive)
    API->>DB: 10. State: ARRIVED (Generates 4-digit Doorstep OTP)
    API-->>Customer: 11. Customer receives OTP on screen/SMS
    Customer-->>Provider: 12. Verbally shares OTP at doorstep
    Provider->>API: 13. PATCH /api/bookings (Action: startOtp, otp="4912")
    API->>DB: 14. Validate OTP, State: IN_PROGRESS (OTP destroyed)
    Provider->>API: 15. PATCH /api/bookings (Action: proposeAdditionalCharges, ₹250)
    API->>DB: 16. State: AWAITING_PRICE_CONFIRMATION
    Customer->>API: 17. PATCH /api/bookings (Action: approveAdditionalCharges)
    API->>DB: 18. State: IN_PROGRESS (Total price updated)
    Provider->>API: 19. PATCH /api/bookings (Action: completeWork)
    API->>DB: 20. State: AWAITING_PAYMENT
    Customer->>API: 21. POST /api/payments/razorpay/verify (Signature verified)
    API->>DB: 22. State: COMPLETED, createWarranty(7 days)
    API-->>Customer: 23. Booking COMPLETED + 7-Day Warranty Active
```

---

## 4. Multi-Database Architecture

PhiksNiyar implements a decoupled dual-database architecture:
1. **Containerized SQLite 3 (Default Local / Docker Single Node):**
   - Configured with `PRAGMA journal_mode=WAL` for high concurrency.
   - `PRAGMA synchronous=NORMAL` and `PRAGMA foreign_keys=ON`.
   - Data stored in durable `/app/data/phiksniyar.db` volume.
2. **PostgreSQL 16+ (Supabase / Managed Cloud):**
   - Full migration parity maintained in `schema.sql`.
   - Native `UUID` primary keys, `TIMESTAMPTZ`, and PostgreSQL `CHECK` constraints.
   - Robust Row Level Security (RLS) isolating tenant rows.

---

## 5. Security Boundary & IDOR/BOLA Protection

Every protected API route implements a three-tier authorization gate:
1. **Authentication Gate:** Validates the cryptographic signature of the HTTP-only JWT cookie.
2. **Role Gate:** Verifies the user possesses the requisite role (`CUSTOMER`, `PROVIDER`, `ADMIN`).
3. **Resource Ownership Gate:**
   ```typescript
   // Server-Side BOLA / IDOR Verification
   const booking = db.getBookingById(bookingId);
   const isCustomerOwner = booking.customerId === session.user.id;
   const isAssignedProvider = booking.providerId === session.user.id;
   const isAdminOrSupport = session.user.role === 'ADMIN' || session.user.role === 'SUPPORT';

   if (!isCustomerOwner && !isAssignedProvider && !isAdminOrSupport) {
     return NextResponse.json(
       { error: { code: 'FORBIDDEN', message: 'Unauthorized resource access' } },
       { status: 403 }
     );
   }
   ```

---

## 6. Resilience & Health Monitoring

The platform provides a zero-secret liveness and database probe at `/api/health`:
- Returns `status: "healthy"` when the database responds to `SELECT 1`.
- Exposes uptime, timestamp, active environment, and version.
- Excludes database connection strings, credentials, or filesystem paths.
