# City Wallet — Architecture

End-to-end design of the on-device SLM offer-generation flow. The privacy
guarantee is simple: **the language model runs entirely on the user's Android
phone, and only coarse, non-identifying buckets plus the model's already-drafted
offer are sent to the backend gateway.**

---

## 1. High-level flow

```mermaid
flowchart TB
    subgraph PHONE["User's Android Phone (offline-capable)"]
        direction TB

        subgraph SENSORS["Device-only signals (NEVER leave phone)"]
            GPS["Raw GPS<br/>lat / lng / radius"]
            PREFS["preference_hints[]"]
            MOVE["movement_signature"]
        end

        subgraph BUCKETING["Coarse bucketing<br/>(src/privacy/coarseContext.ts)"]
            COARSE["CoarseContext<br/>time / weather / area /<br/>demand / event_tags"]
            INTENT["intent_summary<br/>e.g. low_slow_browse_interested"]
        end

        subgraph SLM["On-device SLM (src/localModel/)"]
            PROMPT["buildPromptFromSignals<br/>(nativeSlm.ts)"]
            CHATML["wrapChatML<br/>system / user / assistant"]
            LLAMA["llama.rn → llama.cpp<br/>Qwen2.5-0.5B-Instruct Q4_K_M<br/>n_ctx=1024 · n_gpu_layers=0<br/>CPU only · ~400 MB RAM"]
            PARSE["parseNativeOutput<br/>JSON extract + clamp"]
        end

        subgraph ASSET["Model storage"]
            APK["assets/models/<br/>qwen2.5-0.5b-instruct-q4_k_m.gguf<br/>(bundled in APK)"]
            CACHE["expo-asset cache dir<br/>file://.../cache/.../*.gguf"]
        end

        UI["App.tsx<br/>React Native UI"]
        DRAFT["LocalModelOutput<br/>{headline, body,<br/>discount_pct, validity_minutes}"]
        BUILD["buildFinalizeRequest"]
        GATE["validateFinalizePayloadPrivacy<br/>blocks if lat/lng/prefs leak"]
        PAYLOAD["Sanitized FinalizeRequest"]
    end

    subgraph BACKEND["Backend Gateway (FastAPI)"]
        direction TB
        ROUTE["/v1/offers/finalize<br/>(backend/app/routers/finalize.py)"]
        POLICY["Merchant cap +<br/>policy checks"]
        GENUI["GenUI styling<br/>(server-side decoration only)"]
        DB["SQLite / repo layer<br/>(no raw GPS stored)"]
        RESP["Server response<br/>(decorated offer)"]
    end

    GPS --> BUCKETING
    PREFS --> BUCKETING
    MOVE --> BUCKETING

    GPS -.->|"local-only<br/>location_cell_hint"| PROMPT
    PREFS -.->|local only| PROMPT
    MOVE -.->|local only| PROMPT
    BUCKETING --> PROMPT

    APK -->|first launch copy| CACHE
    CACHE --> LLAMA
    PROMPT --> CHATML --> LLAMA --> PARSE --> DRAFT

    UI --> SLM
    DRAFT --> UI
    DRAFT --> BUILD
    COARSE --> BUILD
    INTENT --> BUILD
    BUILD --> GATE --> PAYLOAD

    PAYLOAD ==>|"HTTPS POST<br/>(coarse buckets + draft only)"| ROUTE
    ROUTE --> POLICY --> GENUI --> DB
    GENUI --> RESP
    RESP ==>|JSON| UI

    classDef secret fill:#7f1d1d,stroke:#fecaca,color:#fff
    classDef device fill:#1e3a8a,stroke:#bfdbfe,color:#fff
    classDef net fill:#065f46,stroke:#a7f3d0,color:#fff
    class GPS,PREFS,MOVE secret
    class SLM,BUCKETING,ASSET,UI,DRAFT,BUILD,GATE,PAYLOAD device
    class BACKEND,ROUTE,POLICY,GENUI,DB,RESP net
```

---

## 2. Sequence — single offer generation

