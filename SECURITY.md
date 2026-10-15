# PhiksNiyar (ఫిక్స్ నియర్) — Security Policy & Security Controls

## 1. Overview
Security and data privacy are core operational pillars of PhiksNiyar. Because PhiksNiyar operates as a transactional platform handling financial interactions, physical home arrivals, and personal contact details, the system operates on the **Zero Client Trust Principle**: all client inputs, state transitions, pricing, and authorization checks are verified server-side.

---

## 2. Core Security Controls

### 2.1 BOLA / IDOR Protection
- Every API endpoint inspects the authenticated session (`getAuthSession()`).
- Direct object references (`bookingId`, `userId`, `providerId`, `warrantyId`, `disputeId`) require ownership verification:
  `session.userId === resource.customerId || provider.userId === session.userId || session.role === 'ADMIN'`.
- Verified in automated test suite via `SEC-01`, `SEC-03`, `SEC-11`, and `SEC-12`.

### 2.2 Doorstep Start-OTP Handshake
- Generated using `crypto.randomInt(1000, 10000)` on server only.
- Masked and stripped from all provider-facing API payloads.
- Rate-limited to a maximum of 3 failed verification attempts before locking.
- Permanently invalidated and deleted from database upon successful verification.

### 2.3 Residential Address Privacy (DPDP Act 2023)
- Prior to technician assignment and acceptance, exact street addresses are masked to `"Revealed upon acceptance"`.
- Locality / neighborhood and approximate distance alone are shared during discovery and matching.

### 2.4 Cryptographic National Identity Handling
- Zero raw Aadhaar or national identity numbers stored in plaintext.
- Identity numbers are stored only as salted SHA-256 hashes with masked references (`XXXX-XXXX-1234`).
- Verhoeff check is explicitly enforced as syntactic formatting validation only; official verified badges require administrator verification.

### 2.5 Server-Authoritative Pricing & Payment
- Base rates, visiting charges, and platform commission calculations are owned entirely by the server.
- Additional charges require explicit customer confirmation (`AWAITING_PRICE_CONFIRMATION` -> `IN_PROGRESS`).
- Razorpay payments verified using HMAC-SHA256 signature calculation over `order_id|payment_id`.
- Duplicate payment webhooks are processed idempotently.

### 2.6 Rate Limiting
- Sliding window and token bucket rate limits:
  - Phone OTP dispatch: 3 requests per 5 minutes per phone.
  - Public endpoints: 60 requests per minute per IP.
  - Failed OTP attempts: 3 strikes per booking.

---

## 3. Reporting Vulnerabilities
If you discover a security vulnerability in PhiksNiyar, please report it to `security@phiksniyar.in`.
Do not disclose vulnerabilities publicly until remediation has been deployed.
