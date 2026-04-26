import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  size?: number;
  cells?: number;
}

/**
 * Decorative QR pattern. Same pseudo-random algorithm as the web demo so the
 * "QR" looks consistent across platforms. Not scannable — this is a UI demo.
 */
export function QrPattern({ size = 180, cells = 12 }: Props) {
  const cellSize = (size - 16) / cells;
  const total = cells * cells;

  const grid = useMemo(() => {
    return Array.from({ length: total }).map((_, i) => {
      const corners = [0, cells - 1, total - cells, total - 1];
      return ((i * 73 + 19) % 7 < 3) || corners.includes(i);
    });
  }, [cells, total]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={styles.inner}>
        {grid.map((on, i) => (
          <View
            key={i}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: on ? '#0a0a0a' : '#ffffff',
              borderRadius: 1,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  inner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
});
