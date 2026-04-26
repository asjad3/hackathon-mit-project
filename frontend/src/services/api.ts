import { Platform } from 'react-native';

/**
 * Resolve the backend host depending on the runtime platform:
 *  - Android emulator routes 10.0.2.2 to host loopback
 *  - iOS simulator can reach host via 127.0.0.1
 *  - Web (Expo web / browser) uses localhost directly
 */
function resolveHost(): string {
  if (Platform.OS === 'web') return 'localhost';
  if (Platform.OS === 'android') return '10.0.2.2';
  return '127.0.0.1';
}

const DEV_HOST = resolveHost();
const API_BASE = `http://${DEV_HOST}:8000`;

export interface WeatherContext {
  condition: string;
  description: string;
  temp_c: number;
  feels_like_c: number;
  humidity: number;
  city: string;
  source: string;
}

export interface EventInfo {
  event_id: string;
  name: string;
  venue: string;
  start_time: string;
  distance_km: number;
  category: string;
  source: string;
  url: string;
}

export interface POIInfo {
  poi_id: string;
  name: string;
  category: string;
  distance_km: number;
  lat: number;
  lng: number;
  source: string;
}

export interface LocationZone {
  zone_id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  distance_m: number;
  merchant_ids: string[];
}

export interface MerchantDemand {
  merchant_id: string;
  current_volume: number;
  avg_volume: number;
  level: string;
  vs_avg_pct: number;
}

export interface ContextState {
  weather: WeatherContext;
  time_bucket: string;
  day_of_week: string;
  local_time: string;
  zone: LocationZone | null;
  events: EventInfo[];
  pois: POIInfo[];
  demand: MerchantDemand[];
}

export interface OfferVisuals {
  primary_color: string;
  accent_color: string;
  emoji: string;
  mood: string;
}

export interface GeneratedOffer {
  offer_id: string;
  merchant_id: string;
  merchant_name: string;
  headline: string;
  body: string;
  discount_pct: number;
  discount_text: string;
  valid_minutes: number;
  product_category: string;
  visuals: OfferVisuals;
  created_at: string;
  expires_at: string;
}

export interface RedemptionToken {
  token_id: string;
  offer_id: string;
  merchant_id: string;
  qr_data: string;
  status: string;
  created_at: string;
  expires_at: string;
  discount_pct: number;
  discount_eur: number;
}

export interface ValidateResponse {
  valid: boolean;
  message: string;
  offer_headline: string;
  discount_pct: number;
  token_status: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new ApiError(resp.status, body.detail ?? 'Request failed');
  }

  return resp.json();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  getContext: (lat: number, lng: number, city?: string, radiusKm = 5) =>
    request<ContextState>(
      `/api/context${qs({ lat, lng, city, radius_km: radiusKm })}`,
    ),

  getWeather: (lat: number, lng: number, city?: string) =>
    request<WeatherContext>(
      `/api/context/weather${qs({ lat, lng, city })}`,
    ),

  getEvents: (lat: number, lng: number, city?: string, radiusKm = 5) =>
    request<EventInfo[]>(
      `/api/context/events${qs({ lat, lng, city, radius_km: radiusKm })}`,
    ),

  getPOIs: (lat: number, lng: number, radiusM = 600) =>
    request<POIInfo[]>(
      `/api/context/pois${qs({ lat, lng, radius_m: radiusM })}`,
    ),

  generateOffer: (lat: number, lng: number, userId: string) =>
    request<GeneratedOffer>('/api/offers/generate', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, user_id: userId }),
    }),

  getOffer: (offerId: string) =>
    request<GeneratedOffer>(`/api/offers/${offerId}`),

  acceptOffer: (offerId: string) =>
    request<RedemptionToken>(`/api/redemption/accept/${offerId}`, {
      method: 'POST',
    }),

  validateToken: (tokenId: string, merchantId: string) =>
    request<ValidateResponse>('/api/redemption/validate', {
      method: 'POST',
      body: JSON.stringify({ token_id: tokenId, merchant_id: merchantId }),
    }),
};
