import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useTheme } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
  small?: boolean;
}

export default function Input({ label, error, containerStyle, small, ...props }: InputProps) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[{ marginBottom: spacing.md }, containerStyle]}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.textFaint}
        style={[
          styles.input,
          small ? { height: 42, fontSize: 14 } : { height: 48, fontSize: 15 },
          { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
          props.style,
        ]}
        textAlignVertical="center"
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});