# City Wallet

City Wallet is a hackathon MVP for context-aware local offers. The phone runs the small language model (SLM) locally to draft personalized offer copy, then the FastAPI backend validates merchant policy, persists the canonical offer, and supports redemption.

## Quick Start

### Backend (FastAPI)

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys

uvicorn app.main:app --reload
```

API docs are available at `http://localhost:8000/docs`.

Sensitive merchant and redemption endpoints can be protected by setting `APP_API_KEY` and sending it as `X-API-Key`. `CORS_ALLOWED_ORIGINS` should list the frontend origins allowed to call the API.

### Mobile App (Expo)

```bash
npm install
npx expo start
```

Gateway defaults:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`
- Physical device: use your PC's LAN IP, for example `http://192.168.1.x:8000`

You can also set `EXPO_PUBLIC_GATEWAY_URL` before starting Expo. The app UI keeps the gateway URL editable for demos.

### Tests

```bash
cd backend
pytest
```

## Integrated Phone SLM Flow

```text
Device signals (GPS, preferences, movement)
        |
        v
Phone SLM drafts headline, body, discount, validity
        |
        v
Privacy gate strips raw GPS, movement, and preferences
        |
        v
POST /v1/offers/finalize
        |
        v
Backend checks merchant rules, clamps policy, persists offer
        |
        v
Existing redemption APIs accept and validate the offer
```

The mobile app posts this sanitized payload to the backend:

```json
{
  "session_id": "sess_demo",
  "client_pseudonym": "demo_user",
  "merchant_id": "cafe-luna",
  "intent_summary": "low_slow_browse_interested",
  "coarse_context": {
    "time_bucket": "lunch",
    "weather_bucket": "rainy",
    "area_bucket": "old_town",
    "demand_bucket": "low",
    "event_tags": ["local_fair"]
  },
  "local_model_output": {
    "headline": "Warm up at Cafe Luna",
    "body": "A cozy coffee break is waiting nearby.",
    "discount_pct": 12,
    "validity_minutes": 30
  },
  "gen_ui_draft": {
    "badge_text": "On-device draft"
  }
}
```

The backend endpoint `POST /v1/offers/finalize` returns the mobile response contract:

```json
{
  "trace_id": "trace-...",
  "offer_id": "offer-...",
  "headline": "Warm up at Cafe Luna",
  "body": "A cozy coffee break is waiting nearby.",
  "discount_pct": 12,
  "validity_minutes": 30,
  "valid_until": "2026-04-26T12:30:00+02:00",
  "gen_ui": {}
}
```

The server is authoritative for merchant existence, active status, maximum discount, validity bounds, offer IDs, expiry, and persistence. If the phone suggests a discount above the merchant's `max_discount_pct`, the backend clamps it.

## API Endpoints

| Module | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| Mobile SLM | `/v1/offers/finalize` | POST | Finalize phone-generated offer copy into a canonical backend offer |
| Context | `/api/context` | GET | Full context snapshot (weather, time, events, demand) |
| Context | `/api/context/weather` | GET | Weather data for a city |
| Context | `/api/context/events` | GET | Nearby events |
| Context | `/api/context/pois` | GET | Nearby OSM/local points of interest |
| Context | `/api/context/demand/{id}` | GET | Merchant transaction density |
| Offers | `/api/offers/generate` | POST | Backend-generated fallback/demo offer |
| Offers | `/api/offers/{id}` | GET | Get a generated or finalized offer |
| Merchants | `/api/merchants` | GET | List all merchants |
| Merchants | `/api/merchants/{id}/rules` | GET/PUT | Merchant rules |
| Merchants | `/api/merchants/{id}/dashboard` | GET | Merchant performance |
| Redemption | `/api/redemption/accept/{offer_id}` | POST | Accept offer, get QR token |
| Redemption | `/api/redemption/validate` | POST | Validate redemption token |
| Redemption | `/api/redemption/history` | GET | Merchant redemption history |

## Tech Stack

- **Backend:** Python 3.12 / FastAPI
- **Mobile:** React Native / Expo
- **SLM:** Mock heuristic mode today; native Phi-3 Mini path is scaffolded for `llama.rn`
- **Context APIs:** OpenWeatherMap, Tavily events search, OSM Overpass POIs, with local fallbacks
- **Persistence:** In-memory demo repositories seeded from JSON

## On-Device Model

The Expo app supports two SLM modes:

- `mock`: deterministic heuristics, no model file required.
- `native`: intended for Phi-3 Mini via `llama.rn`; this path still requires native dependency/model wiring.

The model file is not committed. When native mode is wired, place the downloaded GGUF at:

```text
assets/models/Phi-3-mini-4k-instruct-Q4_K_M.gguf
```

Set `EXPO_PUBLIC_STRICT_NATIVE_SLM=1` to disable fallback and fail loudly if native SLM execution fails.

## Privacy Contract

Raw device data should never leave the phone. The phone can use GPS, movement, and preference hints to build the prompt, but the network payload contains only coarse buckets and the local model output. Both the mobile app and backend reject obvious sensitive fields such as `lat`, `lng`, `location`, `movement_signature`, and `preference_hints` in the finalize payload.

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Demo UI: run SLM, preview coarse context, POST finalize |
| `src/api/finalizeClient.ts` | Mobile client for `POST /v1/offers/finalize` |
| `src/privacy/coarseContext.ts` | Builds privacy-safe finalize payload |
| `src/localModel/index.ts` | Mock/native SLM orchestration |
| `backend/app/routers/finalize.py` | Mobile SLM finalize endpoint |
| `backend/app/models/finalize.py` | Pydantic request/response contract |
| `backend/app/routers/redemption.py` | Accept and validate finalized offers |
| `backend/app/data/merchants.json` | Seed merchant rules |

## Runtime Notes

The current repositories are in-memory demo stores. Generated offers, merchant rule edits, redemption tokens, and history are lost when the process restarts.

Events use Tavily plus local stubs; Eventbrite is not part of the current runtime contract. Demand is simulated with deterministic local data rather than real Payone traffic.

See [PLAN.md](./PLAN.md) for the broader MVP architecture.

For container deployment:

```bash
cd backend
docker build -t city-wallet-backend .
docker run --env-file .env -p 8000:8000 city-wallet-backend
```
