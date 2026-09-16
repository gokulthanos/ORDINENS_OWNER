import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const bg =
    variant === 'primary'
      ? colors.brand
      : variant === 'secondary'
        ? colors.surface2
        : variant === 'danger'
          ? colors.danger
          : 'transparent';
  const textColor =
    variant === 'primary'
      ? '#ffffff'
      : variant === 'danger'
        ? '#ffffff'
        : variant === 'outline' || variant === 'ghost'
          ? colors.brand
          : colors.text;
  const borderColor =
    variant === 'outline' ? colors.brand : variant === 'secondary' ? colors.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={[styles.label, { color: textColor, marginLeft: icon ? 8 : 0 }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});