import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  variant = 'primary',
  isLoading = false,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isSecondary = variant === 'secondary';

  const getBackgroundColor = () => {
    if (disabled && !isGhost) return colors.border;
    if (isPrimary) return colors.primary;
    if (isOutline || isGhost) return 'transparent';
    if (isSecondary) return colors.secondary;
    return colors.primary;
  };

  const getTextColor = () => {
    if (disabled && !isGhost) return colors.text.secondary;
    if (isPrimary || isSecondary) return colors.text.inverse;
    if (isGhost) return colors.text.primary;
    if (isOutline) return colors.primary;
    return colors.text.inverse;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        isOutline && styles.outlineButton,
        isGhost && styles.ghostButton,
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor() },
            isGhost && styles.ghostText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 24, // Pill-shaped buttons
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    width: '100%',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghostButton: {
    height: 'auto',
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  ghostText: {
    fontWeight: typography.weights.medium,
  },
});