```mermaid
sequenceDiagram
    participant U as User
    participant App as App.tsx
    participant Idx as localModel/index.ts
    participant Cfg as modelConfig.ts<br/>(expo-asset)
    participant Run as LlamaRunner<br/>(llamaRunner.ts)
    participant Llm as llama.cpp (native)
    participant Priv as coarseContext.ts
    participant GW as Gateway<br/>/v1/offers/finalize

    Note over App,Llm: First launch only
    App->>Idx: initNativeSLM()
    Idx->>Cfg: getModelPath()
    Cfg->>Cfg: Asset.fromModule(require .gguf)<br/>downloadAsync() → cache dir
    Cfg-->>Idx: /data/.../qwen2.5-0.5b...gguf
    Idx->>Run: initializeGlobalRunner()
    Run->>Llm: initLlama({model, n_ctx:1024,<br/>n_gpu_layers:0, n_threads:4})
    Llm-->>Run: LlamaContext (loaded ~2-15s)
    Run->>Run: globalThis.__CITY_WALLET_NATIVE_SLM__ = {infer}

    Note over U,GW: Per offer
    U->>App: tap "Run on-device SLM"
    App->>Idx: runOnDeviceSlm(signals, cap, "native")
    Idx->>Idx: buildPromptFromSignals(...)
    Idx->>Run: bridge.infer(prompt)
    Run->>Run: wrapChatML(prompt)
    Run->>Llm: context.completion({prompt, n_predict:160,<br/>temp:0.6, stop:[...]})
    Llm-->>Run: { text: "{...json...}" }
    Run-->>Idx: raw text
    Idx->>Idx: parseNativeOutput → clamp discount/validity
    Idx-->>App: LocalModelOutput

    U->>App: tap "POST finalize"
    App->>Priv: buildFinalizeRequest(signals, localOut)
    Priv-->>App: FinalizeRequest (coarse + draft)
    App->>Priv: validateFinalizePayloadPrivacy(body)
    alt sensitive field detected
        Priv-->>App: { ok:false, issues:["location",...] }
        App-->>U: Blocked by privacy gate
    else clean
        Priv-->>App: { ok:true }
        App->>GW: POST JSON (no GPS, no prefs)
        GW->>GW: merchant cap, policy, GenUI styling
        GW-->>App: decorated offer
        App-->>U: render styled offer
    end
```

---

## 3. Privacy boundary — what crosses the wire

```mermaid
flowchart LR
    subgraph ON["On-device only"]
        A1["lat / lng / radius_m"]
        A2["preference_hints<br/>['coffee','warm']"]
        A3["movement_signature<br/>'slow_browse'"]
        A4["Full prompt to SLM"]
        A5["Raw model output"]
    end

    subgraph WIRE["Sent to backend"]
        B1["session_id"]
        B2["client_pseudonym"]
        B3["merchant_id"]
        B4["intent_summary<br/>(coarse string)"]
        B5["coarse_context<br/>{time_bucket, weather_bucket,<br/>area_bucket, demand_bucket,<br/>event_tags}"]
        B6["local_model_output<br/>{headline, body,<br/>discount_pct,<br/>validity_minutes}"]
        B7["gen_ui_draft<br/>{badge_text}"]
    end

    A1 -.->|bucketed| B5
    A2 -.->|abstracted| B4
    A3 -.->|abstracted| B4
    A4 -.x|never| WIRE
    A5 -.->|clamped & sanitized| B6

    style A1 fill:#7f1d1d,color:#fff
    style A2 fill:#7f1d1d,color:#fff
    style A3 fill:#7f1d1d,color:#fff
    style A4 fill:#7f1d1d,color:#fff
    style A5 fill:#991b1b,color:#fff
    style B1 fill:#065f46,color:#fff
    style B2 fill:#065f46,color:#fff
    style B3 fill:#065f46,color:#fff
    style B4 fill:#065f46,color:#fff
    style B5 fill:#065f46,color:#fff
    style B6 fill:#065f46,color:#fff
    style B7 fill:#065f46,color:#fff
```

---

## 4. Component map

| Layer | File | Role |
|---|---|---|
| **UI** | `App.tsx` | Backend selector (mock/native), buttons, status, payload preview |
| **SLM dispatcher** | `src/localModel/index.ts` | `initNativeSLM`, `runOnDeviceSlm` (mock/native fallback) |
| **Mock backend** | `src/localModel/mockSlm.ts` | Pure-JS heuristic offer for dev / Expo Go |
| **Native bridge** | `src/localModel/nativeSlm.ts` | Builds prompt, calls `globalThis.__CITY_WALLET_NATIVE_SLM__.infer`, parses JSON |
| **Native runner** | `src/localModel/llamaRunner.ts` | Wraps `llama.rn`: `initLlama` + `context.completion`, ChatML, 120 s load timeout |
| **Asset loader** | `src/localModel/modelConfig.ts` | `expo-asset` resolves bundled `.gguf` → cache dir path |
| **Metro config** | `metro.config.js` | Registers `gguf` as asset extension |
| **Privacy gate** | `src/privacy/coarseContext.ts` | Bucket builder + outbound payload scanner |
| **Network client** | `src/api/finalizeClient.ts` | `POST /v1/offers/finalize` |
| **Gateway** | `backend/app/routers/finalize.py` | Receives sanitized payload, applies merchant policy + GenUI styling |

---

## 5. Trust boundary — one-liner

> Phone (trusted, private) → SLM produces offer draft → Privacy gate strips/validates → HTTPS → Gateway (sees coarse buckets + draft only, never raw GPS or prefs).

---

## 6. Build & run notes

`llama.rn` is a native module — **Expo Go cannot run the native backend**. To
test it on a real phone:

```powershell
# 1. Place the gguf at assets/models/qwen2.5-0.5b-instruct-q4_k_m.gguf
#    (download from https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF)

# 2. Generate native projects
npx expo prebuild --clean

# 3. Build and install on a connected Android device
npx expo run:android
```

The `mock` backend works in plain Expo Go for UI iteration without rebuilding.
