# City Wallet

AI-powered city wallet that detects the most relevant local offer for a user in real time, generates it dynamically, and makes it redeemable through a simulated checkout.

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

API docs available at `http://localhost:8000/docs`

### API Endpoints

| Module | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| Context | `/api/context` | GET | Full context snapshot (weather, time, events, demand) |
| Context | `/api/context/weather` | GET | Weather data for a city |
| Context | `/api/context/events` | GET | Nearby events |
| Context | `/api/context/demand/{id}` | GET | Merchant transaction density |
| Offers | `/api/offers/generate` | POST | Generate a dynamic offer |
| Offers | `/api/offers/{id}` | GET | Get a generated offer |
| Merchants | `/api/merchants` | GET | List all merchants |
| Merchants | `/api/merchants/{id}/rules` | GET/PUT | Merchant rules |
| Merchants | `/api/merchants/{id}/dashboard` | GET | Merchant performance |
| Redemption | `/api/redemption/accept/{offer_id}` | POST | Accept offer, get QR token |
| Redemption | `/api/redemption/validate` | POST | Validate redemption token |
| Redemption | `/api/redemption/history` | GET | Merchant redemption history |

## Architecture

See [PLAN.md](./PLAN.md) for the full architecture and module breakdown.

## Tech Stack

- **Backend:** Python 3.11+ / FastAPI
- **LLM:** Claude API (offer generation)
- **Frontend:** React / React Native (planned)
- **Merchant Dashboard:** Next.js (planned)
