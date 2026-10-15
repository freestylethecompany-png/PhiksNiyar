# SEVANTA — Changelog & Release Notes

All notable changes to the Sevanta platform are documented in this file.

---

## [1.0.0] - 2026-10-08

### 🚀 Production Milestone Release: Sevanta (సేవంత)
**Tagline:** Local help. Right when you need it. (లోకల్ సాయం. మీకు అవసరమైనప్పుడే.)  
**Initial Launch Market:** Chilakaluripet, Palnadu District, Andhra Pradesh, India.

---

### 🎨 Brand & Design System
- **Canonical Brand Identity:** Transformed application branding to **Sevanta (సేవంత)**.
- **Color Palette Tokens:** Standardized canonical Indian palette:
  - Deep Indigo (`#182B49`): Primary authority & trust.
  - Emerald Green (`#0F9D72`): Secondary action, verification & success.
  - Saffron Accent (`#F59E0B`): Highlights & badges.
  - Neutral Dark (`#111827`), Background (`#F8FAFC`), Surface (`#FFFFFF`).
- **Canonical Logo Component:** Created `src/components/common/SevantaLogo.tsx` supporting 9 variants (`full`, `icon`, `monochrome`, `dark`, `light`, `favicon`, `appIcon`, `badge`, `loading`).
- **Bilingual Typography:** Integrated Google Font `Noto Sans Telugu` with strict unicode normalization to eliminate broken glyphs and stacked consonants across both English and Telugu.
- **Truth in Advertising:** Eliminated all hardcoded fake marketing claims ("32+ verified pros", "100% government verified"). Replaced with dynamic live database counts and honest onboarding messaging ("Local Service Professionals are joining Sevanta in Chilakaluripet").

---

### 🛡️ Security & Application Hardening
- **BOLA & IDOR Prevention:** Enforced strict three-tier authorization checks across all API routes (`/api/bookings`, `/api/warranty`, `/api/disputes`, `/api/payments`). Users cannot read or manipulate alien resources.
- **Address Privacy (DPDP Act 2023):** Implemented selective field projection in `GET /api/bookings`. Customer residential street address is stripped from providers during matching; only coarse locality is visible until the booking is accepted.
- **Doorstep Cryptographic OTP:** Implemented 4-digit arrival OTP generated server-side. The OTP is rate-limited to 3 failed attempts, stripped from provider payloads, and deleted immediately once work begins.
- **Identity Data Protection:** Eradicated fake Aadhaar verification claims. Sensitive national identifiers are protected with salted SHA-256 hashes (`sha256(aadhaar + salt)`). Zero plaintext numbers are stored or logged.
- **Session & Role Integrity:** Removed client-controlled roles and `localStorage` auth. Enforced cryptographically signed HTTP-only JWT cookies with server-side role validation on every protected route.
- **Anti-Brute-Force Rate Limiting:** Applied sliding-window rate limiters to authentication, OTP generation, payment verifications, and booking submissions.
- **Production Security Headers:** Configured Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options, Referrer-Policy, and frame restrictions in `next.config.mjs` and middleware.

---

### ⚙️ State Machines & Backend Architecture
- **16-State Transaction Lifecycle:** Implemented server-authoritative state machine:
  `REQUESTED` ➔ `MATCHING` ➔ `PENDING_PROVIDER` ➔ `ACCEPTED` ➔ `ON_THE_WAY` ➔ `ARRIVED` ➔ `OTP_PENDING` ➔ `IN_PROGRESS` ➔ `AWAITING_PRICE_CONFIRMATION` ➔ `AWAITING_PAYMENT` ➔ `COMPLETED` ➔ `CANCELLED` ➔ `DISPUTED` ➔ `WARRANTY_ACTIVE` ➔ `WARRANTY_CLAIMED` ➔ `CLOSED`.
- **6-State Provider Verification Pipeline:** Structured provider vetting:
  `PENDING` ➔ `UNDER_REVIEW` ➔ `VERIFIED` ➔ `REJECTED` ➔ `SUSPENDED` ➔ `INACTIVE`. Only `VERIFIED` providers can accept production bookings.
- **Transparent Pricing & Customer Consent:** Enforced server-derived base prices and visiting charges. Technicians can propose extra parts charges (`AWAITING_PRICE_CONFIRMATION`), but the final price is only committed upon explicit customer in-app approval (`approveAdditionalCharges`).
- **Dual-Confirmation Cash Workflow:** Created safe Cash-on-Delivery audit trail: Technician declares collection (`CASH_REPORTED`), and booking settles only after Customer or Admin confirms receipt (`CASH_CONFIRMED`).
- **Automatic 7-Day Warranty Engine:** Implemented automatic 7-day post-completion rework protection. Server validates that claims are submitted within 168 hours of completion before assigning rework status.
- **7-Category Disputes System:** Built dispute filing and mediation workflow with administrative oversight and resolution tracking.
- **Dual Database Support:** Dual-engine architecture supporting high-performance SQLite 3 in WAL mode (Docker/single-node) and PostgreSQL 16+ (`schema.sql`) for scalable cloud deployments.
- **Health Liveness Probe:** Added `/api/health` diagnostic endpoint reporting system uptime, database connectivity, and product version with zero credential leakage.

---

### 🧪 Quality Assurance & Test Verification
- **Automated Security Suite:** Created `scripts/security-audit-suite.js` covering 27 test cases:
  - 27 out of 27 security and lifecycle tests passing (100% pass rate).
- **Compilation & Build:** Validated Next.js 16.3.8 Turbopack build (`npm run build`) with zero TypeScript errors across all 24 static and dynamic routes.
