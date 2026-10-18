# PhiksNiyar — Production Release Checklist & Launch Gates

**Target Branch:** `launch/48-hour-mvp`  
**Platform Version:** `1.0.0` (Android Version Code: `1`, Version Name: `1.0`)  
**Evaluation Date:** October 17, 2026  
**Status Key:**  
- **PASS**: Verified with automated test suites or production build logs.  
- **FAIL**: Defect verified and unaddressed.  
- **BLOCKED**: Requires founder external action (credentials, bank KYC, domain DNS).  
- **NOT TESTED**: Requires physical hardware or external network deployment.  

---

## 1. Automated Quality & Security Gates

| Gate ID | Check Description | Command Executed | Result | Evidence / Log Output |
| :--- | :--- | :--- | :--- | :--- |
| **QG-01** | **Automated Security Suite** | `npm run test:security` | **PASS** | `TEST RESULTS: 39 / 39 PASSED` (Zero failures across all 39 security tests). |
| **QG-02** | **TypeScript Compilation** | `npm run typecheck` (`tsc --noEmit`) | **PASS** | Exited with code 0. Zero type errors. |
| **QG-03** | **Production Web Build** | `npm run build` (`next build` Turbopack) | **PASS** | 28/28 routes compiled (22 dynamic API endpoints, 6 static routes). |
| **QG-04** | **Android Debug APK Build** | `cd android && gradlew.bat assembleDebug` | **PASS** | `BUILD SUCCESSFUL in 1m 12s`. Output: `android/app/build/outputs/apk/debug/app-debug.apk` (10.43 MB). |
| **QG-05** | **Android Release Bundle Build** | `cd android && gradlew.bat bundleRelease` | **PASS** | `BUILD SUCCESSFUL in 1m 37s`. Output: `android/app/build/outputs/bundle/release/app-release.aab` (8.83 MB). |
| **QG-06** | **Android Signing Verification** | `jarsigner -verify -verbose -certs app-release.aab` | **PASS** | `jar verified.` Signed with RSA 2048-bit key (`CN=PhiksNiyar Technologies`) using untracked upload keystore. |
| **QG-07** | **E2E Marketplace Smoke Test** | `npm run test:smoke` (`scripts/smoke-test.js`) | **PASS** | `SMOKE TEST RESULTS: 10 / 10 PASSED` (Isolated temporary SQLite DB; production data completely untouched). |
| **QG-08** | **Atomic Database Backup** | `npm run db:backup` (`scripts/db-backup.ts`) | **PASS** | Successfully generated binary `.db` snapshot and structured `.json` table archive with verified row counts. |

> [!NOTE]
> **Test Environment & CI Disclosure:** All quality, security, and build gates above were executed and verified locally in the clean project environment. Remote GitHub Actions workflow runs have not been executed for this branch, so no remote CI status is claimed.

---

## 2. Security & Compliance Gates

| Gate ID | Security Domain | Target Requirement | Status | Evidence & Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **BOLA / IDOR Protection** | Prevent cross-customer booking inspection | **PASS** | Enforced in `bookingService.ts` and `/api/bookings`; verified by `SEC-01` & `SEC-11` tests. |
| **SEC-02** | **PII & Address Privacy** | Mask customer street address until provider accepts job | **PASS** | Masked in API responses until `IN_PROGRESS`; verified by `SEC-02` test. |
| **SEC-03** | **Credential Storage** | Zero hardcoded signing or database passwords in repo | **PASS** | `android/app/build.gradle` uses `System.getenv("KEYSTORE_PASSWORD")` with no hardcoded fallback. |
| **SEC-04** | **OTP Invalidation** | OTP code deleted after first successful use | **PASS** | Database deletes `startOtp` immediately upon job start; verified by `SEC-06` test. |
| **SEC-05** | **Collision-Resistant IDs** | Database and booking IDs must not use `Math.random` | **PASS** | `generateSecureId` in `cryptoUtils.ts` uses `crypto.randomBytes(6)` and base36 timestamp. |
| **SEC-06** | **Brute Force Defense** | Enforce lockout after 5 consecutive failed attempts | **PASS** | In-memory token bucket rate limiter in `rateLimiter.ts`; verified by `SEC-05` test. |
| **SEC-07** | **Account Deletion** | Google Play & DPDP 2023 compliance | **PASS** | `/api/auth/delete-account` scrubs PII, clears session cookies; verified by `SEC-36` test. |

---

## 3. Core Marketplace Journey Gates

| Gate ID | User Journey | Requirement | Status | Verification Detail |
| :--- | :--- | :--- | :--- | :--- |
| **JRN-01** | **Customer Discovery** | Browse service categories & Chilakaluripet areas | **PASS** | Interactive search, location selector (`Kalamandir Center`, `Pandaripuram`, etc.), category cards. |
| **JRN-02** | **Customer Booking** | Book service with upfront visiting charges | **PASS** | Creates canonical booking record with `generateSecureId('bk')` and customer audit trail. |
| **JRN-03** | **Provider Acceptance** | Provider receives job and can Accept or Decline | **PASS** | State machine validates transition `REQUESTED` → `ACCEPTED`. |
| **JRN-04** | **Job In-Progress** | Require 4-digit Doorstep Start-OTP before work starts | **PASS** | Provider must enter correct customer OTP to reach `IN_PROGRESS`. |
| **JRN-05** | **Price Confirmation** | Extra scope requires explicit customer approval | **PASS** | Provider transitions to `AWAITING_PRICE_CONFIRMATION`; work cannot finish until customer confirms. |
| **JRN-06** | **Job Completion** | Trigger 7-Day Free Warranty upon completion | **PASS** | Automatic creation of `WarrantyRecord` (7 days duration) upon `COMPLETED`. |
| **JRN-07** | **Payment Workflow** | Online Razorpay or Confirmed Cash-on-Service | **PASS** | Razorpay signature verification; cash payments require customer confirmation before completion. |

---

## 4. Android Native Shell Gates

| Gate ID | Native Feature | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| **AND-01** | **Remote Server URL** | **PASS** | `capacitor.config.ts` points to `https://phiksniyar.in` with `androidScheme: 'https'`. |
| **AND-02** | **Offline Watchdog** | **PASS** | `public/index.html` watchdog triggers after 3.5s if unreachable, displaying offline assistance card. |
| **AND-03** | **WhatsApp / Phone Fallback** | **PASS** | Direct links `tel:+919848022338` and `https://wa.me/919848022338` active in offline shell. |
| **AND-04** | **Permissions Audit** | **PASS** | `AndroidManifest.xml` requests only `INTERNET` and `ACCESS_NETWORK_STATE`. No excessive runtime permissions. |
| **AND-05** | **Physical Device Test** | **NOT TESTED** | Requires founder to test `app-debug.apk` on physical Android device for camera and GPS behavior. |

---

## 5. Deployment Blockers (Founder Action Required)

| Blocker ID | Domain | Required Action | Responsible Party | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BLK-01** | **Production Domain DNS** | Point `phiksniyar.in` A/CNAME record to deployment server | Founder | **BLOCKED** |
| **BLK-02** | **Payment Gateway KYC** | Submit business documents to Razorpay for live Key ID/Secret | Founder | **BLOCKED** *(Can launch with Cash-on-Service)* |
| **BLK-03** | **Google Play Console** | Create developer account, pay $25 fee, initiate closed testing track | Founder | **BLOCKED** |
| **BLK-04** | **SMS Gateway Credit** | Add Fast2SMS credits for live transactional SMS delivery | Founder | **BLOCKED** *(App falls back to in-app OTP modal)* |
