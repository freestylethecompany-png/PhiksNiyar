# PHIKSNIYAR — SECURITY AUDIT REPORT (Phase 0)
**Product:** PhiksNiyar (ఫిక్స్ నియర్)  
**Location:** Chilakaluripet, Palnadu District, Andhra Pradesh, India  
**Date:** October 2026  
**Auditor:** Principal Security Engineer & Application Security Architect  
**Status:** Remediated & Hardened  

---

## 1. Executive Summary
This document records the exhaustive security audit of the PhiksNiyar marketplace application. All endpoints, authentication layers, role mechanisms, database interactions, encryption utilities, and access control policies have been audited against OWASP Top 10, API Security Top 10, and India's Digital Personal Data Protection (DPDP) Act 2023.

---

## 2. Security Vulnerability Register

### SEC-01: BOLA / IDOR in Booking Access
- **Issue:** Customer or provider accessing bookings belonging to another party by changing `bookingId`.
- **Severity:** CRITICAL
- **Affected File:** `src/app/api/bookings/route.ts`
- **Reason:** Client could manipulate request parameters or filters to query alien booking records.
- **Recommended Fix:** Implement server-side session ownership checks. Only allow access if `session.userId === booking.customerId`, or `provider.userId === session.userId`, or `session.role === 'ADMIN' | 'SUPPORT'`.
- **Implementation Status:** RESOLVED. Enforced in `GET` and `PATCH` endpoints.

### SEC-02: Exposure of Residential Customer Street Address
- **Issue:** Full doorstep address exposed publicly or to unassigned providers.
- **Severity:** HIGH (Privacy / DPDP Act)
- **Affected File:** `src/app/api/bookings/route.ts`, `src/lib/db/database.ts`
- **Reason:** Providers browsing available jobs or competitors querying bookings could see customer home addresses.
- **Recommended Fix:** Mask street address to "Revealed upon acceptance" for all providers until the booking is accepted or in transit. Strictly show neighborhood/locality only during discovery and matching.
- **Implementation Status:** RESOLVED. Address masking implemented in `GET /api/bookings`.

### SEC-03: Doorstep OTP Insecurity / Brute Force Bypass
- **Issue:** Provider or malicious client guessing or bypassing the 4-digit doorstep arrival verification OTP.
- **Severity:** CRITICAL
- **Affected File:** `src/app/api/bookings/route.ts`, `src/lib/security/cryptoUtils.ts`
- **Reason:** Frontend-only validation or unmetered server verification allows brute-forcing 10,000 combinations.
- **Recommended Fix:** 
  1. Generate OTP using `crypto.randomInt(1000, 10000)` on server only.
  2. Strip OTP from provider payloads (only customer sees it).
  3. Enforce maximum 3 failed attempts per booking before locking.
  4. Invalidate and delete OTP from database immediately upon successful work start transition.
- **Implementation Status:** RESOLVED. Cryptographically generated, stripped from provider views, 3-strike lockout, and one-time invalidation.

### SEC-04: Client-Controlled Role & Admin Privilege Escalation
- **Issue:** Client passing `role: 'ADMIN'` in registration or altering cookies to gain unauthorized administrative privileges.
- **Severity:** CRITICAL
- **Affected File:** `src/app/api/auth/verify-otp/route.ts`, `src/lib/auth/session.ts`, `src/app/api/admin/route.ts`
- **Reason:** Reliance on client-supplied role values without server-verified authorization.
- **Recommended Fix:** 
  1. Enforce default role `CUSTOMER` on registration.
  2. Protect admin routes using server-side session token verification and explicit DB role query.
  3. Sign JWTs with secure server-only `JWT_SECRET`.
- **Implementation Status:** RESOLVED. Session tokens cryptographically signed; administrative endpoints reject non-admin sessions with 403.

### SEC-05: Client-Side Price Manipulation & Tampering
- **Issue:** Client sending arbitrary `price` or `amount` in booking creation or payment verification payloads.
- **Severity:** HIGH (Financial Fraud)
- **Affected File:** `src/app/api/bookings/route.ts`, `src/app/api/payments/razorpay/verify/route.ts`
- **Reason:** Frontend calculated prices can be intercepted and tampered using proxy tools (e.g. Burp Suite).
- **Recommended Fix:** Server must calculate all prices from provider pricing models and platform commission settings. Price adjustments or price matching must enforce server-defined bounds and require explicit customer authorization.
- **Implementation Status:** RESOLVED. Server calculates visiting charges, platform commission, and provider payout. Price matching validated with strict minimum and maximum bounds.

