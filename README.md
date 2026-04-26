# City Wallet Mobile (On-Device SLM)

React Native / Expo app for the local AI portion of Challenge Module 02.

This app generates `local_model_output` on the phone and sends only privacy-safe data upstream to:

- `POST /v1/offers/finalize` (served by `city-wallet-genui-mvp`)

## Scope

This repository focuses on one responsibility:

- local model generation on device
- privacy-safe payload shaping
- finalize API handoff

It is not the full backend/microservice implementation.

## Implemented Features

- **On-device SLM runner**
  - `mock` mode: deterministic local generator for stable demos
  - `native` mode: bridge hook for real local runtime
- **Native bridge contract**
  - `globalThis.__CITY_WALLET_NATIVE_SLM__.infer(prompt)`
- **Safe fallback behavior**
  - if native bridge is missing/fails, app can fallback to `mock`
  - set `EXPO_PUBLIC_STRICT_NATIVE_SLM=1` to fail-fast instead
- **Privacy boundary**
  - raw location, movement details, and preference hints stay on device
  - outgoing payload is validated before network send
- **Sanitized request preview**
  - app UI shows final payload sent to `/v1/offers/finalize`

## Quick Start

```powershell
cd "C:\Users\Cyber Lab\Desktop\Sarim\city-wallet-mobile"
npm install
npx expo start
```

Then open on Android (`a`), iOS (`i`), or Expo Go.

## Backend Dependency

Run the gateway from:

- `C:\Users\Cyber Lab\Desktop\Sarim\city-wallet-genui-mvp`

Expected endpoint:

- `http://<gateway-host>:8000/v1/offers/finalize`

Gateway URL options:

| Runtime | Base URL |
|---|---|
| Android emulator | `http://10.0.2.2:8000` |
| iOS simulator | `http://127.0.0.1:8000` |
| Physical device | `http://<PC_LAN_IP>:8000` |

## Native Model Integration (Optional Upgrade)

To replace mock generation with a real local SLM (Qwen/Gemma/Llama via llama.cpp/MLC/CoreML):

1. Bind a native inference module for Android/iOS.
2. Expose:

```ts
globalThis.__CITY_WALLET_NATIVE_SLM__ = {
  infer: async (prompt: string) => {
    // Return object or JSON string:
    // { headline, body, discount_pct, validity_minutes }
  },
};
```

3. Keep output schema strict:
   - `headline`
   - `body`
   - `discount_pct`
   - `validity_minutes`

## Privacy Contract

Outgoing request must include only:

- `intent_summary`
- `coarse_context`
- `local_model_output`
- optional `gen_ui_draft`

Must not include:

- `location`, `lat`, `lng`, `latitude`, `longitude`
- `movement_signature`
- `preference_hints`

## Key Files

| File | Purpose |
|---|---|
| `App.tsx` | Demo flow: local run -> privacy check -> finalize |
| `src/localModel/mockSlm.ts` | Local mock SLM generation |
| `src/localModel/nativeSlm.ts` | Native bridge parser + validator |
| `src/localModel/index.ts` | SLM orchestration + fallback |
| `src/privacy/coarseContext.ts` | Coarse context + payload privacy gate |
| `src/api/finalizeClient.ts` | Finalize API client |
| `src/types.ts` | Shared contracts for local and upstream payload |
