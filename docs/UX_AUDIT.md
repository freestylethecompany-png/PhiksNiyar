# PHIKSNIYAR — UX & UI AUDIT REPORT (Phase 0)
**Product:** PhiksNiyar (ఫిక్స్ నియర్)  
**Initial Market:** Chilakaluripet, Andhra Pradesh, India  
**Date:** October 2026  
**Auditor:** Principal UX Engineer & Design Systems Architect  
**Status:** Remediated & Polished  

---

## 1. Design System Foundation
The PhiksNiyar visual language balances modern digital marketplace convenience with Indian local community warmth:
- **Primary Deep Indigo:** `#182B49` (Authority, stability, trust)
- **Secondary Emerald:** `#0F9D72` (Growth, verification, completed success)
- **Accent Saffron:** `#F59E0B` (Energy, urgency, highlight)
- **Background Foundation:** `#F8FAFC` (Clean slate, high legibility)
- **Surface Elevation:** `#FFFFFF` (Card surfaces, crisp contrast)
- **Text Primary:** `#111827` (High contrast, readable in direct sunlight)
- **Muted Text:** `#64748B` (Secondary captions and metadata)
- **Error / SOS:** `#DC2626` (Urgent repairs, validation alerts)

---

## 2. UX Audit Register

### UX-01: Brand Color Palette Harmonization
- **Issue:** Fragmented color values across components (e.g. ad-hoc oranges, blues, and emeralds).
- **Severity:** HIGH
- **Affected File:** `src/app/globals.css`
- **Reason:** Visual incoherence reduces perceived brand professionalism.
- **Recommended Fix:** Standardize CSS design tokens on the canonical PhiksNiyar palette: `#182B49` (Deep Indigo), `#0F9D72` (Emerald), `#F59E0B` (Saffron).
- **Implementation Status:** RESOLVED. Root tokens updated in `src/app/globals.css`.

### UX-02: Canonical Logo Component System
- **Issue:** Logo rendered inconsistently across navbar, modals, and legal pages using arbitrary inline styling.
- **Severity:** MEDIUM
- **Affected File:** `src/components/common/PhiksNiyarLogo.tsx`, `src/components/Navbar.tsx`
- **Reason:** Brand dilution and missing variants (monochrome, icon-only, badge, dark mode, loading animation).
- **Recommended Fix:** Implement a single canonical `PhiksNiyarLogo` component supporting all required variants: `full`, `icon`, `monochrome`, `dark`, `light`, `badge`, `loading`, and `appIcon`.
- **Implementation Status:** RESOLVED. Canonical `PhiksNiyarLogo.tsx` created and deployed.

### UX-03: Mobile Viewport & Touch Target Ergonomics
- **Issue:** Small tap targets (< 40px) and potential horizontal scrollbars on compact screens (320px–375px).
- **Severity:** HIGH
- **Affected File:** `src/app/globals.css`, `src/components/customer/HeroAIInput.tsx`
- **Reason:** Service technicians and home customers overwhelmingly use budget Android smartphones (360px–412px screen widths).
- **Recommended Fix:** Enforce minimum 44px tap targets for buttons, inputs, and category chips. Apply `max-width: 100vw; overflow-x: hidden;` on body and container wrappers.
- **Implementation Status:** RESOLVED. Responsive rules tuned for 320px, 375px, 390px, 412px, 768px, 1024px, and 1440px.

### UX-04: Role-Aware Navigation Clarity
- **Issue:** Cluttered navbar showing mismatched actions for customers, service partners, and administrators.
- **Severity:** HIGH
- **Affected File:** `src/components/Navbar.tsx`
- **Reason:** Customers need discovery and tracking; providers need active jobs and earnings; admins need oversight.
- **Recommended Fix:** Render dynamic role-specific navigation tabs:
  - Customer: Home, Services, Bookings, Messages, Profile.
  - Provider: Dashboard, Jobs, Availability, Earnings, Profile.
  - Admin: Dashboard, Bookings, Providers, Customers, Payments, Disputes, Audit Logs.
- **Implementation Status:** RESOLVED. Role-aware navigation verified.

### UX-05: Empty & Loading States
- **Issue:** Blank screens during initial query loads or when no providers exist in a subcategory.
- **Severity:** MEDIUM
- **Affected File:** `src/components/customer/ActiveBookings.tsx`, `src/app/page.tsx`
- **Reason:** Blank screens cause users to believe the application is frozen.
- **Recommended Fix:** Add animated pulse skeletons, friendly illustrations, and informative empty state copy with clear call-to-actions ("Browse other categories" or "Request custom help").
- **Implementation Status:** RESOLVED. Skeleton loaders and empty state cards implemented.

### UX-06: Doorstep OTP Presentation Clarity
- **Issue:** Customers confused about where to find the 4-digit verification code when technician arrives.
- **Severity:** HIGH
- **Affected File:** `src/components/customer/ActiveBookings.tsx`
- **Reason:** Doorstep friction delays service start and creates tension between customer and provider.
- **Recommended Fix:** Feature the Doorstep OTP prominently on the customer's active booking card in large, high-contrast monospace font (`font-size: 1.5rem; letter-spacing: 4px;`) with explicit copy: *"Share this code with technician upon arrival to start work"*.
- **Implementation Status:** RESOLVED. High-contrast OTP display implemented.
