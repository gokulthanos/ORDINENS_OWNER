import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { useOwner } from '@/store/owner';
import { useAuth } from '@/store/auth';
import {
  getBooking,
  confirmBooking,
  declineBooking,
  updateBookingStatus,
  getAvailableSlotsForBooking,
} from '@/services/bookingService';
import { getService } from '@/services/serviceService';
import { getStaffMember } from '@/services/staffService';
import { getHolidays } from '@/services/holidayService';
import { Booking, Service, StaffMember, ShopHoliday } from '@/types';
import { formatINR, formatSlotTime, formatDateTime } from '@/utils/format';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { shop, shopLoading, bumpBookings } = useOwner();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [holidays, setHolidays] = useState<ShopHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [slots, setSlots] = useState<number[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsVisible, setSlotsVisible] = useState(false);
  const [declineVisible, setDeclineVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);

  const load = useCallback(async () => {
    if (!shop?.id || !id) return;
    setLoading(true);
    setError(null);
    const b = await getBooking(id, shop.id);
    if (!b) {
      setError('Booking not found.');
      setLoading(false);
      return;
    }
    setBooking(b);
    const svc =
      b.service_id || b.serviceId ? await getService(b.service_id ?? b.serviceId ?? '', shop.id) : null;
    setService(svc);
    const staffId = (b as unknown as { staff_id?: string }).staff_id;
    setStaff(staffId ? await getStaffMember(staffId, shop.id) : null);
    setHolidays(await getHolidays(shop.id));
    setLoading(false);
  }, [id, shop?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openSlotPicker = async () => {
    if (!shop || !booking) return;
    setSlotsVisible(true);
    setSlotsLoading(true);
    const list = await getAvailableSlotsForBooking(booking.id, { shop, holidays });
    setSlots(list);
    setSlotsLoading(false);
  };

  const pickSlot = async (startMinute: number) => {
    if (!shop || !booking) return;
    setSlotsVisible(false);
    setWorking(true);
    const result = await confirmBooking(booking.id, startMinute, {
      shop,
      holidays,
      allocatedBy: session?.id ?? null,
    });
    setWorking(false);
    if (!result.ok) {
      Alert.alert('Cannot confirm', result.error ?? 'Please try again.');
      await load();
      return;
    }
    bumpBookings();
    await load();
    Alert.alert('Booking confirmed', 'The appointment has been confirmed.');
  };

  const doDecline = async () => {
    if (!booking || !shop?.id) return;
    setDeclineVisible(false);
    setWorking(true);
    const result = await declineBooking(booking.id, session?.id ?? null, 'Declined by shop', shop.id);
    setWorking(false);
    if (!result.ok) {
      Alert.alert('Failed', result.error ?? 'Please try again.');
      return;
    }
    bumpBookings();
    await load();
  };

  const doCancel = async () => {
    if (!booking || !shop?.id) return;
    setCancelVisible(false);
    setWorking(true);
    const updated = await updateBookingStatus(booking.id, 'cancelled', 'Cancelled by owner', session?.id ?? null, shop.id);
    setWorking(false);
    if (!updated) {
      Alert.alert('Failed', 'Unable to cancel the booking.');
      return;
    }
    bumpBookings();
    await load();
  };

  const markCompleted = async () => {
    if (!booking || !shop?.id) return;
    setWorking(true);
    const updated = await updateBookingStatus(booking.id, 'completed', 'Completed by owner', session?.id ?? null, shop.id);
    setWorking(false);
    if (!updated) {
      Alert.alert('Failed', 'Unable to mark as completed.');
      return;
    }
    bumpBookings();
    await load();
  };

  const busy = working || shopLoading;

  if (loading) {
    return (
      <Screen>
        <Header title="Booking" />
        <LoadingState />
      </Screen>
    );
  }
  if (error || !booking) {
    return (
      <Screen>
        <Header title="Booking" />
        <ErrorState message={error ?? 'Booking not found.'} onRetry={load} />
      </Screen>
    );
  }

  const timeLabel =
    booking.allocated_start_time != null
      ? `${booking.appointment_date || booking.dateISO} · ${formatSlotTime(booking.allocated_start_time)}`
      : booking.appointment_date || booking.dateISO || 'Date not set';

  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';

  return (
    <Screen scroll={false} padded>
      <Header title="Booking details" subtitle={booking.booking_ref ?? booking.bookingRef} />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={[styles.statusRow, { marginBottom: spacing.md }]}>
          <StatusBadge status={booking.status} />
        </View>

        <Card>
          <Text style={[styles.section, { color: colors.textMuted }]}>Customer</Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {booking.customerName || booking.customer_name || 'Customer'}
          </Text>
          {booking.customerPhone || booking.customer_phone ? (
            <Text style={[styles.detail, { color: colors.textMuted }]}>
              {booking.customerPhone || booking.customer_phone}
            </Text>
          ) : null}
          {booking.note || booking.customer_note ? (
            <Text style={[styles.detail, { color: colors.textMuted }]}>
              Note: {booking.note || booking.customer_note}
            </Text>
          ) : null}
        </Card>

        <Card>
          <Text style={[styles.section, { color: colors.textMuted }]}>Service</Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {service?.name ?? booking.serviceName ?? 'Service'}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={[styles.detail, { color: colors.textMuted }]}>
              {service?.duration_minutes ?? booking.duration ?? 30} min
            </Text>
            <Text style={[styles.price, { color: colors.text }]}>
              {formatINR(booking.price ?? service?.price ?? 0)}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={[styles.section, { color: colors.textMuted }]}>Date & time</Text>
          <View style={styles.rowBetween}>
            <Text style={[styles.detail, { color: colors.text }]}>{timeLabel}</Text>
            {isPending ? (
              <Text style={[styles.pendingTag, { color: colors.warning }]}>Awaiting confirmation</Text>
            ) : null}
          </View>
          {staff ? <Text style={[styles.detail, { color: colors.textMuted }]}>With {staff.name}</Text> : null}
          {booking.created_at ? (
            <Text style={[styles.detail, { color: colors.textFaint }]}>
              Requested {formatDateTime(booking.created_at)}
            </Text>
          ) : null}
        </Card>

        {isPending ? (
          <View style={[styles.actions, { gap: 10, marginTop: spacing.sm }]}>
            <Button title="Confirm booking" onPress={openSlotPicker} loading={busy} />
            <Button title="Decline" variant="outline" onPress={() => setDeclineVisible(true)} disabled={busy} />
          </View>
        ) : isConfirmed ? (
          <View style={[styles.actions, { gap: 10, marginTop: spacing.sm }]}>
            <Button title="Mark completed" onPress={markCompleted} loading={busy} />
            <Button title="Cancel booking" variant="outline" onPress={() => setCancelVisible(true)} disabled={busy} />
          </View>
        ) : (
          <Card noPadding style={{ padding: 12 }}>
            <Text style={[styles.detail, { color: colors.textMuted }]}>
              This booking is {booking.status}. No further actions available.
            </Text>
          </Card>
        )}
      </ScrollView>

      <Modal transparent visible={slotsVisible} animationType="slide" onRequestClose={() => setSlotsVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setSlotsVisible(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Choose a time slot</Text>
            <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
              Booking for {timeLabel}. Availability is re-checked when you select.
            </Text>
            {slotsLoading ? (
              <LoadingState label="Checking availability…" />
            ) : slots.length === 0 ? (
              <EmptyState
                title="No slots available"
                message="This time is no longer open. Pick another or decline the booking."
                icon="time-outline"
              />
            ) : (
              <ScrollView style={{ flexGrow: 0, maxHeight: 380 }}>
                <View style={styles.slotGrid}>
                  {slots.map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => pickSlot(m)}
                      style={[styles.slot, { backgroundColor: colors.surface, borderColor: colors.brand }]}
                    >
                      <Text style={[styles.slotText, { color: colors.brand }]}>{formatSlotTime(m)}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}
            <Button title="Close" variant="secondary" onPress={() => setSlotsVisible(false)} style={{ marginTop: 12 }} />
          </View>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={declineVisible}
        title="Decline this booking?"
        message="The customer will be notified that this appointment was declined."
        confirmLabel="Decline"
        danger
        loading={working}
        onConfirm={doDecline}
        onCancel={() => setDeclineVisible(false)}
      />
      <ConfirmModal
        visible={cancelVisible}
        title="Cancel this booking?"
        message="The customer will be notified that this appointment was cancelled."
        confirmLabel="Cancel booking"
        danger
        loading={working}
        onConfirm={doCancel}
        onCancel={() => setCancelVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    marginBottom: 4,
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  detail: {
    fontSize: 14,
    marginTop: 3,
    lineHeight: 20,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  pendingTag: {
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    marginBottom: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSub: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 19,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  slotText: {
    fontSize: 15,
    fontWeight: '700',
  },
});