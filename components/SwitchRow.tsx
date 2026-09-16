import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/constants/theme';

interface SwitchRowProps {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  hint?: string;
  style?: ViewStyle;
}

export default function SwitchRow({ label, value, onChange, hint, style }: SwitchRowProps) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} style={[styles.row, { marginBottom: spacing.md }, style]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
      </View>
      <View style={[styles.track, { backgroundColor: value ? colors.brand : colors.border }]}>
        <View style={[styles.thumb, { alignSelf: value ? 'flex-end' : 'flex-start', backgroundColor: '#fff' }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});