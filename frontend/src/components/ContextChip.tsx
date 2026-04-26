import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, fonts, radii } from '@/theme';

interface Props {
  icon?: React.ReactNode;
  label: string;
  tone?: 'default' | 'glass';
  style?: ViewStyle;
}

/** Small, dense pill carrying a single contextual fact (distance, weather, time). */
export function ContextChip({ icon, label, tone = 'default', style }: Props) {
  return (
    <View style={[styles.chip, tone === 'glass' && styles.glass, style]}>
      {icon}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.whiteFaint,
  },
  glass: {
    backgroundColor: colors.whiteMid,
    borderColor: 'transparent',
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
