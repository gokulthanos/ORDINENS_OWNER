import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/constants/theme';
import { Booking, Service, StaffMember } from '@/types';
import { formatINR, formatSlotTime, formatDateISO, timeAgo } from '@/utils/format';
import Card from './Card';
import StatusBadge from './StatusBadge';

interface BookingCardProps {
  booking: Booking;
  service?: Service;
  staff?: StaffMember;
  onPress?: () => void;
}

export default function BookingCard({ booking, service, staff, onPress }: BookingCardProps) {
  const { colors } = useTheme();
  const customerName = booking.customerName || 'Customer';
  const sTime = booking.allocated_start_time ?? booking.startMinute ?? null;
  const dateISO = booking.appointment_date ?? booking.dateISO;
  const dateLabel = formatDateISO(dateISO);

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{customerName}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {service?.name ?? booking.service_name ?? 'Service'}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {sTime != null ? `${dateLabel} · ${formatSlotTime(sTime)}` : dateLabel}
          </Text>
          {staff ? (
            <Text style={[styles.meta, { color: colors.textMuted }]}>With {staff.name}</Text>
          ) : null}
        </View>
        <View style={styles.right}>
          {typeof (booking.price ?? booking.service_price) === 'number' ? (
            <Text style={[styles.price, { color: colors.text }]}>{formatINR(booking.price ?? booking.service_price)}</Text>
          ) : null}
          <StatusBadge status={booking.status} />
          {booking.created_at ? (
            <Text style={[styles.time, { color: colors.textFaint }]}>{timeAgo(booking.created_at)}</Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
  },
});