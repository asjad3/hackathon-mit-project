import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenChrome } from '@/components/ScreenChrome';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import { colors, fonts, radii } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Expired'>;

export function ExpiredScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Expired'>>();
  const { offer } = route.params;

  return (
    <ScreenChrome background={colors.base}>
      <View style={styles.topRow}>
        <Text style={styles.kicker}>Closed</Text>
        <Text style={styles.kickerRight}>{offer.product_category}</Text>
      </View>

      <View style={styles.fadedCard}>
        <View style={styles.headRow}>
          <View style={styles.iconTile}>
            <Text style={{ fontSize: 22 }}>{offer.visuals.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.merchant}>{offer.merchant_name}</Text>
            <Text style={styles.expiredMeta}>{offer.discount_text} · expired</Text>
          </View>
        </View>

        <Text style={styles.title}>
          The moment passed.{'\n'}
          <Text style={styles.titleDim}>No worries — there&apos;ll be another.</Text>
        </Text>

        <Text style={styles.body}>
          We won&apos;t bother you about this one again. We&apos;ll watch for the next quiet
          window at a place you might like.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.footer}>
        <PrimaryButton
          label={`Save ${offer.merchant_name} for later`}
          variant="neutral"
          onPress={() => navigation.popToTop()}
          style={styles.saveBtn}
        />
        <SecondaryButton
          label="Show me what's nearby"
          icon={<RotateCcw size={14} color={colors.textTertiary} strokeWidth={2.5} />}
          onPress={() => navigation.popToTop()}
        />
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  kicker: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  kickerRight: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fadedCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
    opacity: 0.7,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchant: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.textSecondary,
  },
  expiredMeta: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.22,
    color: colors.textSecondary,
    marginTop: 20,
  },
  titleDim: {
    color: colors.textTertiary,
  },
  body: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textTertiary,
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  saveBtn: {
    height: 48,
  },
});
