import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

/**
 * Recommended model for low-end Android (~400 MB RAM working set, ~400 MB on disk):
 *   Qwen2.5-0.5B-Instruct, Q4_K_M quantization.
 *
 * Download from:
 *   https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf
 *
 * Save it as:
 *   assets/models/qwen2.5-0.5b-instruct-q4_k_m.gguf
 *
 * Why this one:
 *   - Tiny (~398 MB on disk, ~400-600 MB peak RAM with n_ctx=1024).
 *   - Excellent JSON / instruction-following for its size.
 *   - Apache-2.0 license, ships with chat template the prompt already mimics.
 */
export const MODEL_FILENAME = "qwen2.5-0.5b-instruct-q4_k_m.gguf";

// Static require so Metro bundles the .gguf as an asset.
// NOTE: requires `metro.config.js` to register `gguf` in `assetExts`.
// If the file is missing at bundle time, Metro will fail with a clear error.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MODEL_ASSET_MODULE = require("../../assets/models/qwen2.5-0.5b-instruct-q4_k_m.gguf");

let cachedPath: string | null = null;

/**
 * Resolve the on-device file path of the bundled model.
 * On first call this triggers `expo-asset` to copy the bundled gguf out of
 * the APK into the cache directory (one-time, ~400 MB).
 */
export async function getModelPath(): Promise<string> {
  if (cachedPath) return cachedPath;
  const asset = Asset.fromModule(MODEL_ASSET_MODULE);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  if (!asset.localUri) {
    throw new Error(
      "Could not resolve model asset. Ensure the gguf file exists at " +
        "assets/models/" + MODEL_FILENAME +
        " and that metro.config.js registers 'gguf' in assetExts."
    );
  }
  // llama.rn (Android JNI) wants a plain filesystem path, not a file:// URI.
  cachedPath = asset.localUri.replace(/^file:\/\//, "");
  return cachedPath;
}

/**
 * Returns true if the model file is present and resolvable.
 */
export async function checkModelExists(): Promise<boolean> {
  try {
    const path = await getModelPath();
    const info = await FileSystem.getInfoAsync(
      path.startsWith("/") ? "file://" + path : path
    );
    return info.exists && (info.size ?? 0) > 1024 * 1024; // > 1 MB sanity check
  } catch {
    return false;
  }
}
