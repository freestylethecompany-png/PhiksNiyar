# PHIKSNIYAR — PRODUCT AUDIT REPORT (Phase 0)
**Product:** PhiksNiyar (ఫిక్స్ నియర్)  
**Tagline:** Local help. Right when you need it. (లోకల్ సాయం. మీకు అవసరమైనప్పుడే.)  
**Initial Market:** Chilakaluripet, Andhra Pradesh, India  
**Date:** October 2026  
**Auditor:** Principal Product Designer & Product Manager  
**Status:** Remediated & Aligned  

---

## 1. Product Positioning & Integrity
PhiksNiyar is a real transaction marketplace, not merely an unverified directory. The product premise is built on radical trust, transparency, and local community alignment in Chilakaluripet.

---

## 2. Product Audit Register

### PROD-01: Eradication of Fabricated Statistics & Social Proof
- **Issue:** Hardcoded claims such as "32+ Verified Local Pros Active Now" or "100% satisfaction" in headers and hero sections.
- **Severity:** HIGH (Trust & Truth in Advertising)
- **Affected File:** `src/lib/i18n/translations.ts`, `src/app/page.tsx`
- **Reason:** Manufacture of fake metrics damages credibility when launching in a real Tier-3 town where reputation is paramount.
- **Recommended Fix:** Compute provider counts dynamically from actual database queries. When providers are onboarding or count is zero, honestly display:
  - English: *"Local professionals are joining PhiksNiyar in Chilakaluripet"*
  - Telugu: *"చిలకలూరిపేటలో సర్వీస్ ప్రొవైడర్లు చేరుతున్నారు"*
- **Implementation Status:** RESOLVED. Hardcoded claims replaced with dynamic database counts and honest launch state messaging.

### PROD-02: Truthful Verification Claims
- **Issue:** Unsubstantiated marketing text claiming "Government verified" or "100% verified".
- **Severity:** MEDIUM (Regulatory & Legal Compliance)
- **Affected File:** `src/lib/i18n/translations.ts`, `src/app/page.tsx`
- **Reason:** PhiksNiyar verifies identity and local trade credentials; it does not issue government certifications.
- **Recommended Fix:** Revise badges to accurately state:
  - English: *"Identity & Trade background verified by PhiksNiyar"*
  - Telugu: *"గుర్తింపు మరియు వృత్తి నైపుణ్యాలను ఫిక్స్ నియర్ పరిశీలించింది"*
- **Implementation Status:** RESOLVED. Text updated across English and Telugu translation catalogs.

### PROD-03: Upfront Starting Price Transparency
- **Issue:** Ambiguity whether base rates are fixed quotes or starting estimates.
- **Severity:** MEDIUM
- **Affected File:** `src/components/customer/CategoryGrid.tsx`, `src/components/customer/ProviderCard.tsx`
- **Reason:** Customers feel deceived if final charges differ without prior explanation.
- **Recommended Fix:** Clearly prefix all catalog pricing with "Starting from ₹X" / "₹X నుండి". Disclose that visiting/inspection charges are standard and adjusted against final repair invoices.
- **Implementation Status:** RESOLVED. Price badges explicitly state starting price baseline.

### PROD-04: Customer Approval for Additional Charges
- **Issue:** Providers quoting additional parts or labor without customer recorded consent on platform.
- **Severity:** HIGH
- **Affected File:** `src/app/api/bookings/route.ts`, `src/lib/db/stateMachine.ts`
- **Reason:** Offline price disputes cause mistrust and platform circumvention.
- **Recommended Fix:** Implement `AWAITING_PRICE_CONFIRMATION` state. If a technician quotes extra parts, customer must click "Approve" on their PhiksNiyar screen before work continues.
- **Implementation Status:** RESOLVED. Price confirmation workflow wired into state machine.

### PROD-05: Cash Payment Audit Trail
- **Issue:** Cash transactions marked complete without dual-confirmation, risking cash fraud or commission avoidance.
- **Severity:** HIGH
- **Affected File:** `src/lib/db/database.ts`, `src/app/api/bookings/route.ts`
- **Reason:** Cash remains dominant in Indian semi-urban commerce.
- **Recommended Fix:** Introduce three-stage cash workflow:
  `CASH_PENDING` -> `CASH_REPORTED` (by provider) -> `CASH_CONFIRMED` (by customer or automated audit).
- **Implementation Status:** RESOLVED. Cash workflow fields and validations active.

### PROD-06: Real 7-Day Warranty Management
- **Issue:** Displaying "7-Day Warranty" badge without backend database claim records or tracking.
- **Severity:** MEDIUM
- **Affected File:** `src/lib/db/database.ts`, `src/app/api/warranty/route.ts`
- **Reason:** Unbacked warranty claims lead to consumer grievances.
- **Recommended Fix:** Automatically generate a `WarrantyRecord` upon booking completion with `warrantyStart`, `warrantyEnd` (7 days duration), status `ACTIVE`, and a dedicated claim submission endpoint.
- **Implementation Status:** RESOLVED. Warranty table and management API operational.

### PROD-07: First-Class Telugu Experience
- **Issue:** Telugu text previously mixed with untranslated English buttons and corrupted font rendering.
- **Severity:** HIGH
- **Affected File:** `src/lib/i18n/translations.ts`, `src/app/globals.css`
- **Reason:** Chilakaluripet is predominantly Telugu-speaking; broken glyphs alienation local customers and technicians.
- **Recommended Fix:** Complete Telugu translation for all screens, error messages, and state badges. Integrate Google Font `Noto Sans Telugu` into the root font stack.
- **Implementation Status:** RESOLVED. Full bilingual dictionary and font integration verified.
