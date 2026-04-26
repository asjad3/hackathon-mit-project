import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';

import { ScreenChrome } from '@/components/ScreenChrome';
import { Halo } from '@/components/Halo';
import { SecondaryButton } from '@/components/PrimaryButton';
import { colors, fonts, radii, shadows } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Redemption'>;

export function RedemptionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Redemption'>>();
  const { offer, token } = route.params;

  const done = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  const expiresTime = (() => {
    try {
      const d = new Date(token.expires_at);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  return (
    <ScreenChrome background={colors.base}>
      <Halo color={colors.go} size={420} intensity={0.30} style={styles.halo} />

      <View style={styles.successHeader}>
        <View style={[styles.successCheck, shadows.glowGo]}>
          <Check size={28} color={colors.textOnAccent} strokeWidth={3} />
        </View>
        <Text style={styles.kicker}>Offer accepted</Text>
        <Text style={styles.title}>
          Show this at the counter.{'\n'}
          <Text style={styles.titleDim}>It&apos;s already yours.</Text>
        </Text>
      </View>

      <View style={[styles.card, shadows.elevated]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.merchantEmoji}>
              <Text style={{ fontSize: 18 }}>{offer.visuals.emoji}</Text>
            </View>
            <View>
              <Text style={styles.cardMerchant}>{offer.merchant_name}</Text>
              <Text style={styles.cardMeta}>
                {offer.discount_text} · {offer.product_category}
              </Text>
            </View>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeLabel}>Live</Text>
          </View>
        </View>

        <View style={styles.qrWrap}>
          <QRCode
            value={token.qr_data || `citywallet://redeem?token=${token.token_id}`}
            size={180}
            backgroundColor="#ffffff"
            color="#0a0a0a"
          />
        </View>

        <Text style={styles.tokenText}>{token.token_id}</Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.footer}>
        <View style={styles.metaCard}>
          <View style={styles.metaLeft}>
            <Clock size={14} color={colors.textSecondary} strokeWidth={2.5} />
            <Text style={styles.metaLabel}>
              Single use{expiresTime ? ` · expires ${expiresTime}` : ''}
            </Text>
          </View>
          <Text style={styles.metaDiscount}>{offer.discount_text}</Text>
        </View>

        <SecondaryButton label="Done" onPress={done} style={styles.doneBtn} />
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  halo: {
    top: -180,
    left: '50%',
    marginLeft: -210,
  },
  successHeader: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  successCheck: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.go,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.go,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.24,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  titleDim: {
    color: colors.textSecondary,
  },

  card: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  merchantEmoji: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMerchant: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#0a0a0a',
  },
  cardMeta: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: '#6b6b6b',
    textTransform: 'capitalize',
    marginTop: 1,
  },
  liveBadge: {
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  liveBadgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.go,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  qrWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  tokenText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: '#6b6b6b',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 12,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.whiteFaint,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaDiscount: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.go,
  },
  doneBtn: {
    height: 48,
    backgroundColor: colors.inputBg,
    borderRadius: radii.pill,
  },
});
