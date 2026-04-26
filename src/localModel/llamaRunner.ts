import { LlamaContext, loadLlamaModel } from 'llama.rn';
import { getModelPath } from './modelConfig';

export class LlamaRunner {
  private context: LlamaContext | null = null;
  private modelPath: string;

  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  /**
   * Initialize the Llama runner by loading the model.
   */
  async initialize(): Promise<void> {
    console.log('Loading Llama model from:', this.modelPath);
    
    try {
      const model = await loadLlamaModel({
        model: this.modelPath,
      });
      
      this.context = await model.createContext({
        n_ctx: 2048,
        n_threads: 4,
        n_gpu_layers: 0, // CPU only for now
      });
      
      console.log('Llama model loaded successfully');
    } catch (error) {
      console.error('Failed to load Llama model:', error);
      throw new Error(`Failed to load native SLM: ${error}`);
    }
  }

  /**
   * Run inference on the model.
   */
  async infer(prompt: string): Promise<string> {
    if (!this.context) {
      throw new Error('Native SLM not initialized. Call initialize() first.');
    }

    try {
      const result = await this.context.inference({
        prompt,
        n_predict: 256,
        temperature: 0.7,
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1,
        stop: ['\n\n', '```'],
      });
      
      return result.text;
    } catch (error) {
      console.error('Inference failed:', error);
      throw new Error(`Native SLM inference failed: ${error}`);
    }
  }

  /**
   * Clean up resources.
   */
  async destroy(): Promise<void> {
    if (this.context) {
      this.context = null;
    }
  }
}

// Global instance for native SLM bridge
let globalRunner: LlamaRunner | null = null;

/**
 * Initialize the global native SLM runner.
 */
export async function initializeGlobalRunner(): Promise<void> {
  if (globalRunner) {
    return; // Already initialized
  }

  try {
    const modelPath = await getModelPath();
    globalRunner = new LlamaRunner(modelPath);
    await globalRunner.initialize();
    
    // Register on globalThis for nativeSlm.ts to access
    (globalThis as any).__CITY_WALLET_NATIVE_SLM__ = {
      infer: async (prompt: string) => {
        if (!globalRunner) {
          throw new Error('Native SLM not initialized');
        }
        return await globalRunner.infer(prompt);
      }
    };
    
    console.log('Native SLM bridge registered successfully');
  } catch (error) {
    console.error('Failed to initialize native SLM:', error);
    throw error;
  }
}

/**
 * Get the global runner instance.
 */
export function getGlobalRunner(): LlamaRunner | null {
  return globalRunner;
}
