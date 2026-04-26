import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '@/theme';
import { PhoneStatusBar } from './PhoneStatusBar';
import { HomeIndicator } from './HomeIndicator';

interface Props {
  children: React.ReactNode;
  /** Override the page background. Default `colors.base`. */
  background?: string;
  /** Hide the home indicator (e.g. nested previews). */
  hideHomeIndicator?: boolean;
  /** Hide the faux status bar. */
  hideStatusBar?: boolean;
  style?: ViewStyle;
}

/**
 * Standard wrapper for every full-screen surface. Adds the IMPECCABLE chrome —
 * faux status bar, home indicator, and the canonical near-black background.
 */
export function ScreenChrome({
  children,
  background = colors.base,
  hideHomeIndicator,
  hideStatusBar,
  style,
}: Props) {
  return (
    <View style={[styles.root, { backgroundColor: background }, style]}>
      {!hideStatusBar && <PhoneStatusBar />}
      <View style={styles.body}>{children}</View>
      {!hideHomeIndicator && <HomeIndicator />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
});
