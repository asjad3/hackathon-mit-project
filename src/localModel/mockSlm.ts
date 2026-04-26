import type { DeviceLocation, DeviceSignals, LocalModelOutput } from "../types";

/**
 * Deterministic pseudo-random 0..n-1 from string seed.
 */
function hashPick(seed: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

/**
 * Heuristic copy: feels "generated" and varies with full device context.
 * In production, replace the body of this with native SLM output parsing.
 */
export async function runMockOnDeviceSlm(
  signals: DeviceSignals,
  maxDiscount: number
): Promise<LocalModelOutput> {
  // Simulate on-device work (UI can show a spinner)
  await new Promise((r) => setTimeout(r, 450));

  const key = buildLocalOnlyKey(signals.location);
  const w = signals.weather_bucket.toLowerCase();
  const d = signals.demand_bucket.toLowerCase();
  const move = (signals.movement_signature || "stroll").toLowerCase();

  const isRain = /rain|drizzle|storm/.test(w);
  const isQuiet = /low|quiet|slow|very_low/.test(d);

  const moodA = isRain
    ? ["Cozy", "Warm", "Rain-day"]
    : ["Fresh", "Bright", "Sunny-day"];
  const moodB = isQuiet ? ["Quiet boost", "Fill-the-room", "Corner moment"] : ["Quick stop", "In & out", "City pace"];

  const h0 = moodA[hashPick(`${key}_a`, moodA.length)];
  const h1 = moodB[hashPick(`${key}_b`, moodB.length)];

  const merchantShort = signals.merchant_name.split(/\s+/).slice(0, 2).join(" ");
  const headline = `${h0} ${h1} ${merchantShort}`.replace(/\s+/g, " ").trim().split(/\s+/).slice(0, 6).join(" ");

  const offBase = 8 + hashPick(`${key}_d`, 8);
  const discount_pct = Math.min(maxDiscount, offBase + (isQuiet ? 4 : 0));
  const validity_minutes = 20 + hashPick(key, 40) * 2;

  const pref = signals.preference_hints[0] || "a treat";
  const body =
    `${discount_pct}% off now — next ${validity_minutes} min. ` +
    `${isRain ? "Warm up" : "Enjoy"} a ${pref} while you're ${move}.`.replace(/\s+/g, " ").trim();
  const bodyWords = body.split(/\s+/).slice(0, 15).join(" ");

  return {
    headline,
    body: bodyWords,
    discount_pct,
    validity_minutes,
  };
}

/**
 * Fingerprint location for *local* model conditioning only. Never include raw coords in the offer JSON
 * (we only use a coarse string tag here as extra local-only context inside mock).
 */
function buildLocalOnlyKey(loc: DeviceLocation): string {
  const g = 0.01;
  const qLat = Math.round(loc.lat / g) * g;
  const qLng = Math.round(loc.lng / g) * g;
  return `cell:${qLat},${qLng},r${loc.radius_m}`;
}
