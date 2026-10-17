# PhiksNiyar — Android & Google Play Release Guide

**Application ID:** `com.phiksniyar.app`  
**App Name:** PhiksNiyar (ఫిక్స్ నియర్) — Skilled People • Real Solutions  
**Version Code:** `1`  
**Version Name:** `1.0`  
**Target SDK:** `34` (Android 14) / Tested on Android 36  
**Min SDK:** `22` (Android 5.1 Lollipop)  
**Keystore File:** `android/phiksniyar-release-key.jks`  
**Key Alias:** `phiksniyar`  

---

## 1. Verified Binary Artifacts

Both production binaries have been compiled and verified on the `launch/48-hour-mvp` branch:

| Artifact Type | File Path | File Size | Signing Method | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Android App Bundle (AAB)** | `android/app/build/outputs/bundle/release/app-release.aab` | **8.83 MB** | V1 + V2 PKCS12 | **Mandatory format for Google Play Store upload** |
| **Debug APK** | `android/app/build/outputs/apk/debug/app-debug.apk` | **10.43 MB** | Android Debug Keystore | Local device testing and field QA |

---

## 2. Secure Signing Commands

The Gradle build configuration in `android/app/build.gradle` reads credentials strictly from environment variables:

```bash
# Windows PowerShell Build Command
$env:JAVA_HOME="C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:ANDROID_HOME="C:\AndroidSDK"
$env:KEYSTORE_PASSWORD="<YourReleaseKeystorePassword>"
$env:KEY_PASSWORD="<YourKeyPassword>"

cd android
.\gradlew.bat bundleRelease
```

---

## 3. Google Play Store Policy & Listing Checklist

### App Details
- **App Name:** `PhiksNiyar — Skilled People • Real Solutions`
- **Short Description (80 chars):**
  > Skilled People • Real Solutions. Verified local home & trade services in AP.
- **Telugu Short Description:**
  > నైపుణ్యం కలిగిన నిపుణులు • నిజమైన పరిష్కారాలు. చిలకలూరిపేట స్థానిక సేవలు.
- **Category:** House & Home / Business Services
- **Contact Email:** `support@phiksniyar.in`
- **Official Phone:** `+91 98480 22338`
- **Physical Address:** Main Road, Kalamandir Center, Chilakaluripet, Palnadu District, AP 522616.

### Privacy Policy & Terms URL
- Privacy Policy: `https://phiksniyar.in/privacy`
- Terms of Service: `https://phiksniyar.in/terms`
- Account Deletion URL: `https://phiksniyar.in/privacy#account-deletion` (Also accessible in-app under Account Settings).

---

## 4. Google Play Data Safety Declarations

Google Play requires accurate answers to the Data Safety questionnaire:

| Data Type | Collected? | Shared? | Purpose | Ephemeral? | User Can Delete? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phone Number** | Yes | No | Account management, SMS OTP, booking confirmation | No | Yes (via in-app account deletion) |
| **Name** | Yes | No | Order personalization and technician identification | No | Yes |
| **Approximate Location** | Yes | No | Matching nearby providers within Chilakaluripet | Yes | Yes |
| **User ID** | Yes | No | Cryptographic booking associations (`generateSecureId`) | No | Yes |
| **Device / Diagnostic Info** | No | No | Not tracked | N/A | N/A |

- **Third-Party Data Sharing:** **No**. PhiksNiyar does NOT sell or share customer data with advertisers or brokers.
- **Data Encryption in Transit:** **Yes** (HTTPS TLS 1.3 enforced).
- **Account Deletion Link:** Fully supported and implemented at `/api/auth/delete-account`.

---

## 5. Testing Tracks & Google Play 20-Tester Rule

### Personal Developer Accounts (Created after November 13, 2023):
Google requires **20 testers opted in for at least 14 days** continuously before applying for production access:
1. Create a Closed Testing track in Play Console.
2. Add an email list containing 20 friends, local service partners, or community members.
3. Share the opt-in web link with testers.
4. Testers download the app and open it occasionally over the 14-day window.
5. After 14 days, the **"Apply for Production"** button becomes active.

### Organization Accounts (DUNS Registered Company):
Organization developer accounts are **exempt from the 20-tester rule** and can publish directly to production after Google's standard app review (typically 2-4 business days).

---

## 6. Sideloading Debug APK for Immediate Field Testing

While Google Play review is pending, the founder and local technicians can install and use the app immediately via sideloading:
1. Connect Android phone via USB with USB Debugging enabled, or share `app-debug.apk` via Google Drive / WhatsApp.
2. Enable *"Install unknown apps"* for the file browser.
3. Install `app-debug.apk`.
4. The app opens directly to the PhiksNiyar mobile interface.
