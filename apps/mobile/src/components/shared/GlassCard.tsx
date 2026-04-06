import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { glass, GlassVariant, shadows } from '../../theme';

interface GlassCardProps {
  /** Visual variant of the glass effect */
  variant?: GlassVariant;
  /**
   * Which shadow preset to apply.
   * - `card`  → standard floating card shadow (default)
   * - `dark`  → deeper shadow for dark glass cards
   * - `sm`    → small shadow for inline elements (badges, pills)
   * - `none`  → no shadow
   */
  shadowPreset?: 'card' | 'dark' | 'sm' | 'none';
  /** Border radius of the card. Default: 16 */
  borderRadius?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}

/**
 * GlassCard — the base card component for the Liquid Glass design system.
 *
 * Wraps any content with a semi-transparent glass background, a top-border light
 * reflection, and a warm floating shadow. All card-shaped UI in the app should
 * use this as their outer container.
 *
 * @example
 * <GlassCard variant="amber" shadowPreset="card">
 *   <Text>Hello</Text>
 * </GlassCard>
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'light',
  shadowPreset = 'card',
  borderRadius = 16,
  style,
  children,
}) => {
  const glassStyle = glass[variant];
  const shadowStyle = shadowPreset !== 'none' ? shadows[shadowPreset] : undefined;

  return (
    <View
      style={[
        styles.base,
        { borderRadius },
        glassStyle,
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
