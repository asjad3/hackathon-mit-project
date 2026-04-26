import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  MapPin,
  Sparkles,
  Sun,
  Thermometer,
  Zap,
} from 'lucide-react-native';

import { Halo } from '@/components/Halo';
import { LivePulse } from '@/components/LivePulse';
import { colors, fonts, radii, shadows } from '@/theme';
import { useApp } from '@/context/AppContext';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  clear: <Sun size={28} color={colors.warm} strokeWidth={2} />,
  clouds: <Cloud size={28} color={colors.textSecondary} strokeWidth={2} />,
  rain: <CloudRain size={28} color={colors.info} strokeWidth={2} />,
  drizzle: <CloudDrizzle size={28} color={colors.info} strokeWidth={2} />,
  snow: <CloudSnow size={28} color="#b8d4e3" strokeWidth={2} />,
  thunderstorm: <CloudLightning size={28} color={colors.urgent} strokeWidth={2} />,
  fog: <CloudFog size={28} color={colors.textTertiary} strokeWidth={2} />,
};

function weatherAccent(condition: string): string {
  switch (condition) {
    case 'clear': return colors.warm;
    case 'rain': case 'drizzle': case 'thunderstorm': return colors.info;
    case 'snow': return '#b8d4e3';
    default: return colors.textSecondary;
  }
}

