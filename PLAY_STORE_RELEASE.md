# PhiksNiyar — Google Play Store Release & Publication Guide

This document contains all mandatory Google Play Store publication assets, policy declarations, store listing copy, Data Safety answers, and technical release instructions for **PhiksNiyar** (`com.phiksniyar.app`).

---

## 1. Store Listing Metadata

### App Details
- **App Name:** PhiksNiyar — Skilled People • Real Solutions
- **Package Name (Application ID):** `com.phiksniyar.app`
- **Category:** House & Home / Business Services
- **Default Language:** English (India) — `en-IN`
- **Secondary Languages:** Telugu (`te-IN`)

### Short Description (Max 80 characters)
> Skilled People • Real Solutions. Verified local home & trade services in AP.

### Telugu Short Description
> నైపుణ్యం కలిగిన నిపుణులు • నిజమైన పరిష్కారాలు. చిలకలూరిపేట స్థానిక సేవలు.

### Full Description (Max 4000 characters)
```text
PhiksNiyar (ఫిక్స్ నియర్) is your trusted hyperlocal services marketplace, connecting households and businesses across Chilakaluripet, Guntur District, and Andhra Pradesh with verified, background-checked trade professionals.

From emergency electrical repairs and plumbing diagnosis to air conditioner servicing, carpentry, painting, and appliance maintenance — PhiksNiyar brings certified local technicians directly to your doorstep with guaranteed upfront pricing.

WHY PHIKSNIYAR?

• SKILLED PEOPLE, REAL SOLUTIONS
Every technician on PhiksNiyar undergoes multi-stage verification including trade background review, address validation, and in-person workshop checks.

• 7-DAY FREE REWORK WARRANTY
Enjoy total peace of mind. Every completed booking is backed by our official 7-Day Free Rework Warranty. If an issue recurs, our partner returns at zero service cost.

• 4-DIGIT DOORSTEP START-OTP
Technicians can only start your job after you verify their physical presence by providing a secure 4-digit Doorstep Start-OTP.

• TRANSPARENT PRICE APPROVAL
No hidden surprises. If additional replacement parts or scope of work are required, quotes must be approved directly on your screen before work proceeds.

• SECURE PAYMENTS
Pay seamlessly via UPI QR, online card/netbanking via Razorpay, or Cash on Delivery after the job is finished.

• TELUGU & ENGLISH BILINGUAL SUPPORT
Use PhiksNiyar easily in your preferred language: English or Telugu (తెలుగు).

POPULAR SERVICES:
• Electrician: Wiring, MCB repair, switchboard installation, inverter setup
• Plumber: Pipe leakage, tap fitting, sanitary repair, water tank cleaning
• AC & Refrigeration: Gas refill, deep filter cleaning, cooling repair
• Appliance Repair: Washing machine, microwave, geyser, water purifier
• Carpenter & Painter: Furniture repair, modular fittings, interior wall painting

SERVICE LOCATION:
Exclusively serving Chilakaluripet, Pandaripuram, Kalamandir Center, Purushothapatnam, Ganapavaram, and surrounding communities in Andhra Pradesh.

PhiksNiyar — Skilled People • Real Solutions.
Download the official app today!
```

---

## 2. Graphic Assets Specifications for Play Console

| Asset Type | Required Dimensions | Format | Source in Repository |
| :--- | :--- | :--- | :--- |
| **App Icon** | 512 × 512 px | PNG (32-bit transparent RGBA, max 1MB) | `public/icon-512.png` |
| **Feature Graphic** | 1024 × 500 px | PNG / JPEG (No transparency, max 15MB) | `public/phiksniyar-feature-graphic.png` |
| **Phone Screenshots** | Min 2, max 8 (1080 × 1920 or 1080 × 2400) | PNG / JPEG (16:9 or 9:16) | Captured from mobile web view |
| **7-Inch Tablet Screenshots** | Min 1, max 8 | PNG / JPEG | Captured from tablet responsive layout |
| **10-Inch Tablet Screenshots** | Min 1, max 8 | PNG / JPEG | Captured from desktop/tablet view |

---

## 3. Mandatory Google Play Policy Declarations

