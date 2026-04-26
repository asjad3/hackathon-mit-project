import type { FinalizeRequest } from "../types";

const DEFAULT_GW =
  process.env.EXPO_PUBLIC_GATEWAY_URL || "http://10.0.2.2:8000";

export type FinalizeResponse = {
  trace_id: string;
  offer_id: string;
  headline: string;
  body: string;
  discount_pct: number;
  validity_minutes: number;
  valid_until: string;
  gen_ui: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * POST /v1/offers/finalize — matches city-wallet-genui-mvp api-gateway.
 * Android emulator: use 10.0.2.2 for host machine. iOS: localhost. Physical device: your LAN IP.
 */
export async function postFinalize(
  body: FinalizeRequest,
  baseUrl: string = DEFAULT_GW
): Promise<FinalizeResponse> {
  const url = `${baseUrl.replace(/\/$/, "")}/v1/offers/finalize`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`finalize ${r.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text) as FinalizeResponse;
}
