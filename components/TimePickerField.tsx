import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

interface TimePickerFieldProps {
  label: string;
  value: string; // HH:mm
  onChange: (time: string) => void;
  containerStyle?: ViewStyle;
}

export default function TimePickerField({ label, value, onChange, containerStyle }: TimePickerFieldProps) {
  const { colors, spacing } = useTheme();
  const [show, setShow] = useState(false);

  const toDate = (h: string) => {
    const [hh = 0, mm = 0] = h.split(':').map((n) => parseInt(n, 10));
    const d = new Date();
    d.setHours(Number.isNaN(hh) ? 0 : hh, Number.isNaN(mm) ? 0 : mm, 0, 0);
    return d;
  };

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setShow(false);
    if (event.type === 'set' && date) {
      onChange(
        `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      );
    }
  };

  return (
    <View style={[{ marginBottom: spacing.md }, containerStyle]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="time-outline" size={18} color={colors.brand} />
        <Text style={[styles.value, { color: colors.text }]}>{value || '--:--'}</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={Platform.OS === 'android' ? onAndroidChange : (event, date) => date && onChange(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`)}
          // iOS spinner is sticky; Dismiss by tapping outside handled below.
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