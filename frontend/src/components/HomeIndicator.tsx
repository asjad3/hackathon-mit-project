import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

export function HomeIndicator() {
  return (
    <View style={styles.row}>
      <View style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 4,
  },
  bar: {
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.whiteHi,
  },
});
