import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import BookingCard from '@/components/BookingCard';
import { useAuth } from '@/store/auth';
import { useOwner } from '@/store/owner';
import { OwnerDashboard, loadOwnerDashboard } from '@/services/ownerService';
import { getServices } from '@/services/serviceService';
import { getStaff } from '@/services/staffService';
import { getBookings } from '@/services/bookingService';
import { Booking, Service, StaffMember } from '@/types';
import { formatINR } from '@/utils/format';

export default function DashboardScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { shop, shopLoading, bookingsVersion, bumpBookings } = useOwner();

  const [data, setData] = useState<OwnerDashboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    const d = await loadOwnerDashboard(session.id, shop?.id);
    setData(d);
    setServices(await getServices(d.shop?.id));
    setStaff(await getStaff(d.shop?.id));
    const today = formatDateKey();
    const all = await getBookings(d.shop?.id);
    const list = all
      .filter((b) => {
        const dt = b.appointment_date ?? b.dateISO;
        return (b.status === 'confirmed' || b.status === 'pending') && dt === today;
      })
      .sort((a, b) => (a.allocated_start_time ?? 0) - (b.allocated_start_time ?? 0));
    setTodayBookings(list);
  }, [session, shop?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, bookingsVersion])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    bumpBookings();
  }, [load, bumpBookings]);

  const bookedToday = data?.todayBookings ?? todayBookings.length;

  return (
    <Screen scroll={false} padded>
      <FlatList
        data={todayBookings}
        keyExtractor={(b) => b.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListHeaderComponent={
          <View>
            <View style={styles.greetRow}>
              <View>
                <Text style={[styles.greet, { color: colors.text }]}>
                  Hello, {session?.name?.split(' ')[0] ?? 'Owner'}
                </Text>
                <Text style={[styles.greetSub, { color: colors.textMuted }]}>
                  {shop?.name ?? 'Your shop'}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: shop?.is_live ? `${colors.success}18` : `${colors.textFaint}18` }]}>
                <View style={[styles.statusDot, { backgroundColor: shop?.is_live ? colors.success : colors.textFaint }]} />
                <Text style={[styles.statusText, { color: shop?.is_live ? colors.success : colors.textMuted }]}>
                  {shop?.is_live ? 'Live' : 'Offline'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard label="Today" value={formatNumber(bookedToday)} icon="today-outline" color={colors.brand} />
              <StatCard label="Pending" value={formatNumber(data?.pendingBookings ?? 0)} icon="time-outline" color={colors.warning} />
            </View>
            <View style={styles.statsRow}>
              <StatCard label="Confirmed" value={formatNumber(data?.confirmedBookings ?? 0)} icon="checkmark-done" color={colors.success} />
              <StatCard label="Revenue" value={formatINR(data?.revenue ?? 0)} icon="wallet-outline" color={colors.brand} />
            </View>

            <View style={styles.quickRow}>
              <QuickAction icon="person-add-outline" label="Bookings" color={colors.brand} onPress={() => router.push('/(tabs)/bookings')} />
              <QuickAction icon="cut-outline" label="Services" color={colors.brand} onPress={() => router.push('/services')} />
              <QuickAction icon="people-outline" label="Team" color={colors.brand} onPress={() => router.push('/staff')} />
              <QuickAction icon="calendar-outline" label="Holidays" color={colors.brand} onPress={() => router.push('/holidays')} />
            </View>

            <SectionHeader
              title="Coming up today"
              actionLabel="View all"
              onAction={() => router.push('/(tabs)/bookings')}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No bookings today"
            message="When customers book, they will show up here."
            icon="partly-sunny-outline"
          />
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            service={services.find((s) => s.id === item.service_id)}
            staff={staff.find((s) => s.id === (item.staff_id ?? item.barber_id ?? item.staffId))}
            onPress={() => router.push(`/bookings/${item.id}`)}
          />
        )}
      />
      {!shopLoading && shop && !shop.is_live ? (
        <Pressable
          onPress={() => router.push('/onboarding/review')}
          style={[styles.offlineBanner, { backgroundColor: `${colors.warning}18`, borderColor: colors.warning }]}
        >
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
          <Text style={[styles.offlineText, { color: colors.warning }]}>Your shop is offline. Finish setup to go live.</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.quick, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.quickLabel, { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function formatDateKey(d?: Date): string {
  const date = d ?? new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-IN');
}

const styles = StyleSheet.create({
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greet: {
    fontSize: 22,
    fontWeight: '800',
  },
  greetSub: {
    fontSize: 13,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  quick: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    position: 'absolute',
    bottom: 8,
    left: 16,
    right: 16,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});