import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Heart, ThumbsDown } from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenChrome } from '@/components/ScreenChrome';
import { SecondaryButton } from '@/components/PrimaryButton';
import { colors, fonts, radii } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Dismissed'>;

export function DismissedScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Dismissed'>>();
  const { offer } = route.params;
  const close = () => navigation.popToTop();

  return (
    <ScreenChrome background={colors.base}>
      <View style={styles.peekWrap}>
        <View style={styles.peek}>
          <Text style={styles.peekLabel} numberOfLines={1}>
            {offer.merchant_name} · {offer.discount_text}
          </Text>
        </View>
      </View>

      <View style={styles.header}>
        <ChevronDown size={20} color={colors.textTertiary} strokeWidth={2.5} />
        <Text style={styles.kicker}>Dismissed</Text>
        <Text style={styles.title}>Got it. We&apos;ll back off.</Text>
        <Text style={styles.body}>Want to tell us why, so the next pick lands better?</Text>
      </View>

      <View style={styles.options}>
        <FeedbackRow
          icon={<ThumbsDown size={16} color={colors.urgent} strokeWidth={2.5} />}
          label={`Not in the mood for ${offer.product_category}`}
          onPress={close}
        />
        <FeedbackRow
          icon={<Heart size={16} color={colors.warm} strokeWidth={2.5} />}
          label="I like this place — just not now"
          onPress={close}
        />
      </View>

      <View style={{ flex: 1 }} />

      <SecondaryButton label="Skip" onPress={close} style={styles.skip} />
    </ScreenChrome>
  );
}

function FeedbackRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowHint}>tap</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  peekWrap: {
    paddingHorizontal: 20,
    marginTop: -8,
  },
  peek: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
    opacity: 0.3,
  },
  peekLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 8,
  },
  kicker: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  body: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  options: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  row: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  rowHint: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textTertiary,
  },
  skip: {
    marginHorizontal: 20,
    marginBottom: 4,
  },
});
