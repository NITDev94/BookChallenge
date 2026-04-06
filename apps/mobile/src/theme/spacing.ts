/**
 * Spacing scale — base unit is 4px.
 * Use these instead of magic numbers in StyleSheet definitions.
 *
 * @example
 * padding: spacing[4]   // 16px
 * gap: spacing[3]       // 12px
 * marginBottom: spacing[8] // 32px
 */
export const spacing = {
  1:  4,
  2:  8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
} as const;

export type SpacingScale = keyof typeof spacing;
