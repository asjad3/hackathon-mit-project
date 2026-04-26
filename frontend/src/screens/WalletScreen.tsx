import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Clock, Receipt, Wallet } from 'lucide-react-native';

import { colors, fonts, radii, shadows } from '@/theme';
import { useApp, type WalletItem } from '@/context/AppContext';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function WalletScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { wallet } = useApp();

  const active = wallet.filter((w) => w.token.status === 'active');
  const redeemed = wallet.filter((w) => w.token.status === 'redeemed');

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Wallet</Text>
        <Text style={styles.subtitle}>Your offers and tokens</Text>

        {wallet.length === 0 && (
          <View style={styles.emptyWrap}>
            <Wallet size={48} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No offers yet</Text>
            <Text style={styles.emptyBody}>
              Accept an offer from the Explore tab to see it here.
            </Text>
          </View>
        )}

        {active.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={16} color={colors.go} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Active</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.goSoft }]}>
                <Text style={[styles.countLabel, { color: colors.go }]}>{active.length}</Text>
              </View>
            </View>
            {active.map((item) => (
              <WalletCard
                key={item.token.token_id}
                item={item}
                onPress={() => nav.navigate('Redemption', { offer: item.offer, token: item.token })}
              />
            ))}
          </View>
        )}

        {redeemed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Check size={16} color={colors.textTertiary} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Redeemed</Text>
            </View>
            {redeemed.map((item) => (
              <WalletCard key={item.token.token_id} item={item} dimmed />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function WalletCard({
  item,
  onPress,
  dimmed,
}: {
  item: WalletItem;
  onPress?: () => void;
  dimmed?: boolean;
}) {
  const { offer, token } = item;
  const isActive = token.status === 'active';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        dimmed && styles.cardDimmed,
        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardEmoji}>
          <Text style={{ fontSize: 22 }}>{offer.visuals.emoji}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardMerchant, dimmed && styles.textDimmed]}>{offer.merchant_name}</Text>
          <Text style={[styles.cardHeadline, dimmed && styles.textDimmed]} numberOfLines={1}>
            {offer.headline}
          </Text>
        </View>
        <View style={[styles.discountBadge, dimmed && styles.badgeDimmed]}>
          <Text style={[styles.discountLabel, dimmed && { color: colors.textTertiary }]}>
            {offer.discount_text}
          </Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.cardMeta}>
          <Receipt size={11} color={colors.textTertiary} strokeWidth={2.5} />
          <Text style={styles.cardMetaLabel}>{token.token_id}</Text>
        </View>
        <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusRedeemed]}>
          <Text style={[styles.statusLabel, isActive ? styles.statusLabelActive : styles.statusLabelRedeemed]}>
            {isActive ? 'Active' : 'Redeemed'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
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
    paddingHorizontal: 20,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  countLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
  },
  cardDimmed: {
    opacity: 0.6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardMerchant: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  cardHeadline: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textDimmed: {
    color: colors.textTertiary,
  },
  discountBadge: {
    backgroundColor: colors.goSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeDimmed: {
    backgroundColor: colors.whiteFaint,
  },
  discountLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.go,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.whiteFaint,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusActive: {
    backgroundColor: colors.goSoft,
    borderWidth: 1,
    borderColor: colors.goRing,
  },
  statusRedeemed: {
    backgroundColor: colors.whiteFaint,
  },
  statusLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statusLabelActive: {
    color: colors.go,
  },
  statusLabelRedeemed: {
    color: colors.textTertiary,
  },
});
