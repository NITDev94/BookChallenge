/**
 * Liquid Glass design tokens.
 *
 * Inspired by Apple's visionOS/iOS 26 "liquid glass" aesthetic:
 * - Semi-transparent background (not aggressively frosted)
 * - Bright top border simulating light reflection on glass
 * - Subtle bottom/side border for depth
 *
 * Variants:
 *  - `light`  → white glass, for standard cards on light backgrounds
 *  - `amber`  → warm amber-tinted glass, for cards on the amber gradient header
 *  - `dark`   → deep glass, for dark-themed cards (XP card, dark challenge cards)
 */
export const glass = {
  /**
   * White glass — default card on white/stone background.
   * Bottom/side border: visible stone-300 for definition on white.
   * Top border: bright white simulating glass light reflection.
   */
  light: {
    backgroundColor: 'rgba(255, 253, 248, 0.96)',   // very subtle warm tint
    borderColor: 'rgba(214, 211, 209, 0.55)',         // stone-300 — visible on white bg
    borderTopColor: 'rgba(255, 255, 255, 1)',          // bright top reflection
    borderWidth: 1 as const,
    borderTopWidth: 1.5 as const,
  },

  /** Amber-tinted glass — warm cards that sit on the amber gradient area */
  amber: {
    backgroundColor: 'rgba(255, 251, 235, 0.88)',
    borderColor: 'rgba(180, 160, 80, 0.25)',          // warm gold border — visible on amber bg
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1 as const,
    borderTopWidth: 1.5 as const,
  },

  /** Dark glass — for dark-themed cards */
  dark: {
    backgroundColor: 'rgba(12, 8, 4, 0.87)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderTopColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1 as const,
    borderTopWidth: 1 as const,
  },
} as const;

export type GlassVariant = keyof typeof glass;
