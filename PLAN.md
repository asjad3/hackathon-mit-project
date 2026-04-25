# CITY WALLET — MVP Build Plan

## Vision
An AI-powered city wallet that detects the most relevant local offer for a user in real time, generates it dynamically via GenUI, and makes it redeemable through a simulated checkout. Offers don't exist until the moment they're needed.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  User's Phone (React Native / Web Demo)             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Geofencing│  │On-device SLM │  │ Offer Card   │  │
│  │Zone enter│  │Phi-3 (local) │  │ GenUI widget │  │
│  └──────────┘  └──────────────┘  └──────────────┘  │
│         only abstract "intent" leaves device        │
└────────────────────┬────────────────────────────────┘
                     │ intent + location zone
                     ▼
┌─────────────────────────────────────────────────────┐
│  Python Backend — FastAPI                           │
│  ┌───────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │Context Assembly│ │Offer Engine│ │Redemption API│ │
│  │Weather+Events │ │Claude/LLM  │ │QR + Tokens   │ │
│  │+Payone+Time   │ │GenUI calls │ │Validation    │ │
│  └───────────────┘ └────────────┘ └──────────────┘ │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│OpenWeather│  │Eventbrite│  │Payone Sim│
│  API     │  │  API     │  │+ OSM/Maps│
└──────────┘  └──────────┘  └──────────┘

┌─────────────────────────────────────────────────────┐
│  Merchant Dashboard (Next.js / static mockup)       │
│  ┌───────────────┐  ┌────────────────────────────┐  │
│  │ Rules Setup   │  │ Live Dashboard             │  │
│  │ Goals+Discnts │  │ Redemptions + Performance  │  │
│  └───────────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Module Breakdown

### Module 01 — Context Sensing Layer
**Goal:** Aggregate real-time context signals into a composite context state.

| Signal | Source | Implementation |
|--------|--------|---------------|
| Weather | OpenWeatherMap API | Real API call, cached 10min |
| Time | System clock | Time-of-day bucketing (morning/lunch/afternoon/evening/night) |
| Location | Geofencing zones | Simulated zones for MVP; lat/lng → zone mapping |
| Local Events | Eventbrite API (or stub) | Upcoming events within radius |
| Transaction Density | Payone simulation | Synthetic feed: merchant txn volume per 15min window |

**Output:** `ContextState` object:
```json
{
  "weather": { "condition": "rain", "temp_c": 12 },
  "time_bucket": "tuesday_afternoon",
  "zone": { "id": "zone-altstadt", "merchants": ["cafe-luna", "pizza-roma"] },
  "events": [{ "name": "City Jazz Festival", "distance_km": 0.3 }],
  "demand": { "cafe-luna": { "volume": "low", "vs_avg": -40 } }
}
```

**Key endpoints:**
- `GET /api/context?lat={lat}&lng={lng}` — full context snapshot
- `GET /api/context/weather?city={city}` — weather only
- `GET /api/context/events?lat={lat}&lng={lng}&radius_km={r}` — events
- `GET /api/context/demand?merchant_id={id}` — txn density

---

### Module 02 — Generative Offer Engine
**Goal:** Given a context state + merchant rules, generate a complete offer dynamically.

**Merchant rules (stored in config/DB):**
```json
{
  "merchant_id": "cafe-luna",
  "name": "Café Luna",
  "rules": {
    "max_discount_pct": 20,
    "goal": "fill_quiet_hours",
    "quiet_hours": ["14:00-17:00"],
    "budget_daily_eur": 50,
    "product_categories": ["coffee", "pastries"]
  }
}
```

**LLM call:** Send context + rules → receive:
- Offer headline & body copy (tone-matched to context)
- Discount parameters (within merchant bounds)
- Visual style hints (color palette, emoji, mood)
- Urgency/timing framing

**Key endpoints:**
- `POST /api/offers/generate` — generate offer for user+context
- `GET /api/offers/{offer_id}` — retrieve generated offer
- `GET /api/merchants/{id}/rules` — merchant rules
- `PUT /api/merchants/{id}/rules` — update merchant rules

---

### Module 03 — Seamless Checkout & Redemption
**Goal:** End-to-end flow from offer → QR/token → simulated checkout → cashback.

**Flow:**
1. User taps "Accept Offer" → backend creates redemption token
2. QR code generated with embedded token
3. Merchant scans QR → backend validates token (one-time use)
4. Simulated checkout applies discount
5. Transaction logged → merchant dashboard updated

**Key endpoints:**
- `POST /api/offers/{offer_id}/accept` — accept offer, get QR token
- `POST /api/redemption/validate` — merchant validates QR token
- `GET /api/redemption/history?merchant_id={id}` — redemption log
- `GET /api/merchants/{id}/dashboard` — performance summary

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.11+ / FastAPI |
| LLM (server-side) | Claude API / OpenAI API |
| SLM (on-device) | Phi-3 mini (simulated for MVP) |
| Database | SQLite (MVP) → PostgreSQL |
| Weather API | OpenWeatherMap |
| Events API | Eventbrite / stub data |
| Payments sim | Payone stub with synthetic data |
| Frontend (user) | React / React Native (web demo) |
| Frontend (merchant) | Next.js dashboard (mostly mockup) |
| QR Codes | `qrcode` Python library |

---

## Project Structure

```
city-wallet/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Settings & env vars
│   │   ├── models/
│   │   │   ├── context.py       # Context state models
│   │   │   ├── offer.py         # Offer models
│   │   │   ├── merchant.py      # Merchant & rules models
│   │   │   └── redemption.py    # Redemption/token models
│   │   ├── routers/
│   │   │   ├── context.py       # /api/context routes
│   │   │   ├── offers.py        # /api/offers routes
│   │   │   ├── merchants.py     # /api/merchants routes
│   │   │   └── redemption.py    # /api/redemption routes
│   │   ├── services/
│   │   │   ├── weather.py       # OpenWeatherMap integration
│   │   │   ├── events.py        # Eventbrite / stub events
│   │   │   ├── demand.py        # Payone txn density sim
│   │   │   ├── context_engine.py # Assembles full context
│   │   │   ├── offer_engine.py  # LLM-based offer generation
│   │   │   └── redemption.py    # Token generation & validation
│   │   └── data/
│   │       ├── merchants.json   # Seed merchant data
│   │       ├── zones.json       # Geofence zone definitions
│   │       └── events_stub.json # Stub event data
│   ├── requirements.txt
│   └── .env.example
├── frontend/                    # (future) React/RN app
├── merchant-dashboard/          # (future) Next.js merchant UI
├── PLAN.md
└── README.md
```

---

## Phase Plan

| Phase | What | Priority |
|-------|------|----------|
| **Phase 0** | Boilerplate: FastAPI + project structure + venv | NOW |
| **Phase 1** | Context Sensing Layer — weather + time + location zones | High |
| **Phase 2** | Merchant data models + rules config | High |
| **Phase 3** | Generative Offer Engine — LLM integration | High |
| **Phase 4** | Redemption flow — tokens + QR + validation | High |
| **Phase 5** | Frontend — mobile-first offer card UI | High |
| **Phase 6** | Merchant dashboard (mockup/functional) | Medium |
| **Phase 7** | On-device SLM simulation (privacy layer) | Medium |
| **Phase 8** | Polish, demo script, presentation | High |

---

## Configuration-Driven Design
All city-specific parameters are config, not code:
- Weather API city parameter
- Geofence zone definitions (JSON)
- Merchant list and rules (JSON/DB)
- Event API region filter
- Currency, language, timezone
