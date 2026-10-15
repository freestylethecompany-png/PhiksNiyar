# PHIKSNIYAR — Operations & Administrator Handbook
**Version:** 1.0.0  
**Target Market:** Chilakaluripet Operations Hub, Palnadu District, AP  
**Audience:** PhiksNiyar Operations, City Managers, and Support Engineers

---

## 1. Administrative Overview & Access Control

The PhiksNiyar Administration Suite (`/admin`) is restricted to personnel holding verified `ADMIN` or `SUPPORT` roles. 
- **Server-Authoritative RBAC:** Admin capabilities are verified server-side on every request using signed HTTP-only JWT sessions. Manipulating client-side storage or headers will yield `403 FORBIDDEN`.
- **Immutable Audit Logging:** Every administrative action (provider verification, manual booking override, dispute settlement, refund) is logged to the `audit_logs` table with actor ID, timestamp, and action metadata.

---

## 2. Provider Lifecycle & Verification Management

The city operations team is responsible for vetting every technician before they receive customer bookings:

```
[Applications Queue] -> Review trade experience, locality, and KYC hashes.
       |
       +--> Approve: Set status = 'VERIFIED' -> Active in 10-Factor Engine.
       +--> Reject:  Set status = 'REJECTED' -> Application archived.
       +--> Clarify: Set status = 'UNDER_REVIEW' -> Request trade certificate.
```

### Verification Checklist:
1. **Trade Competency:** Confirm at least 1 year of verifiable service in Chilakaluripet or surrounding mandals (Purushothapatnam, Pasumarru, Boppudi).
2. **Identity Verification:** Confirm identity using compliant KYC provider records. *Reminder:* Never upload unencrypted government ID cards to public storage.
3. **Emergency Contact & UPI:** Verify valid mobile number and active UPI VPA for settlement payouts.

---

## 3. Real-Time Booking Oversight & Intervention

The live bookings dashboard displays transactions across the 16-state lifecycle:
- **Matching Bottlenecks:** If a booking remains in `MATCHING` for $> 5$ minutes during business hours, the operations console alerts the dispatcher to manually route the job to an available verified pro.
- **Doorstep Verification Stalls:** If a booking is in `ARRIVED` for $> 10$ minutes without progressing to `IN_PROGRESS`, support reaches out to both customer and technician to resolve OTP exchange friction.
- **Emergency Cancellation:** In cases of severe weather or equipment failure, admins can cancel bookings and trigger instant refund credits.

---

## 4. Dispute Mediation Standard Operating Procedure (SOP)

When a customer or provider files a dispute under one of the 7 official categories:

| Dispute Category | Typical Cause | Operations SOP |
|---|---|---|
| `poor_service` | Incomplete cleaning or unresolved issue | Review initial job photos; schedule free inspection under 7-day warranty. |
| `wrong_price` | Technician charged extra without app approval | Check booking charge log; refund unapproved excess amount to customer. |
| `provider_no_show`| Technician marked arrived but wasn't present | Reassign immediately; penalize provider reliability score. |
| `damage` | Accidental property damage during repair | Escalate to City Manager; initiate damage claim assessment protocol. |
| `payment_issue` | UPI deducted but status didn't reflect | Run Razorpay payment status check in console; manually confirm order. |
| `warranty_issue` | Technician refused 7-day rework request | Reassign rework to alternate senior technician; issue warning to pro. |
| `safety_issue` | Unprofessional or abusive behavior | **Immediate provider suspension (`SUSPENDED`)** and incident investigation. |

---

## 5. 7-Day Warranty Administration

- **Eligibility Window:** Customers are entitled to free rework claims within 168 hours (7 days) of booking completion.
- **Workflow:** When a claim is received, the dashboard displays original technician notes and initial diagnosis.
- **Resolution:** The admin can either re-dispatch the original provider at ₹0 cost or assign an emergency backup pro if the original provider is unavailable.

---

## 6. System Health & Observability

Operations leads must monitor platform vitals:
- **Liveness Probe:** `GET /api/health` validates database connectivity and uptime.
- **Error Rates:** Monitored via structured logs; any spike in `400` or `500` codes triggers immediate alerting.
- **Backup Verification:** Ensure daily database snapshots are created and archived to external persistent storage.