### A. Privacy Policy URL
- **Public URL:** `https://phiksniyar.in/privacy`
- **Hosted Locally:** [`src/app/privacy/page.tsx`](file:///e:/Testing%20Idea/src/app/privacy/page.tsx)
- **Compliance:** Aligned with Indian Digital Personal Data Protection (DPDP) Act 2023, UIDAI Aadhaar masking guidelines, and Google Play User Data Policy.

### B. Account Deletion URL (Mandatory for apps with account creation)
- **In-App Deletion:** User taps profile avatar in navigation bar -> selects *Delete Account* -> confirms deletion.
- **Web Deletion Request URL:** `https://phiksniyar.in/privacy#account-deletion`
- **Direct Support Request:** `mailto:support@phiksniyar.in`
- **Data Scrubbing Action:** Immediately purges phone numbers, user names, saved addresses, and active session tokens. Historical completed invoices are scrubbed of PII into an anonymized financial ledger to satisfy Indian GST audit statutes.

### C. Target Audience & Content Rating
- **Target Age:** 18 and older.
- **IARC Content Rating:** Everyone (PEGI 3, USK 0, ESRB Everyone).
- **Interactive Elements:** Users Interact (Chat with assigned service partner), Digital Purchases (Payments for local services).
- **Ads Declaration:** "No, my app does not contain ads."
- **Financial Features:** "Service Marketplace Payments via RBI-regulated payment aggregator (Razorpay)."

---

## 4. Google Play Data Safety Questionnaire Answers

When completing the Google Play Console **Data Safety** section, answer as follows:

### Does your app collect or share user data?
- **Answer:** **Yes**

### Is all of the user data collected encrypted in transit?
- **Answer:** **Yes** (All API communication occurs exclusively over HTTPS with TLS 1.3 / TLS 1.2).

### Do you provide a way for users to request that their data be deleted?
- **Answer:** **Yes** (Both within the app via Account Settings and via public web URL `https://phiksniyar.in/privacy#account-deletion`).

### Specific Data Types Collected:

1. **Location:**
   - **Approximate Location:** Yes (Used for finding nearby technicians in Chilakaluripet).
   - **Precise Location:** Yes (Optional, when user taps "Detect My Location" to locate doorstep address).
   - **Purpose:** App functionality, service delivery.
   - **Shared with third parties:** No.

2. **Personal Info:**
   - **Name:** Yes (Customer name for technician identification).
   - **Phone Number:** Yes (Account authentication via OTP, booking coordination).
   - **Address:** Yes (Doorstep service fulfillment, masked until booking is accepted).
   - **Purpose:** App functionality, account management.
   - **Shared with third parties:** No.

3. **Financial Info:**
   - **Payment Info:** Yes (Processed securely by Razorpay; PhiksNiyar servers never store card numbers or CVV).
   - **Purchase History:** Yes (Past booking service invoices).
   - **Purpose:** Fraud prevention, financial accounting.

4. **Security Practices:**
   - Data encrypted in transit using industry-standard HTTPS.
   - Users can delete their data at any time.

---

## 5. Play Console App Access Reviewer Instructions

For Google Play policy review and automated login testing:

- **App Access Configuration:** Select **"All or some functionality is restricted"** in Play Console.
- **Dedicated Test Account:** When adding credentials in Google Play Console, use a dedicated test customer number provisioned for reviewer access.
  - *Note:* **Never** submit a founder's personal phone number or live OTP credentials in public documentation or Play Console instructions.
- **Reviewer Note:**
  > "PhiksNiyar is a hyperlocal home services marketplace serving Chilakaluripet, AP, India. To test the booking and service discovery workflow without dispatching a live technician, select any service category (Electrician, Plumber) and choose 'Cash on Service'. To test the Account Deletion flow, tap the profile menu in the top right header and click 'Delete Account'."

---

## 6. Android Technical Release Configuration

- **Application ID:** `com.phiksniyar.app`
- **Min SDK:** 22 (Android 5.1 Lollipop)
- **Compile SDK:** 34 (Android 14) / Compatible with SDK 36
- **Target SDK:** 34 (Complies with Google Play Target API 34+ requirement)
- **Signing Keystore:** Untracked release upload key configured via `android/key.properties` or environment variables (never committed to repository).
- **Key Alias:** `upload` (configured in untracked `android/key.properties`)
- **Keystore Type:** PKCS12 (Standard, secure)

### Release Build Commands:
```bash
# 1. Sync web assets
npx cap sync android

# 2. Build signed Android App Bundle (.aab) for Google Play
cd android && gradlew.bat bundleRelease

# 3. Build signed APK for local testing
cd android && gradlew.bat assembleRelease
```

### Artifact Output Locations:
- **Play Console AAB:** `android/app/build/outputs/bundle/release/app-release.aab`
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk`
- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
