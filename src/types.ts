/** Raw device location — never sent in finalize body. */
export type DeviceLocation = {
  lat: number;
  lng: number;
  radius_m: number;
};

/** Full signal set the on-device model can see (including sensitive fields). */
export type DeviceSignals = {
  session_id: string;
  client_pseudonym: string;
  merchant_id: string;
  merchant_name: string;
  time_bucket: string;
  weather_bucket: string;
  area_bucket: string;
  demand_bucket: string;
  event_tags: string[];
  location: DeviceLocation;
  movement_signature: string | null;
  preference_hints: string[];
};

/** Privacy-safe buckets only — safe to send upstream. */
export type CoarseContext = {
  time_bucket: string;
  weather_bucket: string;
  area_bucket: string;
  demand_bucket: string;
  event_tags: string[];
};

/** Output of the on-device SLM — required by POST /v1/offers/finalize. */
export type LocalModelOutput = {
  headline: string;
  body: string;
  discount_pct: number;
  validity_minutes: number;
};

export type GenUiDraft = {
  badge_text?: string;
  image_prompt?: string;
  color_palette?: { primary?: string; secondary?: string; text?: string };
};

export type FinalizeRequest = {
  session_id: string;
  client_pseudonym?: string;
  merchant_id: string;
  intent_summary: string;
  coarse_context: CoarseContext;
  local_model_output: LocalModelOutput;
  gen_ui_draft?: GenUiDraft;
};

export type SlmBackend = "mock" | "native";
