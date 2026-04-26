import type { DeviceSignals, LocalModelOutput, SlmBackend } from "../types";
import { runMockOnDeviceSlm } from "./mockSlm";
import { buildPromptFromSignals, runNativeOnDeviceSlm } from "./nativeSlm";
import { initializeGlobalRunner, checkModelExists } from "./llamaRunner";

export { runMockOnDeviceSlm, buildPromptFromSignals, runNativeOnDeviceSlm, initializeGlobalRunner };

let nativeInitialized = false;

function locationCellHint(loc: { lat: number; lng: number; radius_m: number }): string {
  const g = 0.01;
  return `q_${Math.round(loc.lat / g)}_${Math.round(loc.lng / g)}_r${loc.radius_m}`;
}

/**
 * Initialize the native SLM (must be called before using native mode).
 * This is asynchronous and should be called on app startup.
 */
export async function initNativeSLM(): Promise<void> {
  if (nativeInitialized) {
    return;
  }
  
  const hasModel = await checkModelExists();
  if (!hasModel) {
    throw new Error(
      'Native SLM model not found. Please ensure Phi-3-mini-4k-instruct-Q4_K_M.gguf ' +
      'is placed in assets/models/ directory.'
    );
  }
  
  await initializeGlobalRunner();
  nativeInitialized = true;
}

/**
 * Main entry: run the on-device model path (mock or native).
 */
export async function runOnDeviceSlm(
  signals: DeviceSignals,
  maxDiscount: number,
  backend: SlmBackend
): Promise<LocalModelOutput> {
  if (backend === "mock") {
    return runMockOnDeviceSlm(signals, maxDiscount);
  }
  
  const prompt = buildPromptFromSignals({
    merchant_name: signals.merchant_name,
    time_bucket: signals.time_bucket,
    weather_bucket: signals.weather_bucket,
    demand_bucket: signals.demand_bucket,
    area_bucket: signals.area_bucket,
    event_tags: signals.event_tags,
    movement_signature: signals.movement_signature,
    preference_hints: signals.preference_hints,
    locationCellHint: locationCellHint(signals.location),
  });
  
  try {
    return await runNativeOnDeviceSlm(prompt);
  } catch (error) {
    // Fail loudly if strict mode is enabled
    if (process.env.EXPO_PUBLIC_STRICT_NATIVE_SLM === "1") {
      throw error;
    }
    // Otherwise fall back to mock mode
    console.warn('Native SLM failed, falling back to mock mode:', error);
    return runMockOnDeviceSlm(signals, maxDiscount);
  }
}
