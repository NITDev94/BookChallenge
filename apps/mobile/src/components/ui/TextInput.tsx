import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

export const TextInput = ({ label, error, style, ...props }: TextInputProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.secondary}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: 8,
    fontWeight: typography.weights.medium,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
});
