import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import BookingCard from '@/components/BookingCard';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { useOwner } from '@/store/owner';
import { getBookings } from '@/services/bookingService';
import { getServices } from '@/services/serviceService';
import { getStaff } from '@/services/staffService';
import { Booking, Service, StaffMember } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { shop, bookingsVersion } = useOwner();

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selected, setSelected] = useState<string>(() => dateKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!shop?.id) {
      setLoading(false);
      return;
    }
    const [b, s, t] = await Promise.all([getBookings(shop.id), getServices(shop.id), getStaff(shop.id)]);
    setBookings(b);
    setServices(s);
    setStaff(t);
    setLoading(false);
  }, [shop?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load, bookingsVersion])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'declined' && b.status !== 'no-show') {
        const k = b.appointment_date ?? b.dateISO;
        if (!k) continue;
        const arr = map.get(k) ?? [];
        arr.push(b);
        map.set(k, arr);
      }
    }
    return map;
  }, [bookings]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();
    const cells: Array<string | null> = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(dateKey(new Date(year, month, d)));
    return cells;
  }, [cursor]);

  const dayBookings = useMemo(() => {
    return (byDate.get(selected) ?? []).sort((a, b) => (a.allocated_start_time ?? a.startMinute ?? 0) - (b.allocated_start_time ?? b.startMinute ?? 0));
  }, [byDate, selected]);

  const moveMonth = (delta: number) => {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    d.setDate(1);
    setCursor(d);
  };

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const staffMap = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  if (loading && !refreshing) return <Screen><LoadingState /></Screen>;

  return (
    <Screen scroll={false} padded>
      <View style={styles.monthRow}>
        <Pressable onPress={() => moveMonth(-1)} hitSlop={10} style={[styles.arrow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.month, { color: colors.text }]}>
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </Text>
        </View>
        <Pressable onPress={() => moveMonth(1)} hitSlop={10} style={[styles.arrow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.grid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.weekday, { color: colors.textFaint }]}>{w}</Text>
        ))}
        {grid.map((cell, i) => {
          if (!cell) return <View key={`blank-${i}`} style={styles.cell} />;
          const count = byDate.get(cell)?.length ?? 0;
          const isToday = cell === dateKey(new Date());
          const isSelected = cell === selected;
          return (
            <Pressable key={cell} onPress={() => setSelected(cell)} style={styles.cell}>
              <View
                style={[
                  styles.dayCircle,
                  isSelected && { backgroundColor: colors.brand },
                ]}
              >
                <Text style={[styles.dayNum, { color: isSelected ? '#fff' : colors.text }, isToday && !isSelected && { color: colors.brand, fontWeight: '800' }]}>
                  {Number(cell.slice(8))}
                </Text>
              </View>
              {count > 0 ? (
                <View style={[styles.countBadge, { backgroundColor: count ? colors.brand : 'transparent' }]}>
                  <Text style={styles.countText}>{count}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.dayTitle, { color: colors.text, marginTop: spacing.md }]}>
        {selected}
      </Text>
      <FlatList
        data={dayBookings}
        keyExtractor={(b) => b.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListEmptyComponent={
          <EmptyState title="No bookings this day" message="Tap a date with a badge to see its appointments." icon="sunny-outline" />
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            service={serviceMap.get(item.service_id ?? '')}
            staff={staffMap.get(item.staff_id ?? item.barber_id ?? item.staffId ?? '')}
            onPress={() => router.push(`/bookings/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dayTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: {
    fontSize: 16,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
  },
  weekday: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 6,
  },
  cell: {
    width: '14.285%',
    alignItems: 'center',
    paddingVertical: 5,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize: 13,
  },
  countBadge: {
    position: 'absolute',
    top: 1,
    right: 8,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  countText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});