import { Platform } from 'react-native';

/**
 * Centralised shadow tokens.
 * Use `shadows.card` for all card-level components and `shadows.sm` for badges/small elements.
 * The `shadowColor` uses amber-800 (#92400e) to stay warm and coherent with the palette.
 *
 * Note: On Android, `elevation` is the only shadow property that works, so we keep it
 * alongside the iOS-specific shadow props.
 */
export const shadows = {
  /** Main card shadow — gives a clear floating sensation */
  card: Platform.select({
    ios: {
      shadowColor: '#92400e',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),

  /** Smaller shadow for badges and small UI elements */
  sm: Platform.select({
    ios: {
      shadowColor: '#92400e',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),

  /** Dark card shadow — for the XP/dark glass cards */
  dark: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
    },
    android: {
      elevation: 10,
    },
    default: {},
  }),
} as const;
