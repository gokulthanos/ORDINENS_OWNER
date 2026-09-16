import React from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/constants/theme';

interface CardProps extends ViewProps {
  onPress?: () => void;
  noPadding?: boolean;
}

export default function Card({ onPress, noPadding = false, style, children, ...props }: CardProps) {
  const { colors, spacing } = useTheme();

  const content = (
    <View
      {...props}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        noPadding ? null : { padding: spacing.lg },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
});