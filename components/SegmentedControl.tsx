import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/constants/theme';

interface SegmentedControlProps {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  scrollable?: boolean;
}

export default function SegmentedControl({ options, value, onChange, scrollable = true }: SegmentedControlProps) {
  const { colors } = useTheme();
  const content = (
    <>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, selected && { backgroundColor: colors.surface2 }]}
          >
            <Text style={[styles.label, { color: selected ? colors.text : colors.textMuted }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});