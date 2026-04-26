import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Signal, Wifi, BatteryFull } from 'lucide-react-native';
import { colors, fonts } from '@/theme';

interface Props {
  time?: string;
}

/** Faux iOS status bar — drawn inside the app canvas, not the system bar. */
export function PhoneStatusBar({ time = '15:42' }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.time}>{time}</Text>
      <View style={styles.icons}>
        <Signal size={14} color={colors.textPrimary} strokeWidth={2.5} />
        <Wifi size={14} color={colors.textPrimary} strokeWidth={2.5} />
        <BatteryFull size={16} color={colors.textPrimary} strokeWidth={2.5} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  time: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
