import { initLlama, LlamaContext } from "llama.rn";
import { getModelPath, checkModelExists as checkModelFile } from "./modelConfig";

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
      this.context = await initLlama(
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
      console.log("[LlamaRunner] Model loaded.");
    } catch (error) {
      console.error("[LlamaRunner] Failed to load model:", error);
      this.context = null;
      throw new Error("Failed to load native SLM: " + String(error));
    }
  }

  async infer(prompt: string): Promise<string> {
    if (!this.context) {
      throw new Error("Native SLM not initialized. Call initialize() first.");
    }
    try {
      const result = await this.context.completion({
        prompt,
        ...COMPLETION_PARAMS,
      });
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
