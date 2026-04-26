import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Coffee,
  Globe,
  MapPin,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from 'lucide-react-native';

import { Halo } from '@/components/Halo';
import { colors, fonts, radii, shadows } from '@/theme';
import { useApp } from '@/context/AppContext';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  cafe: <Coffee size={18} color={colors.warm} strokeWidth={2} />,
  restaurant: <UtensilsCrossed size={18} color={colors.go} strokeWidth={2} />,
  bar: <Store size={18} color={colors.info} strokeWidth={2} />,
  pub: <Store size={18} color={colors.info} strokeWidth={2} />,
  shop: <ShoppingBag size={18} color="#c084fc" strokeWidth={2} />,
};

function categoryAccent(cat: string): string {
  switch (cat) {
    case 'cafe': return colors.warm;
    case 'restaurant': return colors.go;
    case 'bar': case 'pub': return colors.info;
    case 'shop': return '#c084fc';
    default: return colors.textSecondary;
  }
}

export function NearbyScreen() {
  const insets = useSafeAreaInsets();
  const { context, contextLoading, refreshContext } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const pois = context?.pois ?? [];
  const events = context?.events ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshContext();
    setRefreshing(false);
  }, [refreshContext]);

  return (
    <View style={styles.root}>
      <Halo color={colors.info} size={340} intensity={0.10} animated={false} style={styles.halo} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.go} />
        }
      >
        <Text style={styles.title}>Nearby</Text>
        <Text style={styles.subtitle}>Places and events around you</Text>

        {contextLoading && pois.length === 0 && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.textSecondary} />
            <Text style={styles.loadingLabel}>Loading nearby places...</Text>
          </View>
        )}

        {/* POIs */}
        {pois.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={16} color={colors.go} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Places</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countLabel}>{pois.length}</Text>
              </View>
            </View>
            {pois.map((poi) => {
              const accent = categoryAccent(poi.category);
              return (
                <View key={poi.poi_id} style={[styles.poiCard, shadows.card]}>
                  <View style={[styles.poiIcon, { backgroundColor: `${accent}20`, borderColor: `${accent}40` }]}>
                    {CATEGORY_ICONS[poi.category] ?? <Globe size={18} color={colors.textSecondary} strokeWidth={2} />}
                  </View>
                  <View style={styles.poiContent}>
                    <Text style={styles.poiName}>{poi.name}</Text>
                    <Text style={styles.poiCategory}>{poi.category}</Text>
                  </View>
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceLabel}>
                      {poi.distance_km < 1
                        ? `${Math.round(poi.distance_km * 1000)}m`
                        : `${poi.distance_km.toFixed(1)}km`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Events */}
        {events.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={16} color={colors.warm} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Events</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countLabel}>{events.length}</Text>
              </View>
            </View>
            {events.map((event) => (
              <View key={event.event_id} style={[styles.eventCard, shadows.card]}>
                <View style={styles.eventLeft}>
                  <Text style={styles.eventBadge}>{event.category.toUpperCase()}</Text>
                  <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
                  <View style={styles.eventMetaRow}>
                    <MapPin size={10} color={colors.textTertiary} strokeWidth={2.5} />
                    <Text style={styles.eventMetaText}>{event.venue}</Text>
                    <Text style={styles.eventDot}>·</Text>
                    <Text style={styles.eventMetaText}>
                      {event.distance_km < 1
                        ? `${Math.round(event.distance_km * 1000)}m`
                        : `${event.distance_km.toFixed(1)}km`}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {!contextLoading && pois.length === 0 && events.length === 0 && (
          <View style={styles.emptyWrap}>
            <MapPin size={40} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Nothing nearby yet</Text>
            <Text style={styles.emptyBody}>Pull down to refresh or try a different area.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },
  halo: {
    position: 'absolute',
    top: -120,
    right: -80,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textTertiary,
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
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.whiteMid,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  countLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  poiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
    gap: 12,
  },
  poiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  poiContent: {
    flex: 1,
  },
  poiName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  poiCategory: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  distanceLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
  },
  eventLeft: {
    flex: 1,
  },
  eventBadge: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: colors.warm,
    letterSpacing: 0.8,
  },
  eventName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  eventMetaText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textTertiary,
  },
  eventDot: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textTertiary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textSecondary,
  },
  emptyBody: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
