# FixNear — Commercial Production Deployment Guide

This guide walks you through deploying **FixNear** (`fixnear.in`) to production across recommended commercial hosting platforms.

---

## 🎯 Architectural Overview for Production

FixNear has two recommended deployment setups:

| Deployment Platform | Storage Type | Recommended For | Setup Time |
| :--- | :--- | :--- | :--- |
| **Railway / Render / Fly.io / VPS** | Persistent Disk Volume (`/app/data`) | **Single-container production** (Fastest, zero-cost DB, sub-ms queries) | **~3 mins** |
| **Vercel / Cloudflare Pages** | Cloud PostgreSQL (Neon / Supabase) | **Serverless global edge** | **~5 mins** |

---

## 🚀 Recommended Option 1: Railway / Render / Fly.io (Docker with Persistent Volume)

This is the recommended production deployment because FixNear's WAL-mode embedded database engine delivers **sub-millisecond query responses with zero database connection pool limits and zero monthly database fees**.

### Step 1: Deploy to Railway (Easiest)
1. Fork or push your code to your private GitHub repository:
   ```bash
   git add .
   git commit -m "feat: FixNear production release"
   git push origin main
   ```
2. Log into [railway.app](https://railway.app).
3. Click **"New Project"** → **"Deploy from GitHub repo"** → Select your repository.
4. Go to **Settings** → **Volumes**:
   - Click **"Add Volume"**
   - Mount Path: `/app/data`
5. Go to **Variables** and add:
   - `JWT_SECRET`: Generate a random 32-character string (`openssl rand -hex 32`)
   - `DATA_DIR`: `/app/data`
   - `DATABASE_PATH`: `/app/data/fixnear.db`
   - `NEXT_PUBLIC_APP_URL`: `https://fixnear.in` (or your Railway domain)
   - `FAST2SMS_API_KEY`: *(Optional)* Your Fast2SMS API Key for real SMS OTPs
   - `TWILIO_ACCOUNT_SID`: *(Optional)* Twilio credentials for SMS dispatch
   - `TWILIO_AUTH_TOKEN`: *(Optional)* Twilio Auth Token
   - `TWILIO_PHONE_NUMBER`: *(Optional)* Twilio Phone Number
   - `RAZORPAY_KEY_ID`: *(Optional)* Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: *(Optional)* Razorpay Key Secret
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: *(Optional)* Public Razorpay Key ID
6. Railway automatically uses the included multi-stage [Dockerfile](./Dockerfile) and deploys your live site with an automatic SSL certificate.

---

## 🚀 Option 2: Deploy to Vercel (with Neon / Supabase Cloud PostgreSQL)

If you prefer Vercel serverless edge deployment:
> **Important:** Do NOT use `/tmp` in production on Vercel because serverless Lambdas destroy `/tmp` upon spin-down. Always connect a real cloud PostgreSQL database.

### Step 1: Provision a Free Cloud PostgreSQL Database
1. Create a free PostgreSQL database at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Open the SQL Editor in Neon/Supabase and execute the included [schema.sql](./schema.sql) (or [src/lib/db/schema.sql](./src/lib/db/schema.sql)) to create the production tables, indexes, and constraints.
3. Copy your PostgreSQL connection string:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/fixnear?sslmode=require
   ```

### Step 2: Import into Vercel
1. Log into [vercel.com](https://vercel.com).
2. Click **"Add New Project"** → Import your GitHub repository.
3. Add the following **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string from Step 1
   - `JWT_SECRET`: A secure 32+ character string
   - `NEXT_PUBLIC_APP_URL`: `https://fixnear.in`
   - `FAST2SMS_API_KEY` or `TWILIO_ACCOUNT_SID`: For live SMS OTP dispatch
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: For live payments
4. Click **Deploy**. Vercel will build and launch your application globally.

---

## 🐳 Option 3: VPS Deployment (DigitalOcean / Hetzner / AWS EC2 with Docker)

For full ownership on a $5/month VPS (Ubuntu 22.04 / 24.04):

```bash
# 1. Clone repo onto VPS
git clone <your-repo-url> /var/www/fixnear
cd /var/www/fixnear

# 2. Create production environment file
cp .env.example .env.production
nano .env.production

# 3. Build & run production container with Docker
docker build -t fixnear-prod .

docker run -d \
  --name fixnear \
  -p 3000:3000 \
  -v /var/data/fixnear:/app/data \
  --env-file .env.production \
  --restart always \
  fixnear-prod
```

### Setup SSL with Caddy or Nginx (1 minute):
```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Edit /etc/caddy/Caddyfile:
fixnear.in {
    reverse_proxy localhost:3000
}

# Reload Caddy (auto-issues Let's Encrypt SSL certificate)
sudo systemctl reload caddy
```

---

## 🔐 Production Security Checklist

| Check | Status | Verification |
| :--- | :---: | :--- |
| **No Demo Persona Switching** | ✅ Enforced | `ALLOW_DEMO_PERSONAS=false` returns 403 on persona switch endpoints |
| **No Leaked OTPs in Production** | ✅ Enforced | `devOtp` is stripped when `NODE_ENV=production` |
| **Phone Number Format Validation** | ✅ Enforced | Only valid Indian 10-digit mobile numbers accepted |
| **Razorpay Signature Verification** | ✅ Enforced | Cryptographic HMAC-SHA256 signature verified before updating booking |
| **Doorstep OTP Protection** | ✅ Enforced | Providers cannot start work without customer OTP |
| **Anti-Circumvention Logging** | ✅ Enforced | Customer price-match guarantees and collusion risk strike tracking |
| **Aadhaar Verhoeff & PII Masking** | ✅ Enforced | Only SHA-256 hashes and masked numbers stored |
| **Geofenced Verification** | ✅ Enforced | Pros verified within Chilakaluripet geographic boundary |

---

## 🧪 Validating the Build

To ensure zero regressions prior to git commit and deployment:
```bash
npm run build
```
The build completes with 0 errors and creates optimized production bundles.
