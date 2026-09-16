import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import SegmentedControl from '@/components/SegmentedControl';
import BookingCard from '@/components/BookingCard';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { useOwner } from '@/store/owner';
import { getBookings } from '@/services/bookingService';
import { getServices } from '@/services/serviceService';
import { getStaff } from '@/services/staffService';
import { Booking, Service, StaffMember } from '@/types';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No-show', value: 'no-show' },
];

export default function BookingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { shop, bookingsVersion } = useOwner();

  const [filter, setFilter] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!shop?.id) {
      setLoading(false);
      return;
    }
    const [b, s, t] = await Promise.all([
      getBookings(shop.id),
      getServices(shop.id),
      getStaff(shop.id),
    ]);
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

  const filtered = useMemo(() => {
    if (filter === 'all') return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const staffMap = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  if (loading && !refreshing) return <Screen><LoadingState /></Screen>;

  return (
    <Screen scroll={false} padded>
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListHeaderComponent={
          <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} scrollable />
        }
        ListEmptyComponent={
          <EmptyState
            title={`No ${filter === 'all' ? '' : filter + ' '}bookings`}
            message="When customers make appointments they appear here."
            icon="calendar-outline"
          />
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            service={serviceMap.get(item.service_id ?? '')}
            staff={staffMap.get(item.staff_id ?? item.barber_id ?? item.staffId ?? '')}
            onPress={() => router.push(`/bookings/${item.id}`)}
          />
        )}
        contentContainerStyle={{ gap: 0 }}
      />
    </Screen>
  );
}