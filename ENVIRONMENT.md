# PHIKSNIYAR — Environment Variables & Secrets Reference
**Version:** 1.0.0  
**Initial Market:** Chilakaluripet, AP (PIN: 522616)

This document defines the configuration, secrets, and environment variable requirements for PhiksNiyar across **Local Development**, **Staging**, and **Production**.

---

## 1. Secrets Management Rules

1. **Client Isolation:** Never prefix secret credentials with `NEXT_PUBLIC_`. Variables exposed to the browser must only include public assets or anonymous public API tokens.
2. **Never Commit Secrets:** `.env`, `.env.local`, and `.env.production` are strictly excluded in `.gitignore`.
3. **Fallback Safety:** In production, missing critical secrets (e.g., `JWT_SECRET`, `DATABASE_URL`) will cause immediate termination of server boot rather than falling back to default values.

---

## 2. Complete Environment Variable Inventory

| Variable Name | Required | Public / Private | Default / Example Value | Description |
|---|---|---|---|---|
| `NODE_ENV` | Yes | Private | `production` | Node.js runtime mode (`development`, `test`, `production`). |
| `PORT` | No | Private | `3000` | HTTP port on which the Next.js standalone server listens. |
| `NEXT_PUBLIC_APP_URL` | Yes | **Public** | `https://phiksniyar.in` | Canonical URL used for SEO, OpenGraph tags, and redirects. |
| `JWT_SECRET` | **Yes (Prod)** | **Private** | High-entropy 64+ char string | Cryptographic key used to sign and verify HS256 session JWTs. |
| `JWT_EXPIRES_IN` | No | Private | `7d` | Token validity duration. |
| `DATABASE_URL` | Cond. | **Private** | `postgres://user:pass@host:5432/phiksniyar` | PostgreSQL connection pool URI (Used when running on Supabase / Cloud). |
| `SQLITE_DB_PATH` | Cond. | Private | `/app/data/phiksniyar.db` | Absolute path to persistent SQLite database file in Docker or Local. |
| `RAZORPAY_KEY_ID` | Cond. | **Public / Client** | `rzp_live_xxxxxxxxxxxx` | Razorpay public key ID required by browser checkout SDK. |
| `RAZORPAY_KEY_SECRET` | Cond. | **Private** | `xxxxxxxxxxxxxxxxxxxxxxxx` | Razorpay secret used for HMAC-SHA256 signature verification. |
| `RAZORPAY_WEBHOOK_SECRET`| Cond. | **Private** | `whsec_xxxxxxxxxxxxxxxxx` | Secret used to verify incoming asynchronous payment webhooks. |
| `FAST2SMS_API_KEY` | Cond. | **Private** | `xxxxxxxxxxxxxxxxxxxx` | Indian SMS gateway API key for sending production OTPs to mobile devices. |
| `TWILIO_ACCOUNT_SID` | Cond. | **Private** | `ACxxxxxxxxxxxxxxxxxxxx` | Fallback SMS provider SID. |
| `TWILIO_AUTH_TOKEN` | Cond. | **Private** | `xxxxxxxxxxxxxxxxxxxx` | Fallback SMS provider auth token. |
| `TWILIO_PHONE_NUMBER` | Cond. | **Private** | `+1xxxxxxxxxx` | Sender phone number for fallback SMS. |
| `NEXT_PUBLIC_SUPABASE_URL` | Cond. | **Public** | `https://xyz.supabase.co` | Supabase project URL (if utilizing Supabase services). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cond. | **Public** | `eyJhbGciOi...` | Supabase anonymous public key (subject to strict RLS). |
| `SUPABASE_SERVICE_ROLE_KEY` | Cond. | **STRICT PRIVATE**| `eyJhbGciOi...` | **CRITICAL: NEVER EXPOSE TO CLIENT.** Used strictly in server migrations. |

---

## 3. Environment Specific Configurations

### 3.1 Local Development (`.env.local`)
```ini
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=phiksniyar_local_development_secret_key_minimum_32_characters_long
SQLITE_DB_PATH=./data/phiksniyar.db

# Optional Sandbox Credentials
RAZORPAY_KEY_ID=rzp_test_mock
RAZORPAY_KEY_SECRET=mock_secret
```

### 3.2 Production Deployment (`.env.production` / Secret Store)
```ini
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://phiksniyar.in
JWT_SECRET=[GENERATE_WITH_OPENSSL_RAND_HEX_64]
SQLITE_DB_PATH=/app/data/phiksniyar.db

# Production Gateway
RAZORPAY_KEY_ID=rzp_live_real_key_id
RAZORPAY_KEY_SECRET=real_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=real_webhook_secret

# Production Indian SMS Gateway
FAST2SMS_API_KEY=real_fast2sms_token
```

---

## 4. Secret Generation & Rotation Guide

To generate a cryptographically secure 64-byte random key for `JWT_SECRET`:
```bash
openssl rand -hex 64
```

### Rotation Procedure:
1. Generate the new secret.
2. Add support for verifying tokens signed with the legacy secret during a 24-hour grace period while signing all new tokens with the new secret.
3. Fully invalidate the legacy secret after 24 hours.
