import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, shadows, type } from '@/theme';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'go' | 'neutral';
  style?: StyleProp<ViewStyle>;
}

/** Pill button — full-width primary CTA. `go` is for acceptance; `neutral` for non-decision actions. */
export function PrimaryButton({ label, onPress, variant = 'go', style }: Props) {
  const isGo = variant === 'go';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isGo ? styles.go : styles.neutral,
        isGo && shadows.glowGo,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.label, isGo ? styles.labelGo : styles.labelNeutral]}>{label}</Text>
    </Pressable>
  );
}

interface SecondaryProps {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Quiet ghost button — for "Save for later", "Done", "Skip". */
export function SecondaryButton({ label, onPress, icon, style }: SecondaryProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.ghostInner}>
        {icon}
        <Text style={styles.ghostLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  go: { backgroundColor: colors.go },
  neutral: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.whiteFaint },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  label: { ...type.button },
  labelGo: { color: colors.textOnAccent },
  labelNeutral: { color: colors.textPrimary },
  ghost: { height: 44, alignItems: 'center', justifyContent: 'center' },
  ghostInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ghostLabel: {
    ...type.bodyBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
});
