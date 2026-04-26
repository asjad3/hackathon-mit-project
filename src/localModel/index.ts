import type { DeviceSignals, LocalModelOutput, SlmBackend } from "../types";
import { runMockOnDeviceSlm } from "./mockSlm";
import { buildPromptFromSignals, runNativeOnDeviceSlm } from "./nativeSlm";

export { runMockOnDeviceSlm, buildPromptFromSignals, runNativeOnDeviceSlm };

function locationCellHint(loc: { lat: number; lng: number; radius_m: number }): string {
  const g = 0.01;
  return `q_${Math.round(loc.lat / g)}_${Math.round(loc.lng / g)}_r${loc.radius_m}`;
}

/**
 * Main entry: run the on-device model path (mock or future native).
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
    // Keep demos stable when the native runtime is not linked yet.
    if (process.env.EXPO_PUBLIC_STRICT_NATIVE_SLM === "1") {
      throw error;
    }
    return runMockOnDeviceSlm(signals, maxDiscount);
  }
}
