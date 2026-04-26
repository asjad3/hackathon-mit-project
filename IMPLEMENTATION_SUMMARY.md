# Implementation Summary: Native SLM & Persistent Database

This document summarizes the implementation of native on-device SLM and persistent SQLite database for the City Wallet project.

---

## Part 1: Persistent SQLite Database

### What Was Implemented

1. **SQLAlchemy ORM Integration**
   - Added SQLAlchemy and Alembic to dependencies
   - Created database connection module (`backend/app/database/db.py`)
   - Created SQLAlchemy models for all entities

2. **Database Schema**
   - `merchants` - Merchant entities with rules and configuration
   - `offers` - Generated offers with lifecycle tracking
   - `tokens` - Redemption tokens for offers
   - `redemption_records` - Record of redeemed offers

3. **Repository Updates**
   - All repositories updated to use SQLAlchemy sessions
   - Added proper datetime handling for SQLite compatibility
   - Maintained backward compatibility with existing API contracts

4. **Database Migrations**
   - Initialized Alembic for version control
   - Created initial migration (`001_initial_schema.py`)
   - Migration applies automatically on startup

5. **Test Infrastructure**
   - Updated test fixtures to use isolated test database
   - All 13 tests passing

### Files Modified

**Backend:**
- `backend/requirements.txt` - Added SQLAlchemy and Alembic
- `backend/app/config.py` - Added database_url setting
- `backend/app/main.py` - Added database initialization on startup
- `backend/app/dependencies.py` - Added get_db_session dependency
- `backend/app/database/db.py` - New database connection module
- `backend/app/database/models.py` - New SQLAlchemy models
- `backend/app/database/seed.py` - New database seeding functions
- `backend/app/repositories/merchant_repository.py` - Updated to use SQLAlchemy
- `backend/app/repositories/offer_repository.py` - Updated to use SQLAlchemy
- `backend/app/repositories/redemption_repository.py` - Updated to use SQLAlchemy
- `backend/app/routers/*.py` - Updated all routers to use DB dependency
- `backend/tests/conftest.py` - Updated test fixtures for test database
- `backend/tests/test_api.py` - Updated tests to use client fixture

**Mobile:**
- No changes required for database integration

### Usage

**Running the backend:**
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

**Database will be created at:** `backend/city_wallet.db`

**Applying migrations manually:**
```bash
cd backend
.\venv\Scripts\activate
python -m alembic upgrade head
```

---

## Part 2: Native On-Device SLM

### What Was Implemented

1. **llama.rn Integration**
   - Installed `llama.rn` package for native LLM support
   - Configured for Phi-3 Mini model

2. **Model Configuration**
   - Created `src/localModel/modelConfig.ts` for model path management
   - Model file: `Phi-3-mini-4k-instruct-Q4_K_M.gguf`
   - Automatic copy from assets to document directory

3. **Native Bridge**
   - Created `src/localModel/llamaRunner.ts` for native inference
   - Registered on `globalThis.__CITY_WALLET_NATIVE_SLM__`
   - Proper error handling and resource management

4. **Updated SLM Orchestration**
   - Enhanced `src/localModel/index.ts` with native initialization
   - Added `initNativeSLM()` function for async initialization
   - Fail loudly mode enabled via `EXPO_PUBLIC_STRICT_NATIVE_SLM=1`

5. **App UI Updates**
   - Added native SLM initialization status indicator
   - Graceful error handling for model loading failures

### Files Modified

**Mobile:**
- `src/localModel/modelConfig.ts` - New model configuration module
- `src/localModel/llamaRunner.ts` - New native bridge implementation
- `src/localModel/index.ts` - Updated with native initialization
- `src/localModel/nativeSlm.ts` - Updated error handling
- `App.tsx` - Added native SLM initialization on mode switch
- `assets/models/` - Created directory for model files

**Backend:**
- No changes required for native SLM integration

### Model File Setup

**Required:**
1. Download Phi-3 Mini 4K Instruct Q4_K_M GGUF model from HuggingFace
2. Place at: `assets/models/Phi-3-mini-4k-instruct-Q4_K_M.gguf`
3. Model size: ~2.2GB

**Model Source:**
- HuggingFace: TheBloke/Phi-3-mini-4k-instruct-GGUF
- File: `Phi-3-mini-4k-instruct-Q4_K_M.gguf`

### Usage

**Running the mobile app:**
```bash
npm install
npx expo start
```

**Native SLM Modes:**
- `mock` - Deterministic heuristics (default, works everywhere)
- `native` - Real Phi-3 Mini model (requires model file)

