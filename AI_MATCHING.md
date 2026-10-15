# SEVANTA — AI Intent & 10-Factor Provider Matching Engine
**Version:** 1.0.0  
**Initial Market:** Chilakaluripet, AP (PIN: 522616)

---

## 1. Architectural Philosophy

At Sevanta, **AI is an intent-parsing assistant, NOT an autonomous database operator**.
- AI models process user natural language (English, Telugu, and Tanglish) to extract structured service parameters.
- AI models **NEVER** have direct database read/write connections, shell execution privileges, or financial decision authority.
- Final provider matching and ranking is executed by a **deterministic, server-controlled 10-factor algorithm**.

```
[Customer Natural Language Query]
  (e.g., "మా ఇంట్లో AC cooling రావట్లేదు, సాయంత్రం 5 కి ఎవరైనా వస్తారా?")
          |
          v
[AI Intent Extraction Pipeline]
  - Bilingual entity extraction (Telugu + English)
  - Urgency & time window identification
          |
          v
[Structured Validated JSON]
  {
    "service_category": "ac_repair",
    "problem": "insufficient_cooling",
    "locality": "Chilakaluripet",
    "preferred_slot": "17:00-19:00"
  }
          |
          v
[Server-Side 10-Factor Ranking Engine]
  - Filter: verification_status = 'VERIFIED' AND is_available = TRUE
  - Calculate deterministic score across 10 factors
          |
          v
[Ordered Provider Match List]
```

---

## 2. The 10-Factor Deterministic Ranking Equation

Every verified provider in the requested category is assigned a score from `0.00` to `100.00`:

$$\text{Final Score} = \sum_{i=1}^{10} (S_i \times W_i)$$

| Factor | Factor Name | Weight ($W_i$) | Metric & Calculation |
|---|---|:---:|---|
| **$S_1$** | **Category Match** | **30%** | Binary 1.0 if category is verified in provider's certified trades; 0.0 otherwise. |
| **$S_2$** | **Geodesic Proximity** | **20%** | Haversine distance between customer location and provider base: $\max(0, 1 - \frac{\text{dist (km)}}{15})$. |
| **$S_3$** | **Real-Time Availability** | **15%** | 1.0 if actively on shift and currently assigned $< 2$ active bookings; 0.0 if off-duty. |
| **$S_4$** | **Verified Rating** | **10%** | Bayesian rating score: $\frac{R \cdot v + C \cdot m}{v + m}$ normalized to $[0, 1]$. |
| **$S_5$** | **Completion Rate** | **10%** | Ratio of successfully completed jobs: $\frac{\text{completed}}{\text{accepted}} \in [0, 1]$. |
| **$S_6$** | **Response Velocity** | **5%** | Average minutes taken to accept dispatch offers (faster response = higher score). |
| **$S_7$** | **Dispute / Cancel Ratio** | **5%** | Inverted dispute rate: $1.0 - \frac{\text{disputes} + \text{provider\_cancels}}{\text{total\_jobs}}$. |
| **$S_8$** | **Workload Balancing** | **2.5%** | Equalization factor penalizing providers already holding multiple jobs today. |
| **$S_9$** | **Locality Familiarity** | **2.5%** | Bonus for providers residing in the exact Chilakaluripet ward or street. |
| **$S_{10}$**| **Language Parity** | **2.5%** | Match between customer language preference (Telugu / English) and provider fluency. |

---

## 3. Bilingual Intent Parsing

### 3.1 Pure Telugu Input
- **Input:** `"మా వాషింగ్ మెషీన్ నుంచి నీళ్లు కారుతున్నాయి. అర్జెంట్ గా రిపేర్ చేయాలి."`
- **Parsed Category:** `washing_machine_repair`
- **Extracted Problem:** `water_leakage`
- **Urgency:** `high`

### 3.2 Spoken Tanglish Input
- **Input:** `"Maa fridge lo freezer ice kattadam ledu, repu morning evaraina vastara?"`
- **Parsed Category:** `refrigerator_repair`
- **Extracted Problem:** `freezer_not_cooling`
- **Urgency:** `scheduled_tomorrow_morning`

---

## 4. AI Safety & Sandboxing Guarantees

1. **Untrusted Input Sanitization:** All text inputs are filtered through character bounds and prompt injection guards before model submission.
2. **Zero System Secret Injection:** The system prompt contains no API keys, credentials, or internal schema identifiers.
3. **No Dynamic Execution:** The LLM's only permissible output format is strict JSON obeying the predefined intent schema. Unparseable outputs trigger a deterministic regex keyword fallback.
4. **Offline Resilience:** If the AI service is unavailable or times out (>1500ms), the system seamlessly falls back to local keyword parsing without failing customer requests.
