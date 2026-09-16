import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookingStatus } from '@/types';
import { statusColor } from '@/utils/format';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  declined: 'Declined',
  'no-show': 'No show',
};

export default function StatusBadge({ status }: { status: BookingStatus | string }) {
  const color = statusColor(status as BookingStatus);
  const label = STATUS_LABELS[status] ?? status;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});