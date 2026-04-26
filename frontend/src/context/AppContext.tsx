import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  api,
  type ContextState,
  type GeneratedOffer,
  type RedemptionToken,
} from '@/services/api';

interface UserLocation {
  lat: number;
  lng: number;
  city: string;
}

export interface WalletItem {
  offer: GeneratedOffer;
  token: RedemptionToken;
  redeemedAt?: string;
}

interface AppState {
  location: UserLocation | null;
  locationLoading: boolean;
  context: ContextState | null;
  contextLoading: boolean;
  currentOffer: GeneratedOffer | null;
  offerLoading: boolean;
  wallet: WalletItem[];
  error: string | null;
  userId: string;
}

interface AppActions {
  refreshContext: () => Promise<void>;
  fetchOffer: () => Promise<GeneratedOffer | null>;
  acceptOffer: (offer: GeneratedOffer) => Promise<RedemptionToken | null>;
  addToWallet: (offer: GeneratedOffer, token: RedemptionToken) => void;
  markRedeemed: (tokenId: string) => void;
  clearOffer: () => void;
  clearError: () => void;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

const FALLBACK_LOCATION: UserLocation = {
  lat: 33.6844,
  lng: 73.0479,
  city: 'Islamabad',
};

function generateUserId(): string {
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `user-${hex()}${hex()}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [context, setContext] = useState<ContextState | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<GeneratedOffer | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [wallet, setWallet] = useState<WalletItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef(generateUserId());

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation(FALLBACK_LOCATION);
          setLocationLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          city: geo?.city ?? geo?.subregion ?? geo?.region ?? 'Unknown',
        });
      } catch {
        setLocation(FALLBACK_LOCATION);
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const refreshContext = useCallback(async () => {
    const loc = location ?? FALLBACK_LOCATION;
    setContextLoading(true);
    setError(null);
    try {
      const ctx = await api.getContext(loc.lat, loc.lng, loc.city);
      setContext(ctx);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load context');
    } finally {
      setContextLoading(false);
    }
  }, [location]);

  useEffect(() => {
    if (location) {
      refreshContext();
    }
  }, [location, refreshContext]);

  const fetchOffer = useCallback(async (): Promise<GeneratedOffer | null> => {
    const loc = location ?? FALLBACK_LOCATION;
    setOfferLoading(true);
    setError(null);
    try {
      const offer = await api.generateOffer(loc.lat, loc.lng, userIdRef.current);
      setCurrentOffer(offer);
      return offer;
    } catch (e: any) {
      setError(e.message ?? 'No offers available nearby');
      return null;
    } finally {
      setOfferLoading(false);
    }
  }, [location]);

  const acceptOffer = useCallback(
    async (offer: GeneratedOffer): Promise<RedemptionToken | null> => {
      setError(null);
      try {
        const token = await api.acceptOffer(offer.offer_id);
        return token;
      } catch (e: any) {
        setError(e.message ?? 'Failed to accept offer');
        return null;
      }
    },
    [],
  );

  const addToWallet = useCallback((offer: GeneratedOffer, token: RedemptionToken) => {
    setWallet((prev) => [{ offer, token }, ...prev]);
  }, []);

  const markRedeemed = useCallback((tokenId: string) => {
    setWallet((prev) =>
      prev.map((item) =>
        item.token.token_id === tokenId
          ? { ...item, token: { ...item.token, status: 'redeemed' }, redeemedAt: new Date().toISOString() }
          : item,
      ),
    );
  }, []);

  const clearOffer = useCallback(() => setCurrentOffer(null), []);
  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AppContextValue>(
    () => ({
      location,
      locationLoading,
      context,
      contextLoading,
      currentOffer,
      offerLoading,
      wallet,
      error,
      userId: userIdRef.current,
      refreshContext,
      fetchOffer,
      acceptOffer,
      addToWallet,
      markRedeemed,
      clearOffer,
      clearError,
    }),
    [
      location, locationLoading, context, contextLoading,
      currentOffer, offerLoading, wallet, error,
      refreshContext, fetchOffer, acceptOffer, addToWallet,
      markRedeemed, clearOffer, clearError,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
