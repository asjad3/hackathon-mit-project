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
  // Strip control characters and non-printable chars except standard whitespace
  const cleaned = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
  
  // Find the first { and try to find its matching }
  const start = cleaned.indexOf("{");
  if (start === -1) {
    throw new Error("Native SLM output did not include a JSON object. Raw: " + raw.slice(0, 200));
  }
  
  // Walk to find balanced braces
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") { depth--; if (depth === 0) return cleaned.slice(start, i + 1); }
  }
  
  // Fallback: just take from first { to last }
  const end = cleaned.lastIndexOf("}");
  if (end > start) {
    return cleaned.slice(start, end + 1);
  }
  throw new Error("Native SLM output did not include a complete JSON object. Raw: " + raw.slice(0, 200));
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
 * Run inference using the native on-device model.
 * Requires the native SLM bridge to be initialized via initializeGlobalRunner().
 */
export async function runNativeOnDeviceSlm(
  prompt: string
): Promise<LocalModelOutput> {
  const bridge = (globalThis as MaybeGlobalWithBridge).__CITY_WALLET_NATIVE_SLM__;
  
  if (!bridge) {
    throw new Error(
      "Native SLM bridge not initialized. Call initNativeSLM() before using native mode."
    );
  }
  
  if (!bridge.infer) {
    throw new Error(
      "Native SLM bridge missing infer method. Ensure __CITY_WALLET_NATIVE_SLM__.infer is defined."
    );
  }
  
  try {
    const raw = await bridge.infer(prompt);
    console.log('[NativeSlm] Raw model output:', typeof raw === 'string' ? raw.slice(0, 300) : JSON.stringify(raw));
    return parseNativeOutput(raw);
  } catch (error) {
    console.warn('[NativeSlm] First attempt failed, retrying...', error);
    // Retry once — small models sometimes need a second pass
    try {
      const raw2 = await bridge.infer(prompt + '\n{');
      console.log('[NativeSlm] Retry raw output:', typeof raw2 === 'string' ? raw2.slice(0, 300) : JSON.stringify(raw2));
      // Prepend the { we added to the prompt in case model continued from it
      const text = typeof raw2 === 'string' ? '{' + raw2 : raw2;
      return parseNativeOutput(text);
    } catch (retryError) {
      console.error('Native SLM inference error (after retry):', retryError);
      throw new Error(`Native SLM inference failed: ${error}`);
    }
  }
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
    "You are a local offer assistant. Output ONLY a JSON object — no explanation, no markdown.",
    "Schema: { \"headline\": string (max 6 words), \"body\": string (max 15 words, mention discount % and minutes), \"discount_pct\": number, \"validity_minutes\": number }",
    "",
    "Example:",
    "Input: merchant=Cafe Müller, context=lunch, rainy, demand=low, area=old_town, preferences=coffee",
    "Output: {\"headline\":\"Warm up at Café Müller\",\"body\":\"15% off your coffee — next 20 min, while it's raining.\",\"discount_pct\":15,\"validity_minutes\":20}",
    "",
    "Now generate for:",
    `merchant: ${s.merchant_name}`,
    `context: ${s.time_bucket}, ${s.weather_bucket}, demand=${s.demand_bucket}, area=${s.area_bucket}`,
    `events: ${s.event_tags.join(",") || "none"}`,
    `movement: ${s.movement_signature || "unknown"}`,
    `preferences: ${s.preference_hints.join(",") || "none"}`,
    `local_area_hint: ${s.locationCellHint}`,
    "Output:",
  ].join("\n");
}