**Strict Mode:**
Set `EXPO_PUBLIC_STRICT_NATIVE_SLM=1` in `.env` to fail loudly if native SLM fails.

---

## Architecture Changes

### Before
```
In-Memory Repositories
  ├─ merchants (dict)
  ├─ offers (dict)
  ├─ tokens (dict)
  └─ records (list)
```

### After
```
SQLite Database (city_wallet.db)
  ├─ merchants table
  ├─ offers table
  ├─ tokens table
  └─ redemption_records table
```

### SLM Flow
```
Mobile App
  ├─ Device Signals (GPS, time, prefs)
  ├─ On-Device SLM (mock/native)
  └─ Privacy Gate
       └─ POST /v1/offers/finalize
            └─ Backend (FastAPI)
                 ├─ Merchant Validation
                 ├─ Policy Clamping
                 └─ SQLite Persistence
```

---

## Testing

All 13 tests passing:
- ✅ test_health
- ✅ test_context_defaults_to_supported_zone
- ✅ test_context_rejects_oversized_poi_radius
- ✅ test_offer_generation_and_fetch
- ✅ test_offer_generation_returns_404_outside_zone
- ✅ test_finalize_creates_offer_matching_mobile_contract
- ✅ test_finalize_clamps_discount_to_merchant_rules
- ✅ test_finalize_rejects_unknown_or_inactive_merchant
- ✅ test_finalize_rejects_sensitive_fields
- ✅ test_finalized_offer_can_enter_redemption_flow
- ✅ test_accept_validate_history_and_dashboard
- ✅ test_api_key_required_when_configured
- ✅ test_expired_token_cannot_be_redeemed

---

## Key Decisions

1. **SQLite for MVP**
   - Simple file-based database
   - No external dependencies
   - Easy to migrate to PostgreSQL later

2. **Fail Loudly for Native SLM**
   - `EXPO_PUBLIC_STRICT_NATIVE_SLM=1` ensures errors are visible
   - Prevents silent fallback to mock mode in production

3. **Datetime Handling**
   - SQLite requires Python datetime objects, not ISO strings
   - Added conversion functions in repositories

4. **Test Database Isolation**
   - Each test gets a fresh temporary database
   - Proper dependency injection for FastAPI

---

## Next Steps

1. **Native SLM Model**
   - Download and place Phi-3 Mini model in `assets/models/`
   - Test native inference on device

2. **Production Database**
   - Consider PostgreSQL for production
   - Add backup and migration strategies

3. **Performance Optimization**
   - Add database indexes
   - Implement connection pooling

4. **Mobile GPS Integration**
   - Add real location services
   - Replace mock signals with real device data

---

## Troubleshooting

### Database Issues

**Migration conflicts:**
```bash
cd backend
python -m alembic downgrade -1
python -m alembic upgrade head
```

**Reset database:**
```bash
rm backend/city_wallet.db
python -m alembic upgrade head
```

### Native SLM Issues

**Model not found:**
- Ensure `Phi-3-mini-4k-instruct-Q4_K_M.gguf` is in `assets/models/`
- Check file permissions

**Native bridge not initialized:**
- Call `initNativeSLM()` before using native mode
- Check console for initialization errors

**Fallback to mock mode:**
- Check `EXPO_PUBLIC_STRICT_NATIVE_SLM` setting
- Review console logs for errors

---

## File Structure

```
backend/
├── app/
│   ├── database/
│   │   ├── db.py              # Database connection
│   │   ├── models.py          # SQLAlchemy models
│   │   └── seed.py            # Database seeding
│   ├── repositories/
│   │   ├── merchant_repository.py
│   │   ├── offer_repository.py
│   │   └── redemption_repository.py
│   └── routers/
│       └── [all updated with DB dependency]
├── alembic/                   # Database migrations
├── alembic.ini
└── city_wallet.db            # SQLite database (created on first run)

mobile/
├── src/
│   ├── localModel/
│   │   ├── modelConfig.ts     # Model path management
│   │   ├── llamaRunner.ts     # Native bridge
│   │   ├── index.ts           # SLM orchestration
│   │   └── nativeSlm.ts       # Native SLM interface
│   └── ...
└── assets/
    └── models/               # Model files (not in Git)
        └── Phi-3-mini-4k-instruct-Q4_K_M.gguf (download separately)
```

---

## Summary

✅ **Database:** SQLite with SQLAlchemy ORM, Alembic migrations, all tests passing
✅ **Native SLM:** llama.rn integration with Phi-3 Mini, fail loudly mode enabled
✅ **Backward Compatible:** All existing API endpoints work unchanged
✅ **Test Coverage:** 13/13 tests passing

The implementation is complete and ready for use!
