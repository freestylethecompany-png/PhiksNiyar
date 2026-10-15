# SEVANTA — Production API Specification
**Version:** 1.0.0  
**Base URL:** `https://your-domain.com/api` (Production) / `http://localhost:3000/api` (Development)  
**Standard Response Envelope:**
```json
{
  "success": true,
  "data": { ... }
}
```
**Standard Error Envelope:**
```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable message describing the error."
  }
}
```

---

## 1. Authentication APIs (`/api/auth`)

### 1.1 Request OTP
Initiates mobile verification. Generates a 6-digit cryptographic OTP sent via SMS.
- **Endpoint:** `POST /api/auth/send-otp`
- **Auth Required:** No (Public)
- **Rate Limit:** 3 requests per 10 minutes per IP/Phone.
- **Request Body:**
  ```json
  {
    "phone": "9876543210"
  }
  ```
- **Responses:**
  - `200 OK`: `{"success": true, "message": "OTP sent successfully"}`
  - `429 Too Many Requests`: `{"error": {"code": "RATE_LIMITED", "message": "Too many requests. Please wait before retrying."}}`

---

### 1.2 Verify OTP & Authenticate
Verifies the submitted OTP, provisions user profile if new, and sets an HTTP-only secure JWT cookie.
- **Endpoint:** `POST /api/auth/verify-otp`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "phone": "9876543210",
    "otp": "123456",
    "name": "Ravi Kumar",
    "role": "CUSTOMER"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "user": {
        "id": "usr_9f82bc",
        "phone": "9876543210",
        "name": "Ravi Kumar",
        "role": "CUSTOMER"
      }
    }
    ```
  - `400 Bad Request`: `{"error": {"code": "INVALID_OTP", "message": "Invalid or expired OTP."}}`

---

### 1.3 Get Current Session User
Returns the authenticated profile of the user currently logged in.
- **Endpoint:** `GET /api/auth/me`
- **Auth Required:** Yes (`sevanta_session` cookie)
- **Responses:**
  - `200 OK`: `{"user": {"id": "usr_9f82bc", "name": "Ravi Kumar", "role": "CUSTOMER", ...}}`
  - `401 Unauthorized`: `{"error": {"code": "UNAUTHORIZED", "message": "Authentication required."}}`

---

### 1.4 Logout
Clears the session cookie and terminates active session state.
- **Endpoint:** `POST /api/auth/logout`
- **Auth Required:** No
- **Responses:**
  - `200 OK`: `{"success": true, "message": "Logged out successfully"}`

---

## 2. Bookings & Lifecycle APIs (`/api/bookings`)

### 2.1 List Bookings
Retrieves bookings scoped to the authenticated caller with strict tenant isolation and address masking.
- **Endpoint:** `GET /api/bookings`
- **Auth Required:** Yes
- **Behavior:**
  - `CUSTOMER`: Returns only bookings where `customerId == user.id`. Full address visible.
  - `PROVIDER`: Returns only assigned bookings where `providerId == user.id`. Full address is masked until booking status is `ACCEPTED`, `ON_THE_WAY`, `ARRIVED`, or `IN_PROGRESS`.
  - `ADMIN`: Returns all bookings.
- **Query Parameters:** `?status=IN_PROGRESS` (optional filter).
- **Responses:**
  - `200 OK`: `{"bookings": [...]}`

---

### 2.2 Create Booking
Initializes a new service transaction.
- **Endpoint:** `POST /api/bookings`
- **Auth Required:** Yes (`CUSTOMER` role)
- **Request Body:**
  ```json
  {
    "serviceCategory": "ac_repair",
    "serviceName": "AC Deep Cleaning & Gas Check",
    "customerAddress": "Flat 201, Srinivasa Heights, Kalamandir Road",
    "customerLocality": "Kalamandir Center, Chilakaluripet",
    "customerLat": 16.0892,
    "customerLng": 80.1672,
    "problemDescription": "AC cooling is weak and making buzzing noise",
    "scheduledDate": "2026-10-10",
    "scheduledTimeSlot": "10:00 - 12:00",
    "providerId": "prv_48a12c"
  }
  ```
- **Responses:**
  - `201 Created`: `{"booking": {"id": "ord_882910", "status": "REQUESTED", "basePrice": 399, ...}}`

---

### 2.3 Transition Booking State
Executes a verified state transition along the 16-state transaction machine.
- **Endpoint:** `PATCH /api/bookings`
- **Auth Required:** Yes
- **Supported Actions:**
  - `accept`: Provider accepts booking (`REQUESTED` -> `ACCEPTED`). Full address unlocked.
  - `arrive`: Provider arrives at site (`ON_THE_WAY` -> `ARRIVED`). Generates 4-digit Doorstep OTP.
  - `startOtp`: Technician enters verbal OTP (`ARRIVED` -> `IN_PROGRESS`). OTP destroyed upon success.
    - Payload: `{"bookingId": "...", "action": "startOtp", "otp": "4912"}`
  - `proposeAdditionalCharges`: Technician quotes extra parts/labor. (`IN_PROGRESS` -> `AWAITING_PRICE_CONFIRMATION`).
    - Payload: `{"bookingId": "...", "action": "proposeAdditionalCharges", "additionalCharges": 250, "reason": "Capacitor replacement"}`
  - `approveAdditionalCharges`: Customer approves quote (`AWAITING_PRICE_CONFIRMATION` -> `IN_PROGRESS`).
    - Payload: `{"bookingId": "...", "action": "approveAdditionalCharges"}`
  - `reportCashPayment`: Provider declares cash collected (`AWAITING_PAYMENT` -> `CASH_REPORTED`).
    - Payload: `{"bookingId": "...", "action": "reportCashPayment", "amount": 649}`
  - `confirmCashPayment`: Customer or Admin verifies cash (`CASH_REPORTED` -> `COMPLETED`). Activates 7-day warranty.
    - Payload: `{"bookingId": "...", "action": "confirmCashPayment"}`
  - `cancel`: Cancels booking if in permissible prior state.
- **Responses:**
  - `200 OK`: `{"booking": { ...updatedBooking }}`
  - `400 Bad Request`: `{"error": {"code": "INVALID_STATE_TRANSITION", "message": "Cannot transition from COMPLETED to REQUESTED"}}`
  - `403 Forbidden`: `{"error": {"code": "FORBIDDEN", "message": "Only customer can approve price quotes"}}`

---

## 3. Post-Service Protection APIs (`/api/warranty` & `/api/disputes`)

### 3.1 Claim 7-Day Warranty
Files a free rework claim under the Sevanta 7-Day Guarantee.
- **Endpoint:** `POST /api/warranty`
- **Auth Required:** Yes (`CUSTOMER` role)
- **Request Body:**
  ```json
  {
    "bookingId": "ord_882910",
    "issueDescription": "AC started leaking water 3 days after cleaning"
  }
  ```
- **Validation:** Server verifies `current_time <= warranty_valid_until` and booking belongs to customer.
- **Responses:**
  - `200 OK`: `{"success": true, "warranty": {"id": "war_991823", "status": "CLAIMED"}}`
  - `400 Bad Request`: `{"error": {"code": "WARRANTY_EXPIRED", "message": "The 7-day warranty period for this service has ended."}}`

---

### 3.2 File Dispute
Escalates an issue to Sevanta Operations.
- **Endpoint:** `POST /api/disputes`
- **Auth Required:** Yes (`CUSTOMER` or `PROVIDER`)
- **Request Body:**
  ```json
  {
    "bookingId": "ord_882910",
    "category": "poor_service",
    "description": "Technician damaged the AC plastic frame during installation."
  }
  ```
- **Valid Categories:** `poor_service`, `wrong_price`, `provider_no_show`, `damage`, `payment_issue`, `warranty_issue`, `safety_issue`.
- **Responses:**
  - `201 Created`: `{"success": true, "dispute": {"id": "dsp_77210", "status": "OPEN"}}`

---

### 3.3 Admin Dispute Resolution
Resolves or closes an active dispute with mediation notes.
- **Endpoint:** `PATCH /api/disputes`
- **Auth Required:** Yes (`ADMIN` role)
- **Request Body:**
  ```json
  {
    "disputeId": "dsp_77210",
    "status": "RESOLVED",
    "resolutionNotes": "Provider agreed to replace damaged frame; ₹200 refunded to customer wallet."
  }
  ```

---

## 4. Payment APIs (`/api/payments/razorpay`)

### 4.1 Create Razorpay Order
Initializes a server-side payment order.
- **Endpoint:** `POST /api/payments/razorpay/create-order`
- **Auth Required:** Yes
- **Request Body:** `{"bookingId": "ord_882910"}`
- **Responses:**
  - `200 OK`: `{"orderId": "order_Rz910a", "amount": 64900, "currency": "INR"}`

---

### 4.2 Verify Razorpay Signature
Validates HMAC-SHA256 signature from Razorpay checkout.
- **Endpoint:** `POST /api/payments/razorpay/verify`
- **Auth Required:** Yes (`CUSTOMER` or `ADMIN`)
- **Request Body:**
  ```json
  {
    "bookingId": "ord_882910",
    "razorpay_payment_id": "pay_982bca",
    "razorpay_order_id": "order_Rz910a",
    "razorpay_signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
  ```
- **Responses:**
  - `200 OK`: `{"success": true, "paymentStatus": "PAID"}`
  - `400 Bad Request`: `{"error": {"code": "INVALID_SIGNATURE", "message": "HMAC signature verification failed."}}`

---

## 5. Health & Diagnostic API (`/api/health`)

- **Endpoint:** `GET /api/health`
- **Auth Required:** No (Public Probe)
- **Response:**
  ```json
  {
    "status": "healthy",
    "product": "PhiksNiyar (ఫిక్స్ నియర్)",
    "timestamp": "2026-10-08T19:35:00.000Z",
    "uptimeSeconds": 1420,
    "environment": "production",
    "database": {
      "connected": true,
      "engine": "sqlite-wal"
    }
  }
  ```
