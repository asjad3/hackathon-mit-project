/**
 * Type scale — mirrors IMPECCABLE.md §5.
 * Sizes are absolute (RN doesn't compute rem); weights map to loaded Manrope cuts.
 */
export const fonts = {
  regular: 'Manrope_400Regular',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
  mono: 'JetBrainsMono_600SemiBold',
} as const;

export const type = {
  hero: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    lineHeight: 30, // ~1.05
    letterSpacing: -0.56, // -0.02em
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.22,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22, // relaxed
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 15,
    letterSpacing: 0.6,
  },
  chip: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  micro: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.8, // uppercase tracked
    textTransform: 'uppercase',
  },
} as const;
