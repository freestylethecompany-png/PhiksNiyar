# PhiksNiyar (ఫిక్స్ నియర్)

> **Local help. Right when you need it.**  
> *(లోకల్ సాయం. మీకు అవసరమైనప్పుడే.)*

**PhiksNiyar** is a production-grade, transaction-focused hyperlocal services marketplace built specifically for Bharat, launching initially in **Chilakaluripet, Palnadu District, Andhra Pradesh, India**.

Unlike passive directories that merely share phone numbers, PhiksNiyar manages the complete service transaction lifecycle from AI matching, doorstep arrival OTP verification, and price approvals to UPI payments, 7-day warranty protection, and dispute mediation.

---

## 🌟 Key Features

1. **Transaction Platform, Not Just a Directory:**
   - 16-state server-authoritative booking lifecycle engine (`REQUESTED` through `CLOSED`).
   - 6-state provider verification pipeline (`PENDING` through `VERIFIED`).
   - Doorstep cryptographic 4-digit OTP handshake preventing premature starts.
2. **First-Class Bilingual Experience (English + Telugu):**
   - Native Telugu script support powered by `Noto Sans Telugu` with zero broken glyphs.
   - Dual-language AI intent parser supporting spoken and typed Tanglish, Telugu, and English.
3. **Transparent Upfront Pricing & Anti-Circumvention:**
   - Server-enforced starting price baselines and standard visiting charges.
   - Explicit customer consent required before technicians can add replacement part charges (`AWAITING_PRICE_CONFIRMATION`).
   - Dual-confirmation cash payment audit trail (`CASH_REPORTED` -> `CASH_CONFIRMED`).
4. **Guaranteed Post-Service Protection:**
   - Automatic 7-Day Free Rework warranty registered upon service completion.
   - Formal dispute filing and mediation workflow with administrative review.
5. **Radical Data Privacy (DPDP Act 2023 Compliant):**
   - Customer street addresses protected; locality only is shown until technician acceptance.
   - Zero plaintext Aadhaar numbers stored; identity records protected using salted SHA-256 hashes.
   - Technicians tracked via live location SSE streams exclusively during active dispatch.
6. **Zero External Dependency Matching Engine:**
   - Deterministic 10-factor scoring engine (Category, Distance, Availability, Rating, Completion Rate, Response Time, Price compatibility).

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16.3.8 (React 19, Turbopack)
- **Language:** TypeScript 7
- **Styling:** Vanilla CSS design system with curated Indian Palette (Deep Indigo `#182B49`, Emerald `#0F9D72`, Saffron `#F59E0B`)
- **Database:** Persistent WAL-mode SQLite (containerized/Docker) + 100% mirrored PostgreSQL schema (`schema.sql` for Supabase/Neon)
- **Authentication:** JWT sessions in secure HTTP-only cookies + mobile 6-digit OTP verification
- **Payments:** Razorpay UPI/Card gateway with HMAC-SHA256 signature verification + Cash workflow
- **Maps:** Leaflet & OpenStreetMap road network geocoding

---

## 🚀 Quickstart

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Security & Lifecycle Test Suite
```bash
npm run test:security
```
Executes 27 automated tests verifying BOLA/IDOR protection, rate limiting, OTP brute-force locking, 16-state lifecycle guards, and warranty logic.

### 5. Production Build & Start
```bash
npm run build
npm start
```

---

## 📱 Progressive Web App (PWA) Installation

PhiksNiyar is a fully compliant Progressive Web App with offline fallback support, fast asset caching, and standalone window launch.

### On Android (Chrome / Brave / Edge / Samsung Internet):
1. Open `https://phiksniyar.in` (or your local IP `http://<your-pc-ip>:3000` on your Wi-Fi).
2. Tap the **"Install PhiksNiyar App"** banner at the bottom of the screen, or tap the browser menu (⋮) and select **"Add to Home screen"** / **"Install app"**.
3. The app icon will appear on your home screen and app drawer, running full-screen without URL bars.

### On iPhone & iPad (iOS Safari):
1. Open the application in Safari.
2. Tap the **Share** button (box with an upward arrow) in the bottom bar.
3. Scroll down and tap **"Add to Home Screen"** (హోమ్ స్క్రీన్‌కు జోడించండి).
4. Tap **Add** in the top-right corner. The app launches with custom splash icons and full-screen iOS presentation.

### On Desktop PCs & Laptops (Windows / macOS / Linux):
1. Open the application in Chrome, Edge, or Brave.
2. Click the **Install** icon in the browser address bar (right side), or click the in-app **"Install"** button.
3. The application opens as an independent desktop application with dedicated taskbar pin support and window controls.

---

## 🗄️ Database Topologies & Setup

PhiksNiyar supports dual database topologies:

### Option A: Persistent SQLite with WAL Mode (Zero external dependencies)
Default out of the box. Automatically creates and manages schema and tables at `data/phiksniyar.db`.
- Configured with `PRAGMA journal_mode = WAL;` for high concurrency.
- Ideal for single-node Docker containers, VPS, Railway, Render with persistent volume.

### Option B: Cloud PostgreSQL (Supabase / Neon / AWS RDS)
For cloud serverless environments:
1. Create a PostgreSQL 15+ database in Supabase or Neon.
2. Execute the provided [`schema.sql`](file:///e:/Testing%20Idea/schema.sql) in your SQL editor.
3. Set `DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/phiksniyar?sslmode=require` in your `.env.local`.

---

## 🚀 Cloud Deployment Guide

### Deploying with Docker
```bash
# Build the production container
docker build -t phiksniyar:latest .

# Run with persistent data volume
docker run -d \
  -p 3000:3000 \
  -v phiksniyar_data:/app/data \
  -e NODE_ENV=production \
  -e JWT_SECRET="your-secure-32-char-random-secret" \
  --name phiksniyar-app \
  phiksniyar:latest
```

### Deploying on Railway / Render
1. Connect this Git repository.
2. Add a persistent disk volume mounted at `/app/data` (for SQLite).
3. Set environment variables from `.env.example`.
4. Deploy! Health checks will automatically verify `GET /api/health`.

---

## 📊 Live System Health
Check system health at `GET /api/health`:
```json
{
  "status": "healthy",
  "product": "PhiksNiyar (ఫిక్స్ నియర్)",
  "market": "Chilakaluripet, AP, India",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "topology": "SQLite-WAL"
  }
}
```

---

## 📄 License & Compliance
Copyright © 2026 PhiksNiyar Technologies. All rights reserved.  
Compliant with Consumer Protection (E-Commerce) Rules, 2020 and Digital Personal Data Protection (DPDP) Act 2023.
