/**
 * llamaRunner.ts
 * Loads Phi-3 Mini GGUF via llama.rn and attaches it to the native SLM bridge.
 * Call initLlamaRunner() once at app startup (e.g. in App.tsx before first inference).
 *
 * Model file required (not in repo — see README):
 *   assets/models/Phi-3-mini-4k-instruct-Q4_K_M.gguf
 */

import { initLlama, LlamaContext } from "llama.rn";
import { Asset } from "expo-asset";

type MaybeGlobalWithBridge = typeof globalThis & {
  __CITY_WALLET_NATIVE_SLM__?: {
    infer: (prompt: string) => Promise<string>;
  };
};

let _ctx: LlamaContext | null = null;

/**
 * Load the model once and attach to the global bridge.
 * Safe to call multiple times — skips if already loaded.
 */
export async function initLlamaRunner(): Promise<void> {
  if (_ctx) return;

  // Resolve bundled asset path (Expo manages the URI)
  const [asset] = await Asset.loadAsync(
    require("../../assets/models/Phi-3-mini-4k-instruct-Q4_K_M.gguf")
  );
  const modelUri = asset.localUri ?? asset.uri;
  if (!modelUri) throw new Error("Model asset URI is null — check assets/models/ path.");

  _ctx = await initLlama({
    model: modelUri,
    use_mlock: true,   // keep model in RAM during demo
    n_ctx: 512,        // small context — our prompt is <200 tokens
    n_threads: 4,      // safe default for most Android/iOS devices
  });

  // Attach to bridge so nativeSlm.ts can call it transparently
  (globalThis as MaybeGlobalWithBridge).__CITY_WALLET_NATIVE_SLM__ = {
    infer: async (prompt: string): Promise<string> => {
      if (!_ctx) throw new Error("Llama context not initialised.");
      const result = await _ctx.completion({
        prompt,
        n_predict: 120,      // enough for our JSON output
        temperature: 0.3,    // low = more deterministic JSON
        stop: ["\n\n", "```"], // stop before the model rambles
      });
      return result.text;
    },
  };
}

/**
 * Release model from memory (call on app background/unmount if needed).
 */
export async function releaseLlamaRunner(): Promise<void> {
  if (_ctx) {
    await _ctx.release();
    _ctx = null;
    delete (globalThis as MaybeGlobalWithBridge).__CITY_WALLET_NATIVE_SLM__;
  }
}