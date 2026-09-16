import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';

export default function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const { colors, spacing } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.wrap, { paddingTop: spacing.xl }]}
    >
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
  },
});