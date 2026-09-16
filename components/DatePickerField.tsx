import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minimumDate?: Date;
  containerStyle?: ViewStyle;
}

export default function DatePickerField({ label, value, onChange, minimumDate, containerStyle }: DatePickerFieldProps) {
  const { colors, spacing } = useTheme();
  const [show, setShow] = useState(false);

  const toDate = (v: string) => {
    const [y = 2000, m = 1, d = 1] = v.split('-').map((n) => parseInt(n, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setShow(false);
    if (event.type === 'set' && date) onChange(fmt(date));
  };

  return (
    <View style={[{ marginBottom: spacing.md }, containerStyle]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Pressable onPress={() => setShow(true)} style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="calendar-outline" size={18} color={colors.brand} />
        <Text style={[styles.value, { color: colors.text }]}>{value || 'Select date'}</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value ? toDate(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate}
          onChange={Platform.OS === 'android' ? onAndroidChange : (event, date) => date && onChange(fmt(date))}
        />
      ) : null}
      {show && Platform.OS === 'ios' ? (
        <Pressable style={styles.iosDone} onPress={() => setShow(false)}>
          <Text style={[styles.iosDoneText, { color: colors.brand }]}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
  },
  iosDone: {
    alignItems: 'flex-end',
    paddingVertical: 6,
  },
  iosDoneText: {
    fontSize: 15,
    fontWeight: '600',
  },
});