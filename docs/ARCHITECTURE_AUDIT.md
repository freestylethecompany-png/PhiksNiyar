# PHIKSNIYAR — ARCHITECTURE AUDIT REPORT (Phase 0)
**Product:** PhiksNiyar (ఫిక్స్ నియర్)  
**Location:** Chilakaluripet, Andhra Pradesh, India  
**Date:** October 2026  
**Auditor:** Principal Software & Systems Architect  
**Status:** Remediated & Documented  

---

## 1. System Architectural Overview
PhiksNiyar is designed as a high-performance, resilient hyperlocal marketplace platform. The architecture decouples client presentation from server-authoritative transaction execution:
- **Presentation:** Next.js 16 (React 19, Turbopack) with bilingual (Telugu & English) UI.
- **API Boundary:** Strict Next.js Route Handlers with request validation, session authentication, and rate limiting.
- **Transaction Engine:** Authoritative 16-state booking lifecycle engine and 6-stage provider verification state machine.
- **Persistence Layer:** Persistent WAL SQLite for low-latency edge/container environments with dual-support for Cloud Managed PostgreSQL (Supabase / RDS).
- **AI Processing:** Structured intent extraction with server-side validation; AI engines never directly touch database execution.

---

## 2. Architectural Audit Register

### ARCH-01: Booking State Machine Granularity & Transition Completeness
- **Issue:** Booking lifecycle previously had compressed states (`REQUESTED` directly to `ACCEPTED`), lacking intermediate matching, price confirmation, and warranty states.
- **Severity:** HIGH
- **Affected File:** `src/lib/db/stateMachine.ts`, `src/lib/db/types.ts`
- **Reason:** Real transactional marketplace requires 16 formal states to reflect physical technician dispatch, quote confirmation, and post-service warranty.
- **Recommended Fix:** Expand state machine to formal 16 states:
  `REQUESTED`, `MATCHING`, `PENDING_PROVIDER`, `ACCEPTED`, `ON_THE_WAY`, `ARRIVED`, `OTP_PENDING`, `IN_PROGRESS`, `AWAITING_PRICE_CONFIRMATION`, `AWAITING_PAYMENT`, `COMPLETED`, `CANCELLED`, `DISPUTED`, `WARRANTY_ACTIVE`, `WARRANTY_CLAIMED`, `CLOSED`.
- **Implementation Status:** RESOLVED. Formal state transitions enforced server-side.

### ARCH-02: AI Boundary & Injection Isolation
- **Issue:** Potential risk of AI models attempting tool calls or generating arbitrary database execution parameters.
- **Severity:** HIGH
- **Affected File:** `src/lib/ai/localNLP.ts`, `src/app/api/ai/parse/route.ts`
- **Reason:** Large Language Models and NLP parsers must never be granted direct database execution privileges.
- **Recommended Fix:** Architect AI strictly as an intent parser that emits validated JSON:
  `{ category, subcategory, issue, urgency, preferredDate, preferredTime, detectedLanguage }`.
  The server validates this payload before invoking the deterministic matching engine.
- **Implementation Status:** RESOLVED. AI acts strictly as an untrusted intent classifier; server performs all matching and filtering.

### ARCH-03: Dual Database Topology (WAL SQLite & PostgreSQL)
- **Issue:** Containerized persistent deployments (Docker/VPS) need zero-latency local disk storage, while serverless deployments (Vercel) need remote PostgreSQL.
- **Severity:** MEDIUM
- **Affected File:** `src/lib/db/database.ts`, `schema.sql`
- **Reason:** Different hosting environments have distinct persistence primitives.
- **Recommended Fix:** Implement WAL mode SQLite with graceful directory fallbacks for container volumes (`/app/data`), and maintain a mirrored 100% compliant PostgreSQL schema (`schema.sql`) for Supabase/Neon migrations.
- **Implementation Status:** RESOLVED. Dual-topology architecture verified.

### ARCH-04: Doorstep OTP Handshake Architecture
- **Issue:** Synchronization between technician physical presence and service commencement.
- **Severity:** HIGH
- **Affected File:** `src/app/api/bookings/route.ts`, `src/lib/security/cryptoUtils.ts`
- **Reason:** Without an authenticated arrival handshake, providers could claim false arrivals or initiate work prematurely.
- **Recommended Fix:** Cryptographic 4-digit code generated upon booking creation, displayed strictly on customer screen, submitted by technician upon arrival, verified server-side, and deleted upon successful start.
- **Implementation Status:** RESOLVED. Fully integrated into `IN_PROGRESS` transition.

### ARCH-05: Real-Time Live Location Tracking Architecture
- **Issue:** Tracking technicians via Server-Sent Events (SSE) must protect technician off-duty privacy and customer address privacy.
- **Severity:** HIGH
- **Affected File:** `src/app/api/tracking/[orderId]/route.ts`, `src/lib/tracking/deliveryTrackingService.ts`
- **Reason:** Exposing continuous GPS coordinates when a technician is offline or unassigned violates privacy.
- **Recommended Fix:** Restrict location streaming strictly to active assigned orders (`ON_THE_WAY` and `ARRIVED`). Close SSE stream immediately upon order completion or cancellation.
- **Implementation Status:** RESOLVED. Privacy-gated SSE tracking active.

### ARCH-06: Centralized System Health Endpoint
- **Issue:** Lack of a standardized health check endpoint for container orchestrators (Kubernetes/Docker) and uptime monitors.
- **Severity:** MEDIUM
- **Affected File:** `src/app/api/health/route.ts`
- **Reason:** Production monitoring requires unauthenticated liveness probes that verify database connectivity without leaking internal metadata.
- **Recommended Fix:** Implement `GET /api/health` returning status `healthy`, database ping, memory usage, uptime, and current timestamp.
- **Implementation Status:** RESOLVED. Health route active.

---

## 3. Component Interaction Matrix
```
[Client / Mobile Browser]
       │
  (HTTPS / WSS)
       ▼
[Next.js API Gateway (Auth & Rate Limit)]
       │
  ┌────┴──────────────────────────┬─────────────────────────┐
  ▼                               ▼                         ▼
[Auth & Identity Service]    [Booking State Machine]    [AI Matching Engine]
  │                               │                         │
  ├─ Phone OTP & Session          ├─ 16 Canonical States    ├─ Local NLP & Intent
  └─ Salted Hash Identity         ├─ Doorstep OTP Handshake └─ 10-Factor Ranking
                                  ├─ Server Pricing Engine
                                  └─ 7-Day Warranty Module
                                          │
                                          ▼
                               [Persistent WAL DB / Supabase]
```
