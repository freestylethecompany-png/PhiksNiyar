# PhiksNiyar (ఫిక్స్ నియర్) — 48-Hour Launch Status

**Platform:** PhiksNiyar Marketplace (`com.phiksniyar.app`)  
**Tagline:** Skilled People • Real Solutions  
**Initial Market:** Chilakaluripet, Palnadu District, Andhra Pradesh, India  
**Canonical Domain:** `https://phiksniyar.in`  
**Git Branch:** `launch/48-hour-mvp`  
**Evaluation Timestamp:** October 17, 2026  

---

## 1. Confirmed Working Features (Verified via Code & Automated Tests)

1. **Customer Marketplace Experience:**
   - Hyperlocal service browsing across Chilakaluripet areas (Kalamandir Center, Pandaripuram, NH-16 Bypass, Guntur Road, Subhash Nagar, Clock Tower).
   - Core trade categories active: Electrician, Plumber, AC Repair, Appliance Technician, Carpenter.
   - Upfront transparent visiting fee calculation with zero hidden booking charges.
   - Secure OTP-based authentication with token-bucket rate limiting (5 attempts/15 minutes).
   - Booking creation with collision-resistant cryptographically secure identifiers (`generateSecureId`).

2. **Provider Partner Operations:**
   - Provider profile registration, onboarding, and trade selection.
   - Verification workflow ensuring unverified providers cannot accept live jobs.
   - Booking alert management: Accept, Decline, and step-by-step transit progression (`REQUESTED` → `ACCEPTED` → `ON_THE_WAY` → `ARRIVED` → `IN_PROGRESS`).
   - Doorstep 4-digit Start-OTP validation: Provider cannot begin work without customer physical verification.
   - Quote revision / price confirmation: Extra material or labor charges require explicit customer approval.

3. **Booking Lifecycle & Warranty Protection:**
   - Server-authoritative state machine with ownership and role enforcement.
   - Automatic 7-Day Free Warranty generation upon job completion.
   - Review and rating submission upon job delivery.

4. **Payment Integrity:**
   - Verified server-side Razorpay signature verification and idempotent webhook handling.
   - Confirmed Cash-on-Service flow: distinguishes reported cash from customer-confirmed receipt.
   - Platform commission calculation (default 10%) with transparent technician payouts.

5. **Security & Data Privacy (DPDP Act 2023 & Google Play):**
   - Publicly exposed Android release key `android/phiksniyar-release-key.jks` removed from repository tracking; untracked configuration (`key.properties`) established.
   - Zero hardcoded passwords in `android/app/build.gradle`.
   - Broken Object-Level Authorization (BOLA/IDOR) eliminated on booking APIs.
   - Customer phone and street address masked until booking is accepted.
   - Complete in-app and web account deletion endpoint (`/api/auth/delete-account`) with automated PII scrubbing.

---

## 2. Test Execution & Quality Gate Results

All test suites and build scripts have been executed and verified in this environment:

| Suite / Check | Command Executed | Result | Summary / Metrics |
| :--- | :--- | :--- | :--- |
| **Security Audit Suite** | `npm run test:security` | **PASS** | **39 / 39 passed** (BOLA, OTP lockout, address masking, token hygiene, injection prevention). |
| **Marketplace Smoke Test** | `npm run test:smoke` | **PASS** | **10 / 10 passed** (Full discovery → booking → OTP → quote → cash → warranty lifecycle). |
| **TypeScript Validation** | `npm run typecheck` | **PASS** | Zero type errors across Next.js and backend services. |
| **Turbopack Web Build** | `npm run build` | **PASS** | 28 / 28 routes compiled (22 dynamic server API routes, 6 static pages). |
| **Atomic Database Backup** | `npm run db:backup` | **PASS** | Snapshot `.db` + structured `.json` table dump created with verified row counts. |
| **Android Debug APK** | `./gradlew.bat assembleDebug` | **PASS** | Output: `android/app/build/outputs/apk/debug/app-debug.apk` (**10.43 MB**). |
| **Android Release AAB** | `./gradlew.bat bundleRelease` | **PASS** | Output: `android/app/build/outputs/bundle/release/app-release.aab` (**8.83 MB**). |

---

## 3. Critical Defects & Remediations Performed

1. **Compromised Keystore Exposure (P0 - Resolved in Repo):**
   - *Status:* `android/phiksniyar-release-key.jks` deleted from Git index. `.gitignore` updated to ignore `*.jks`, `*.keystore`, `*.aab`, `*.apk`, and `key.properties`.
   - *Remediation Required:* If this keystore was ever used on Google Play Console with Google Play App Signing disabled, a developer console ticket is required to reset the upload key. If this app is new to Play Console, register a fresh upload key outside Git.

2. **Hardcoded Build Credentials (P0 - Resolved):**
   - *Status:* `android/app/build.gradle` refactored to read from untracked `key.properties` or environment variables (`KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`). Fallback hardcoded passwords removed.

3. **Predictable Identifiers (P0 - Resolved):**
   - *Status:* `Math.random` replaced with `generateSecureId(prefix)` backed by Node.js `crypto.randomBytes(6)` and base36 timestamps.

4. **Capacitor Remote URL & Offline Resilience (P1 - Resolved):**
   - *Status:* `capacitor.config.ts` configured with `url: 'https://phiksniyar.in'`. `public/index.html` updated with a 3.5s watchdog timer and direct WhatsApp/Phone call booking cards for offline resilience.

---

## 4. Current Blockers (Founder Action Required)

| Blocker | Description | Impact | Founder Action |
| :--- | :--- | :--- | :--- |
| **BLK-01** | **Production Domain DNS** | `https://phiksniyar.in` must resolve to production server. | Point domain `A` or `CNAME` records to deployment host (Railway/Render/VPS). |
| **BLK-02** | **Payment Gateway KYC** | Live Razorpay Key ID and Secret required for online UPI payments. | Complete business KYC on Razorpay dashboard. (Until active, launch with **Confirmed Cash-on-Service**). |
| **BLK-03** | **Google Play Console** | Play Console account ($25 one-time registration) needed to publish `app-release.aab`. | Upload bundle to internal/closed testing track and submit Data Safety answers. |
| **BLK-04** | **Transactional SMS Credits** | Fast2SMS API key required for live SMS delivery. | Add SMS wallet balance. (Application automatically shows in-app OTP modal when SMS key is unset). |

---

## 5. 48-Hour Launch Roadmap & Priorities

- **Hours 0–12 (Completed):** Security lockdown, signing key isolation, BOLA fixes, test suite green (49/49 passed), Next.js production build, Android AAB generation.
- **Hours 12–24 (Deployment):** Deploy Docker container to persistent volume host (Railway / Render / VPS), attach `https://phiksniyar.in`, verify SSL certificate and `/api/health`.
- **Hours 24–36 (Technician Onboarding):** Onboard first 5–10 trusted technicians in Chilakaluripet using the direct WhatsApp scripts in [`FIRST_CUSTOMERS.md`](file:///e:/Testing%20Idea/FIRST_CUSTOMERS.md).
- **Hours 36–48 (Resident Launch & Play Store):** Distribute WhatsApp status graphics to local apartment groups; upload AAB to Google Play Console closed testing track.