export function ExploreScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {
    location, locationLoading,
    context, contextLoading,
    offerLoading, error,
    refreshContext, fetchOffer, clearError,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshContext();
    setRefreshing(false);
  }, [refreshContext]);

  const handleDiscover = useCallback(async () => {
    clearError();
    const offer = await fetchOffer();
    if (offer) {
      nav.navigate('Offer', { offer });
    }
  }, [fetchOffer, nav, clearError]);

  const weather = context?.weather;
  const events = context?.events ?? [];
  const zone = context?.zone;
  const accent = weather ? weatherAccent(weather.condition) : colors.info;

  if (locationLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.go} />
        <Text style={styles.loadingLabel}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Halo color={accent} size={380} intensity={0.14} animated style={styles.haloTop} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.go} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <LivePulse color={colors.go} size={6} />
            <Text style={styles.brand}>City Wallet</Text>
          </View>
          {location && (
            <View style={styles.locationRow}>
              <MapPin size={12} color={colors.go} strokeWidth={2.5} />
              <Text style={styles.locationLabel}>{location.city}</Text>
            </View>
          )}
        </View>

        {/* Weather card */}
        {weather && !contextLoading && (
          <View style={[styles.weatherCard, shadows.card]}>
            <Halo color={accent} size={200} intensity={0.25} style={styles.weatherGlow} animated={false} />
            <View style={styles.weatherTop}>
              <View>
                <Text style={styles.weatherTemp}>{Math.round(weather.temp_c)}°</Text>
                <Text style={styles.weatherDesc}>{weather.description}</Text>
              </View>
              {WEATHER_ICONS[weather.condition] ?? WEATHER_ICONS.clouds}
            </View>
            <View style={styles.weatherMeta}>
              <View style={styles.weatherMetaItem}>
                <Thermometer size={12} color={colors.textTertiary} strokeWidth={2.5} />
                <Text style={styles.weatherMetaLabel}>
                  Feels {Math.round(weather.feels_like_c)}°
                </Text>
              </View>
              <View style={styles.weatherMetaItem}>
                <Cloud size={12} color={colors.textTertiary} strokeWidth={2.5} />
                <Text style={styles.weatherMetaLabel}>{weather.humidity}% humidity</Text>
              </View>
              <View style={styles.weatherMetaItem}>
                <MapPin size={12} color={colors.textTertiary} strokeWidth={2.5} />
                <Text style={styles.weatherMetaLabel}>{weather.city}</Text>
              </View>
            </View>
          </View>
        )}

        {contextLoading && !weather && (
          <View style={[styles.weatherCard, styles.loadingCard]}>
            <ActivityIndicator color={colors.textSecondary} />
            <Text style={styles.loadingCardLabel}>Loading context...</Text>
          </View>
        )}

        {/* Zone badge */}
        {zone && (
          <View style={styles.zoneBadge}>
            <Zap size={14} color={colors.go} strokeWidth={2.5} />
            <Text style={styles.zoneText}>
              You're in <Text style={styles.zoneName}>{zone.name}</Text> — offers are available!
            </Text>
          </View>
        )}

        {!zone && !contextLoading && context && (
          <View style={[styles.zoneBadge, styles.zoneInactive]}>
            <MapPin size={14} color={colors.textTertiary} strokeWidth={2.5} />
            <Text style={[styles.zoneText, { color: colors.textTertiary }]}>
              No merchant zone nearby — try a different area
            </Text>
          </View>
        )}

        {/* Events */}
        {events.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={16} color={colors.warm} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>What's happening</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsRow}
            >
              {events.map((event) => (
                <View key={event.event_id} style={[styles.eventCard, shadows.card]}>
                  <Text style={styles.eventCategory}>{event.category.toUpperCase()}</Text>
                  <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
                  <View style={styles.eventMeta}>
                    <MapPin size={10} color={colors.textTertiary} strokeWidth={2.5} />
                    <Text style={styles.eventMetaLabel}>
                      {event.distance_km < 1
                        ? `${Math.round(event.distance_km * 1000)}m`
                        : `${event.distance_km.toFixed(1)}km`}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={clearError}>
              <Text style={styles.errorDismiss}>OK</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Discover CTA */}
      <View style={[styles.ctaWrap, { paddingBottom: 16 }]}>
        <Pressable
          onPress={handleDiscover}
          disabled={offerLoading || contextLoading}
          style={({ pressed }) => [
            styles.ctaButton,
            shadows.glowGo,
            (offerLoading || contextLoading) && styles.ctaDisabled,
            pressed && styles.ctaPressed,
          ]}
        >
          {offerLoading ? (
            <ActivityIndicator color={colors.textOnAccent} />
          ) : (
            <>
              <Sparkles size={20} color={colors.textOnAccent} strokeWidth={2.5} />
              <Text style={styles.ctaLabel}>Discover Offer</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  haloTop: {
    position: 'absolute',
    top: -140,
    left: '50%',
    marginLeft: -190,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.goRing,
  },
  locationLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.go,
  },

  weatherCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
    overflow: 'hidden',
  },
  weatherGlow: {
    top: -60,
    right: -60,
  },
  weatherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weatherTemp: {
    fontFamily: fonts.extrabold,
    fontSize: 48,
    color: colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 50,
  },
  weatherDesc: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  weatherMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  weatherMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherMetaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textTertiary,
  },

  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 140,
  },
  loadingCardLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textTertiary,
  },

  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goSoft,
    borderWidth: 1,
    borderColor: colors.goRing,
    borderRadius: radii.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  zoneInactive: {
    backgroundColor: colors.whiteFaint,
    borderColor: colors.borderSubtle,
  },
  zoneText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.go,
    flex: 1,
  },
  zoneName: {
    fontFamily: fonts.bold,
  },

  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eventsRow: {
    gap: 10,
    paddingRight: 20,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    width: 200,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
  },
  eventCategory: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: colors.warm,
    letterSpacing: 0.8,
  },
  eventName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 6,
    lineHeight: 17,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  eventMetaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textTertiary,
  },

  errorBanner: {
    backgroundColor: 'rgba(243, 114, 127, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(243, 114, 127, 0.30)',
    borderRadius: radii.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.urgent,
    flex: 1,
  },
  errorDismiss: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.urgent,
    marginLeft: 12,
  },

  ctaWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  ctaButton: {
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.go,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  ctaLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textOnAccent,
    letterSpacing: 0.3,
  },
});
