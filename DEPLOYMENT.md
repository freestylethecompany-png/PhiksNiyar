# PhiksNiyar (ఫిక్స్ నియర్) — Commercial Production Deployment Guide

This guide walks you through deploying **PhiksNiyar** (`https://phiksniyar.in`) to production across recommended commercial hosting platforms.

---

## 🎯 Architectural Overview for Production

PhiksNiyar provides two supported production deployment topologies:

| Deployment Platform | Storage Type | Recommended For | Setup Time |
| :--- | :--- | :--- | :--- |
| **Railway / Render / Fly.io / VPS** | Persistent Disk Volume (`/app/data`) | **Single-container production** (Fastest, zero external latency, sub-ms queries) | **~3 mins** |
| **Vercel / Cloudflare Pages** | Cloud PostgreSQL (Neon / Supabase) | **Serverless global edge** | **~5 mins** |

---

## 🚀 Recommended Option 1: Railway / Render / Fly.io (Docker with Persistent Volume)

This is the recommended production deployment because PhiksNiyar's WAL-mode embedded database engine delivers **sub-millisecond query responses with zero database connection pool limits and zero monthly external database fees**.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: PhiksNiyar production release"
git push origin main
```

### Step 2: Deploy to Railway
1. Log into [railway.app](https://railway.app).
2. Click **"New Project"** → **"Deploy from GitHub repo"** → Select your repository.
3. Go to **Settings** → **Volumes**:
   - Click **"Add Volume"**
   - Mount Path: `/app/data`
4. Go to **Variables** and add:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a random 32-character string (`openssl rand -hex 32`)
   - `DATA_DIR`: `/app/data`
   - `DATABASE_PATH`: `/app/data/phiksniyar.db`
   - `NEXT_PUBLIC_APP_URL`: `https://phiksniyar.in` (or your assigned Railway domain)
   - `PLATFORM_UPI_VPA`: `phiksniyar.payments@okhdfcbank`
   - `PLATFORM_COMMISSION_PERCENT`: `10.0`
   - `FAST2SMS_API_KEY`: *(Optional)* Your Fast2SMS API Key for Indian transactional OTPs
   - `RAZORPAY_KEY_ID`: *(Optional)* Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: *(Optional)* Razorpay Key Secret
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: *(Optional)* Public Razorpay Key ID
   - `RAZORPAY_WEBHOOK_SECRET`: *(Optional)* Webhook verification secret
5. Railway automatically builds using the included multi-stage [Dockerfile](./Dockerfile) and deploys your live site with automatic SSL.

---

## 🚀 Option 2: Deploy to Vercel (with Neon / Supabase Cloud PostgreSQL)

If deploying to Vercel serverless edge:

### Step 1: Provision Cloud PostgreSQL
1. Create a PostgreSQL database at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Open the SQL Editor and execute the included [schema.sql](./src/lib/db/schema.sql) to create the production tables, indexes, and RLS policies.
3. Copy your connection string:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/phiksniyar?sslmode=require
   ```

### Step 2: Connect to Vercel
1. Import your repository in [vercel.com](https://vercel.com).
2. Add Environment Variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `PLATFORM_UPI_VPA`
   - `ALLOW_DEMO_PERSONAS`: `false`
   - `NEXT_PUBLIC_DEMO_MODE`: `false`
3. Click **Deploy**.

---

## 🔍 Health & Verification
Once deployed, verify your live system health:
```bash
curl https://phiksniyar.in/api/health
```
Expected response:
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
