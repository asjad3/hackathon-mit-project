import type { LocalModelOutput } from "../types";

type NativeSlmBridge = {
  infer: (prompt: string) => Promise<unknown> | unknown;
};

type MaybeGlobalWithBridge = typeof globalThis & {
  __CITY_WALLET_NATIVE_SLM__?: NativeSlmBridge;
};

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function pickJsonObjectText(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Native SLM output did not include a JSON object.");
  }
  return raw.slice(start, end + 1);
}

function parseNativeOutput(raw: unknown): LocalModelOutput {
  const parsed = typeof raw === "string" ? JSON.parse(pickJsonObjectText(raw)) : raw;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Native SLM output must be a JSON object.");
  }
  const obj = parsed as Record<string, unknown>;
  const headline = String(obj.headline ?? "").trim();
  const body = String(obj.body ?? "").trim();
  const discountRaw = Number(obj.discount_pct ?? 0);
  const validityRaw = Number(obj.validity_minutes ?? 0);
  if (!headline || !body) {
    throw new Error("Native SLM output missing headline/body.");
  }
  if (!Number.isFinite(discountRaw) || !Number.isFinite(validityRaw)) {
    throw new Error("Native SLM output has invalid numeric fields.");
  }
  return {
    headline,
    body,
    discount_pct: clampInt(discountRaw, 1, 80),
    validity_minutes: clampInt(validityRaw, 1, 180),
  };
}

/**
 * Placeholder for a real on-device model (e.g. llama.cpp / MLC / CoreML).
 * Wire your native module here, parse JSON to LocalModelOutput.
 */
export async function runNativeOnDeviceSlm(
  prompt: string
): Promise<LocalModelOutput> {
  const bridge = (globalThis as MaybeGlobalWithBridge).__CITY_WALLET_NATIVE_SLM__;
  if (bridge?.infer) {
    const raw = await bridge.infer(prompt);
    return parseNativeOutput(raw);
  }
  throw new Error(
    "Native SLM bridge missing. Attach globalThis.__CITY_WALLET_NATIVE_SLM__.infer(prompt) and return JSON."
  );
}

export function buildPromptFromSignals(s: {
  merchant_name: string;
  time_bucket: string;
  weather_bucket: string;
  demand_bucket: string;
  area_bucket: string;
  event_tags: string[];
  movement_signature: string | null;
  preference_hints: string[];
  /** local-only, do not log to analytics */
  locationCellHint: string;
}): string {
  return [
    "You are a local cafe offer assistant. Reply with JSON only:",
    "{ headline: string (max 6 words), body: string (max 15 words, must mention discount % and minutes),",
    "discount_pct: number, validity_minutes: number }",
    `merchant: ${s.merchant_name}`,
    `context: ${s.time_bucket}, ${s.weather_bucket}, demand=${s.demand_bucket}, area=${s.area_bucket}`,
    `events: ${s.event_tags.join(",") || "none"}`,
    `movement: ${s.movement_signature || "unknown"}`,
    `preferences: ${s.preference_hints.join(",") || "none"}`,
    `local_area_hint: ${s.locationCellHint}`,
  ].join("\n");
}
