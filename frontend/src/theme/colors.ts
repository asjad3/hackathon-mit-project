/**
 * IMPECCABLE color tokens — single source of truth for the City Wallet RN app.
 * Mirrors `IMPECCABLE.md` §4. Do not introduce new colors without updating that doc.
 */
export const colors = {
  // Surfaces
  base: '#0a0a0a',
  baseDeep: '#070707', // lock-screen wallpaper, pre-dawn
  surface: '#141414',
  elevated: '#1c1c1c',
  inputBg: '#242424',
  borderSubtle: '#2a2a2a',
  borderStrong: '#3a3a3a',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#a3a3a3',
  textTertiary: '#6b6b6b',
  textOnAccent: '#0a0a0a',

  // Functional accents — meaning, never decoration
  go: '#1ed760', // acceptance, live, success
  warm: '#ffb547', // emotional / situational warmth
  urgent: '#f3727f', // expiry, last 60s
  info: '#539df5', // weather, location signal

  // Translucent helpers
  goSoft: 'rgba(30, 215, 96, 0.15)',
  goRing: 'rgba(30, 215, 96, 0.30)',
  goGlow: 'rgba(30, 215, 96, 0.25)',
  warmSoft: 'rgba(255, 181, 71, 0.15)',
  warmRing: 'rgba(255, 181, 71, 0.30)',
  warmGlow: 'rgba(255, 181, 71, 0.25)',

  whiteFaint: 'rgba(255, 255, 255, 0.05)',
  whiteSoft: 'rgba(255, 255, 255, 0.08)',
  whiteMid: 'rgba(255, 255, 255, 0.10)',
  whiteHi: 'rgba(255, 255, 255, 0.40)',

  cardSurfaceTranslucent: 'rgba(20, 20, 20, 0.85)',
  elevatedTranslucent: 'rgba(28, 28, 28, 0.85)',
} as const;

export type ColorToken = keyof typeof colors;
