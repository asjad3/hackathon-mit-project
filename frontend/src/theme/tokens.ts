import { Platform } from 'react-native';
import { colors } from './colors';

/**
 * IMPECCABLE.md §6 — geometry & shadows.
 * Shadows on near-black require heavy values to register.
 */
export const radii = {
  chip: 4,
  input: 12,
  card: 20,
  sheet: 28,
  pill: 9999,
} as const;

export const spacing = (n: number) => n * 4;

const ios = Platform.OS === 'ios';

export const shadows = {
  card: ios
    ? {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      }
    : { elevation: 6 },
  elevated: ios
    ? {
        shadowColor: '#000',
        shadowOpacity: 0.6,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
      }
    : { elevation: 12 },
  glowGo: ios
    ? {
        shadowColor: colors.go,
        shadowOpacity: 0.55,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
      }
    : { elevation: 8 },
  glowWarm: ios
    ? {
        shadowColor: colors.warm,
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
      }
    : { elevation: 6 },
} as const;
