import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

interface Props {
  color?: string;
  size?: number;
  style?: ViewStyle;
}

/** Slow breathing dot — used next to "Live" or "Picked for you" labels. */
export function LivePulse({ color = colors.go, size = 6, style }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: color, borderRadius: size, opacity },
        ]}
      />
    </View>
  );
}