### SEC-06: Payment Signature & Webhook Idempotency Bypass
- **Issue:** Malicious user spoofing Razorpay payment verification or replaying webhook events.
- **Severity:** CRITICAL (Financial Fraud)
- **Affected File:** `src/app/api/payments/razorpay/verify/route.ts`
- **Reason:** Trusting frontend payment callback without cryptographic HMAC-SHA256 signature verification.
- **Recommended Fix:** Verify `razorpay_signature` against `crypto.createHmac('sha256', secret)`. Ensure payment verification is idempotent; repeated verifications return existing status without duplicate payout entries.
- **Implementation Status:** RESOLVED. Cryptographic signature check enforced; idempotent state handling active.

### SEC-07: Provider Self-Verification Bypass
- **Issue:** Provider flipping their own status to `VERIFIED` via API or onboarding payload.
- **Severity:** HIGH
- **Affected File:** `src/lib/db/stateMachine.ts`, `src/app/api/providers/onboard/route.ts`
- **Reason:** Client-controlled verification flag.
- **Recommended Fix:** Restrict `VERIFIED` transition exclusively to `ADMIN` role. Onboarding initializes provider strictly to `PENDING` or `UNDER_REVIEW`.
- **Implementation Status:** RESOLVED. State machine transition guard prevents provider role from reaching `VERIFIED`.

### SEC-08: Fake Aadhaar / Government Verification Claims
- **Issue:** Claiming government identity verification or running fake checksum algorithms and claiming "100% government verified".
- **Severity:** MEDIUM (Legal / Regulatory DPDP)
- **Affected File:** `src/lib/security/aadhaarVerifier.ts`, `src/lib/security/cryptoUtils.ts`
- **Reason:** Misleading marketing claims and insecure handling of national identity identifiers.
- **Recommended Fix:** 
  1. Never store raw identity numbers; store cryptographic salted SHA-256 hashes and masked references (`XXXX-XXXX-1234`).
  2. Explicitly label Verhoeff check as syntactic pre-flight validation only.
  3. Require authorized KYC review or physical verification for official verified badge.
- **Implementation Status:** RESOLVED. Plaintext identity storage eradicated; salted hashing and masking active.

### SEC-09: SMS OTP Flooding & Resource Exhaustion
- **Issue:** Attacker spamming `/api/auth/send-otp` to exhaust SMS gateway credits or harass phone numbers.
- **Severity:** HIGH
- **Affected File:** `src/app/api/auth/send-otp/route.ts`, `src/lib/security/rateLimiter.ts`
- **Reason:** Missing or unkeyed rate limiting on public authentication endpoint.
- **Recommended Fix:** Implement token-bucket rate limiter per phone number (max 3 sends per 5 minutes) and per IP address (max 10 requests per minute).
- **Implementation Status:** RESOLVED. In-memory and sliding window rate limiter active.

### SEC-10: Exposure of Secrets & Service Keys to Browser
- **Issue:** Leaking `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, or `JWT_SECRET` in client bundles.
- **Severity:** CRITICAL
- **Affected File:** Environment configurations, Next.js client bundles
- **Reason:** Using `NEXT_PUBLIC_` prefix on server secrets or committing secrets to git.
- **Recommended Fix:** Remove all sensitive credentials from client bundles. Only expose safe public variables (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`).
- **Implementation Status:** RESOLVED. Zero server secrets exposed in client bundles or public repositories.

---

## 3. Security Verification Checklist
- [x] Session tokens use `HttpOnly`, `SameSite=Lax`, and `Secure` (in production).
- [x] All 20 automated security test cases passing (`scripts/security-audit-suite.js`).
- [x] Zero raw Aadhaar / national ID numbers stored in plaintext.
- [x] Zero client-controlled price or payment statuses.
- [x] Idempotent payment webhook and verification processing.
- [x] Doorstep OTP restricted to 3 attempts with automatic one-time deletion.
