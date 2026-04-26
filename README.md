# City Wallet Mobile — On-Device SLM (Module 02)

React Native / Expo app for the local AI portion of Challenge Module 02.

Runs **Phi-3 Mini** on-device via `llama.rn`. Generates offer text, discount parameters,
and tone framing locally — only privacy-safe coarse buckets are sent upstream.

---

## What this module does

```
FastAPI context bundle
        │
        ▼
  React Native app
        │
        ▼
  Phi-3 Mini (on-device, llama.rn)   ← your phone, nothing leaves here
  builds: headline, body, discount_pct, validity_minutes
        │
        ▼
  Privacy gate (strips GPS, prefs, movement)
        │
        ▼
  POST /v1/offers/finalize  →  FastAPI gateway
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Download the model (one-time, ~2.3 GB)

The model file is **not in the repo** (too large for Git). Download it manually:

- Go to: https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf
- Download: `Phi-3-mini-4k-instruct-Q4_K_M.gguf`
- Place it at: `assets/models/Phi-3-mini-4k-instruct-Q4_K_M.gguf`

```
city-wallet-mobile/
└── assets/
    └── models/
        └── Phi-3-mini-4k-instruct-Q4_K_M.gguf   ← put it here
```

> The `assets/models/` folder is in `.gitignore` — this file will never be committed.

### 3. Run the app

```bash
npx expo start
```

Then open on Android (`a`), iOS (`i`), or Expo Go.

> **Android emulator:** use `http://10.0.2.2:8000` as gateway URL
> **iOS simulator:** use `http://127.0.0.1:8000`
> **Physical device:** use your PC's LAN IP e.g. `http://192.168.1.x:8000`

---

## On-Device Model

| Setting | Value |
|---|---|
| Model | Phi-3 Mini 4K Instruct |
| Quantization | Q4_K_M (~2.3 GB) |
| Runtime | llama.rn (llama.cpp wrapper for React Native) |
| Context window | 512 tokens |
| Threads | 4 |
| Temperature | 0.3 (low = reliable JSON) |

### Why Phi-3 Mini?

- Named explicitly in the challenge brief
- Best-in-class JSON instruction following at this size
- Runs on Android and iOS without a GPU
- Q4_K_M quantization is the sweet spot: small enough for a phone, quality good enough for demos

---

## SLM Modes

| Mode | What runs | When to use |
|---|---|---|
| `mock` | Deterministic heuristics, no model | Teammates without the model file, CI, fast iteration |
| `native` | Real Phi-3 Mini via llama.rn | Demo, hackathon presentation |

The app falls back to `mock` automatically if the model file is missing or the native bridge fails.
Set `EXPO_PUBLIC_STRICT_NATIVE_SLM=1` in `.env` to disable fallback and fail loudly instead.

---

## Privacy Contract

Raw device data **never leaves the phone**. The on-device model sees everything;
the network payload contains only coarse buckets.

| Field | On-device model | Sent to server |
|---|---|---|
| `lat` / `lng` | ✅ (as coarse cell hint) | ❌ never |
| `movement_signature` | ✅ | ❌ never |
| `preference_hints` | ✅ | ❌ never |
| `weather_bucket` | ✅ | ✅ |
| `demand_bucket` | ✅ | ✅ |
| `time_bucket` | ✅ | ✅ |
| `local_model_output` | — | ✅ (headline, body, discount, validity) |

A privacy gate (`validateFinalizePayloadPrivacy`) blocks the network call if any sensitive field
is detected in the outgoing payload.

---

## Key Files

| File | Purpose |
|---|---|
| `src/localModel/llamaRunner.ts` | Loads Phi-3 via llama.rn, attaches to native bridge |
| `src/localModel/nativeSlm.ts` | Bridge contract, prompt builder, JSON parser |
| `src/localModel/mockSlm.ts` | Heuristic fallback (no model needed) |
| `src/localModel/index.ts` | Orchestration: mock vs native, fallback logic |
| `src/privacy/coarseContext.ts` | Strips sensitive fields, builds finalize payload |
| `src/api/finalizeClient.ts` | POST /v1/offers/finalize client |
| `src/types.ts` | Shared TypeScript contracts |
| `App.tsx` | Demo UI: run SLM → privacy check → finalize |

---

## Backend Dependency

Run the gateway from `city-wallet-genui-mvp`:

```bash
uvicorn main:app --reload --port 8000
```

Expected endpoint: `POST http://<host>:8000/v1/offers/finalize`

---

## For Teammates (no model needed)

If you are working on another module and just need the app to run:

1. `npm install`
2. `npx expo start`
3. In the app UI, keep the toggle on **mock** — no model file needed
4. The full flow (privacy gate → finalize POST) works identically in mock mode
