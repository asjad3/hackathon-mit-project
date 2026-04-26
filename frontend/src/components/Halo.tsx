import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface Props {
  /** Hex color the halo radiates. */
  color: string;
  /** Approximate diameter of the glow. Defaults to 320. */
  size?: number;
  /** Maximum opacity of the glow center. */
  intensity?: number;
  /** Whether to slowly breathe (idle warmth). */
  animated?: boolean;
  style?: ViewStyle;
}

/**
 * A soft radial halo using SVG <RadialGradient>. Used to project mood onto a screen
 * (warm = emotional offer, green = acceptance) without resorting to gradients on cards.
 */
export function Halo({ color, size = 320, intensity = 0.28, animated = true, style }: Props) {
  const breath = useRef(new Animated.Value(animated ? 0.85 : 1)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0.85, duration: 3200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, breath]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { width: size, height: size, opacity: breath },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="halo" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50">
            <Stop offset="0%" stopColor={color} stopOpacity={intensity} />
            <Stop offset="55%" stopColor={color} stopOpacity={intensity * 0.25} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#halo)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
});
