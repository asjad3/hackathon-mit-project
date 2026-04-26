# City Wallet — React Native MVP

A pixel-faithful Expo port of the IMPECCABLE design system demo. Same six screens as
the web prototype (`/screens` in the Next.js project), now rendered as a real native app.

## What you get

| Channel | Screen | File |
|---|---|---|
| L0 + L1 | Lock screen — push + glanceable widget | `src/screens/LockScreen.tsx` |
| L2 | Homescreen banner above the dock | `src/screens/HomeScreen.tsx` |
| L3 (emotional) | Offer card — situational hook | `src/screens/OfferScreen.tsx` (`variant: emotional`) |
| L3 (factual) | Offer card — task-focused | `src/screens/OfferScreen.tsx` (`variant: factual`) |
| Accepted | QR redemption + success glow | `src/screens/RedemptionScreen.tsx` |
| Expired | Graceful closure, save-for-later | `src/screens/ExpiredScreen.tsx` |
| Dismissed | Soft swipe + learning prompts | `src/screens/DismissedScreen.tsx` |

A `HubScreen` curates them as a guided three-act demo (Sense → Reveal → End).

## Run it

```bash
cd mobile
npm install            # or pnpm install / yarn
npx expo start         # opens the Expo dev tools
```

Then:

- Press `i` for iOS simulator (Mac + Xcode required)
- Press `a` for Android emulator
- Or scan the QR with the **Expo Go** app on your phone

## Architecture

- **Theme** (`src/theme/`) — colors, type, radii, shadows. Single source of truth
  derived from `IMPECCABLE.md` in the project root.
- **Components** (`src/components/`) — chrome (status bar, home indicator),
  primitives (chips, buttons, halos, QR pattern, live pulse).
- **Screens** (`src/screens/`) — each canonical surface, one file each.
- **Navigation** (`src/navigation/`) — typed native stack. `Hub → any screen → back to Hub`.

## Design fidelity notes

- **Halos** use `<RadialGradient>` from `react-native-svg` (RN has no radial CSS).
- **Glassy notifications** on the lock screen use `expo-blur`'s `BlurView` over the
  wallpaper layer — matches iOS notification chrome.
- **Manrope** loads via `@expo-google-fonts/manrope` so type weights are identical
  across web and mobile.
- **QR** is a decorative pattern with the same pseudo-random seed as the web demo.
  For real redemption, swap `QrPattern` for `react-native-qrcode-svg`.
