import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ChevronDown,
  Clock,
  Cloud,
  CloudRain,
  MapPin,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenChrome } from '@/components/ScreenChrome';
import { Halo } from '@/components/Halo';
import { LivePulse } from '@/components/LivePulse';
import { ContextChip } from '@/components/ContextChip';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import { colors, fonts, radii } from '@/theme';
import { useApp } from '@/context/AppContext';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Offer'>;

export function OfferScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Offer'>>();
  const { offer } = route.params;
  const { context, acceptOffer, addToWallet } = useApp();
  const [accepting, setAccepting] = useState(false);

  const weather = context?.weather;

  const [remaining, setRemaining] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const exp = new Date(offer.expires_at).getTime();
      const diff = Math.max(0, exp - now);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}m ${secs.toString().padStart(2, '0')}s`);
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [offer.expires_at]);

  const handleAccept = useCallback(async () => {
    setAccepting(true);
    const token = await acceptOffer(offer);
    setAccepting(false);
    if (token) {
      addToWallet(offer, token);
      navigation.replace('Redemption', { offer, token });
    }
  }, [offer, acceptOffer, addToWallet, navigation]);

  const handleDismiss = useCallback(() => {
    navigation.replace('Dismissed', { offer });
  }, [offer, navigation]);

  const accent = offer.visuals.mood === 'warm' ? colors.warm : colors.go;

  const weatherChip = useMemo(() => {
    if (!weather) return null;
    const icon =
      weather.condition === 'rain' || weather.condition === 'drizzle'
        ? <CloudRain size={12} color={colors.info} strokeWidth={2.5} />
        : weather.condition === 'clear'
          ? <Sun size={12} color={colors.warm} strokeWidth={2.5} />
          : <Cloud size={12} color={colors.textSecondary} strokeWidth={2.5} />;
    return (
      <ContextChip icon={icon} label={`${weather.description} · ${Math.round(weather.temp_c)}°C`} />
    );
  }, [weather]);

  return (
    <ScreenChrome background={colors.base}>
      <Halo color={accent} size={420} intensity={0.28} animated style={styles.haloHero} />

      {/* Top row */}
      <View style={styles.topRow}>
        <Pressable onPress={handleDismiss} style={styles.dismissBtn} accessibilityLabel="Dismiss offer">
          <ChevronDown size={16} color={colors.textTertiary} strokeWidth={2.5} />
          <Text style={styles.dismissLabel}>dismiss</Text>
        </Pressable>
        <View style={styles.liveStatus}>
          <LivePulse color={colors.go} size={6} />
          <Text style={styles.liveLabel}>Live offer</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Context chips */}
        <View style={styles.chipRow}>
          {weatherChip}
          <ContextChip
            icon={<Zap size={12} color={colors.go} strokeWidth={2.5} />}
            label={offer.product_category}
          />
          <ContextChip
            icon={<Clock size={12} color={colors.textSecondary} strokeWidth={2.5} />}
            label={remaining || `${offer.valid_minutes}m`}
          />
        </View>

        {/* Hero */}
        <Text style={styles.hero}>
          {offer.headline.split(' ').slice(0, 3).join(' ')}{'\n'}
          <Text style={[styles.heroAccent, { color: accent }]}>
            {offer.headline.split(' ').slice(3).join(' ') || offer.discount_text}
          </Text>
        </Text>

        <Text style={styles.lede}>{offer.body}</Text>

        {/* Merchant card */}
        <View style={styles.merchant}>
          <View style={styles.merchantHeader}>
            <View style={styles.merchantEmoji}>
              <Text style={{ fontSize: 24 }}>{offer.visuals.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.merchantName}>{offer.merchant_name}</Text>
              <Text style={styles.merchantMeta}>{offer.product_category} · {offer.merchant_id}</Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountLabel}>{offer.discount_text}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action footer */}
      <View style={styles.footer}>
        <View style={styles.timerRow}>
          <View style={styles.timerLeft}>
            <Clock size={14} color={colors.textTertiary} strokeWidth={2.5} />
            <Text style={styles.timerLabel}>Expires in {remaining}</Text>
          </View>
        </View>

        <PrimaryButton
          label={accepting ? '' : 'Accept offer'}
          onPress={handleAccept}
          style={accepting ? styles.acceptingBtn : undefined}
        />
        {accepting && (
          <View style={styles.acceptingOverlay}>
            <ActivityIndicator color={colors.textOnAccent} />
          </View>
        )}
        <SecondaryButton label="Not now" onPress={handleDismiss} />
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  haloHero: {
    top: -160,
    left: '50%',
    marginLeft: -210,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dismissLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.go,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scroll: {
    paddingBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  hero: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.56,
    color: colors.textPrimary,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  heroAccent: {},
  lede: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  merchant: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    marginTop: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  merchantEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  merchantMeta: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  discountBadge: {
    backgroundColor: colors.goSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  discountLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.go,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    position: 'relative',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  acceptingBtn: {
    opacity: 0.7,
  },
  acceptingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    top: 28,
    bottom: 48,
  },
});
