import type {
  CoarseContext,
  DeviceSignals,
  FinalizeRequest,
  LocalModelOutput,
} from "../types";

/**
 * Strip everything down to coarse buckets for the network.
 * Raw lat/lng must not appear in the returned object.
 */
export function toCoarseContext(signals: DeviceSignals): CoarseContext {
  return {
    time_bucket: signals.time_bucket,
    weather_bucket: signals.weather_bucket,
    area_bucket: signals.area_bucket,
    demand_bucket: signals.demand_bucket,
    event_tags: [...signals.event_tags],
  };
}

/**
 * Non-identifying intent line for the server (no GPS, no raw prefs list).
 */
export function buildIntentSummary(signals: DeviceSignals): string {
  const move = (signals.movement_signature || "unknown").replace(/\s+/g, "_");
  const prefs = signals.preference_hints.length ? "interested" : "neutral";
  return `${signals.demand_bucket}_${move}_${prefs}`;
}

export function buildFinalizeRequest(
  signals: DeviceSignals,
  localOut: LocalModelOutput
): FinalizeRequest {
  return {
    session_id: signals.session_id,
    client_pseudonym: signals.client_pseudonym,
    merchant_id: signals.merchant_id,
    intent_summary: buildIntentSummary(signals),
    coarse_context: toCoarseContext(signals),
    local_model_output: {
      headline: localOut.headline,
      body: localOut.body,
      discount_pct: localOut.discount_pct,
      validity_minutes: localOut.validity_minutes,
    },
    gen_ui_draft: {
      badge_text: "On-device draft",
    },
  };
}

function walkForSensitiveFields(
  node: unknown,
  path: string[],
  out: string[]
): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      walkForSensitiveFields(node[i], [...path, `[${i}]`], out);
    }
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    const p = [...path, k].join(".");
    if (
      lower === "location" ||
      lower === "lat" ||
      lower === "lng" ||
      lower === "latitude" ||
      lower === "longitude" ||
      lower === "preference_hints" ||
      lower === "movement_signature"
    ) {
      out.push(p);
    }
    walkForSensitiveFields(v, [...path, k], out);
  }
}

export function validateFinalizePayloadPrivacy(payload: FinalizeRequest): {
  ok: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  walkForSensitiveFields(payload, [], issues);
  return {
    ok: issues.length === 0,
    issues,
  };
}
