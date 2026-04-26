import { initLlama, LlamaContext } from "llama.rn";
import { getModelPath, checkModelExists as checkModelFile } from "./modelConfig";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

// Tuned for low-end Android (~2-3 GB usable RAM).
// - n_ctx kept small: prompt is < 200 tokens and we only need ~160 out.
// - n_gpu_layers=0: CPU-only is the safest baseline across Android GPUs.
// - n_threads=4: decent default for 4-8 core ARM SoCs.
const CONTEXT_PARAMS = {
  n_ctx: 1024,
  n_threads: 4,
  n_gpu_layers: 0,
} as const;

// Stop the moment the model finishes the JSON or begins a new section.
// Built dynamically to avoid HTML-like tokens being mishandled by tooling.
const STOP_TOKENS: string[] = [
  "\n\n",
  "```",
  String.fromCharCode(60) + "/s" + String.fromCharCode(62),
  String.fromCharCode(60) + "|im_end|" + String.fromCharCode(62),
  String.fromCharCode(60) + "|endoftext|" + String.fromCharCode(62),
];

const COMPLETION_PARAMS = {
  n_predict: 160,
  temperature: 0.6,
  top_k: 40,
  top_p: 0.9,
  penalty_repeat: 1.1,
  stop: STOP_TOKENS,
};

export class LlamaRunner {
  private context: LlamaContext | null = null;
  private modelPath: string;

  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  async initialize(): Promise<void> {
    if (this.context) return;

    console.log("[LlamaRunner] Loading model from:", this.modelPath);
    try {
      const llamaPromise = initLlama(
        {
          model: this.modelPath,
          ...CONTEXT_PARAMS,
        },
        (progress) => {
          if (progress % 10 === 0) {
            console.log("[LlamaRunner] Load progress:", progress + "%");
          }
        }
      );
      // 120s timeout — model loading is slow on low-end devices but shouldn't take forever
      this.context = await withTimeout(llamaPromise, 120_000, "Model loading");
      console.log("[LlamaRunner] Model loaded.");
    } catch (error) {
      console.error("[LlamaRunner] Failed to load model:", error);
      this.context = null;
      throw new Error("Failed to load native SLM: " + String(error));
    }
  }

  private wrapChatML(prompt: string): string {
    return (
      "<|im_start|>system\nYou are a JSON-only assistant. Output ONLY valid JSON with no extra text.<|im_end|>\n" +
      "<|im_start|>user\n" + prompt + "<|im_end|>\n" +
      "<|im_start|>assistant\n"
    );
  }

  async infer(prompt: string): Promise<string> {
    if (!this.context) {
      throw new Error("Native SLM not initialized. Call initialize() first.");
    }
    try {
      const chatPrompt = this.wrapChatML(prompt);
      console.log("[LlamaRunner] Prompt length:", chatPrompt.length, "chars");
      const result = await this.context.completion({
        prompt: chatPrompt,
        ...COMPLETION_PARAMS,
      });
      console.log("[LlamaRunner] Raw output:", (result.text ?? "").slice(0, 300));
      return result.text ?? "";
    } catch (error) {
      console.error("[LlamaRunner] Inference failed:", error);
      throw new Error("Native SLM inference failed: " + String(error));
    }
  }

  async destroy(): Promise<void> {
    if (this.context) {
      try {
        await this.context.release();
      } catch (e) {
        console.warn("[LlamaRunner] release() failed:", e);
      }
      this.context = null;
    }
  }
}

let globalRunner: LlamaRunner | null = null;

type NativeSlmBridge = {
  infer: (prompt: string) => Promise<string>;
};

type GlobalWithBridge = typeof globalThis & {
  __CITY_WALLET_NATIVE_SLM__?: NativeSlmBridge;
};

export async function initializeGlobalRunner(): Promise<void> {
  if (globalRunner) return;
  const modelPath = await getModelPath();
  const runner = new LlamaRunner(modelPath);
  await runner.initialize();
  globalRunner = runner;
  (globalThis as GlobalWithBridge).__CITY_WALLET_NATIVE_SLM__ = {
    infer: (prompt: string) => runner.infer(prompt),
  };
}

export async function checkModelExists(): Promise<boolean> {
  return checkModelFile();
}

export async function destroyGlobalRunner(): Promise<void> {
  if (globalRunner) {
    await globalRunner.destroy();
    globalRunner = null;
  }
  delete (globalThis as GlobalWithBridge).__CITY_WALLET_NATIVE_SLM__;
}
