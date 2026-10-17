# PhiksNiyar (ఫిక్స్ నియర్) — Production Deployment & Operations Runbook

This guide covers deploying and operating **PhiksNiyar** (`https://phiksniyar.in`) in production with high availability, persistent storage, and disaster recovery.

---

## 1. Supported Architecture Topologies

| Architecture | Database Engine | Recommended Host | Best For |
| :--- | :--- | :--- | :--- |
| **Option A (Recommended)** | SQLite with WAL Mode on Persistent Volume | **Railway / Render / Fly.io / VPS Docker** | Single-container, sub-millisecond local queries, zero external database fees, 100% cost control. |
| **Option B (Serverless)** | Managed Cloud PostgreSQL (Neon / Supabase) | **Vercel / AWS Amplify** | Stateless serverless edge; requires external database connection pooler. |

---

## 2. Option A: Docker Deployment with Persistent Volume (Recommended)

### Step 1: Multi-Stage Dockerfile Verification
The repository includes an optimized multi-stage `Dockerfile`:
```dockerfile
# Multi-stage production build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

# Expose Next.js default port
EXPOSE 3000
CMD ["npm", "start"]
```

### Step 2: Deploy to Railway / Render / VPS
1. **Repository:** Push `launch/48-hour-mvp` or merge into `main`.
2. **Persistent Volume:**
   - On Railway: Go to **Settings** → **Volumes** → **Add Volume** → Mount to `/app/data`.
   - On Render: Go to **Disks** → **Add Disk** → Mount path `/app/data` (Size: 1 GB+).
   - On VPS: Mount host directory: `-v /var/data/phiksniyar:/app/data`.
3. **Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=<generate_32_char_hex_secret>
   DATA_DIR=/app/data
   DATABASE_PATH=/app/data/phiksniyar.db
   NEXT_PUBLIC_APP_URL=https://phiksniyar.in
   PLATFORM_UPI_VPA=phiksniyar@upi
   PLATFORM_COMMISSION_PERCENT=10.0
   FAST2SMS_API_KEY=<optional_sms_key>
   RAZORPAY_KEY_ID=<optional_razorpay_key>
   RAZORPAY_KEY_SECRET=<optional_razorpay_secret>
   ```

---

## 3. Database Persistence & WAL Configuration

PhiksNiyar's database engine in `src/lib/db/database.ts` initializes SQLite with:
```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;
```
- **WAL Mode (Write-Ahead Logging):** Allows concurrent readers while a write is occurring.
- **Busy Timeout (5000ms):** Prevents `SQLITE_BUSY` errors during simultaneous write bursts.
- **Crash Safety:** Writes are committed to `-wal` and `-shm` companion files, guaranteeing atomicity across sudden restarts.

---

## 4. Production Health Checks

The server exposes a zero-leak health check endpoint:
```http
GET /api/health
```
**Healthy Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "engine": "sqlite",
  "timestamp": "2026-10-17T20:25:00.000Z"
}
```
If the database connection fails or the disk volume is full, the route returns `503 Service Unavailable`. Use this endpoint for container liveness/readiness probes.

---

## 5. Automated Backup & Recovery Runbook

### Automatic Daily Backup Script
Place this script at `/var/scripts/backup-phiksniyar.sh` on your VPS or schedule it as a cron task:

```bash
#!/bin/bash
# PhiksNiyar Production Database Backup Script
set -e

BACKUP_DIR="/var/backups/phiksniyar"
DB_SOURCE="/app/data/phiksniyar.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/phiksniyar_backup_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

# Perform safe live backup using SQLite online backup API
sqlite3 "$DB_SOURCE" ".backup '${BACKUP_FILE}'"

# Compress backup
gzip -9 "$BACKUP_FILE"

# Keep last 30 daily backups, delete older
find "$BACKUP_DIR" -name "phiksniyar_backup_*.db.gz" -mtime +30 -delete

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE}.gz"
```

### Disaster Recovery Procedure
In the event of server corruption or data loss:
1. Stop the application container: `docker stop phiksniyar-app`
2. Locate the most recent valid backup: `ls -lt /var/backups/phiksniyar/`
3. Uncompress to target path:
   ```bash
   gunzip -c /var/backups/phiksniyar/phiksniyar_backup_YYYYMMDD_HHMMSS.db.gz > /app/data/phiksniyar.db
   ```
4. Verify file integrity:
   ```bash
   sqlite3 /app/data/phiksniyar.db "PRAGMA integrity_check;"
   # Expected output: ok
   ```
5. Restart application container: `docker start phiksniyar-app`
6. Verify live health: `curl -I https://phiksniyar.in/api/health`

---

## 6. Post-Deployment Verification Steps

1. Open `https://phiksniyar.in` in an incognito window.
2. Confirm HTTPS certificate is valid.
3. Test customer OTP login with mobile number `+91 98480 22338`.
4. Perform a test booking for **Electrician** in **Kalamandir Center, Chilakaluripet**.
5. Switch to provider persona and confirm the booking alert appears.
6. Verify 4-digit Doorstep Start-OTP entry transitions the job to `IN_PROGRESS`.
7. Mark job complete and verify the **7-Day Warranty Record** is generated.
