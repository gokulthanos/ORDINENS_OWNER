import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import BookingCard from '@/components/BookingCard';
import LogoImage from '@/components/LogoImage';
import { useAuth } from '@/store/auth';
import { useOwner } from '@/store/owner';
import { OwnerDashboard, loadOwnerDashboard } from '@/services/ownerService';
import { getServices } from '@/services/serviceService';
import { getStaff } from '@/services/staffService';
import { getBookings } from '@/services/bookingService';
import { Booking, Service, StaffMember } from '@/types';
import { formatINR } from '@/utils/format';

interface DashboardSection {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: string;
}

const DASHBOARD_SECTIONS: DashboardSection[] = [
  { icon: 'calendar-outline', label: 'Bookings', href: '/(tabs)/bookings' },
  { icon: 'person-add-outline', label: 'Booking Requests', href: '/(tabs)/bookings' },
  { icon: 'grid-outline', label: 'Calendar', href: '/(tabs)/calendar' },
  { icon: 'cut-outline', label: 'Services', href: '/services' },
  { icon: 'people-outline', label: 'Team / Barbers', href: '/staff' },
  { icon: 'sunny-outline', label: 'Holidays', href: '/holidays' },
  { icon: 'storefront-outline', label: 'Shop', href: '/shop' },
  { icon: 'time-outline', label: 'Booking Rules', href: '/booking-rules' },
  { icon: 'settings-outline', label: 'Settings', href: '/settings' },
  { icon: 'person-outline', label: 'Profile', href: '/settings' },
];

export default function DashboardScreen() {
  const { colors } = useTheme();
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

  const openSection = (section: DashboardSection) => {
    // Shop-dependent features stay locked until the owner adds a shop.
    if (!shopLoading && !shop) {
      Alert.alert('Add your shop first', 'This feature unlocks once your shop is added.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Add Your Shop', onPress: () => router.push('/onboarding/shop') },
      ]);
      return;
    }
    router.push(section.href);
  };

  const hasShop = !!shop;

  return (
    <Screen scroll={false} padded>
      <FlatList
        data={todayBookings}
        keyExtractor={(b) => b.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListHeaderComponent={
          <View>
            <View style={styles.greetRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <LogoImage size={38} style={{ borderWidth: 0 }} />
                <View>
                  <Text style={[styles.greet, { color: colors.text }]}>
                    Hello, {session?.name?.split(' ')[0] ?? 'Owner'}
                  </Text>
                  <Text style={[styles.greetSub, { color: colors.textMuted }]}>
                    {shop?.name ?? (!shopLoading && !shop ? 'No shop yet' : 'Your shop')}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusPill, { backgroundColor: shop?.is_live ? `${colors.success}18` : `${colors.textFaint}18` }]}>
                <View style={[styles.statusDot, { backgroundColor: shop?.is_live ? colors.success : hasShop ? colors.textFaint : colors.brand }]} />
                <Text style={[styles.statusText, { color: hasShop && !shop.is_live ? colors.textMuted : shop?.is_live ? colors.success : colors.brand }]}>
                  {!hasShop ? 'No shop' : shop.is_live ? 'Live' : 'Offline'}
                </Text>
              </View>
            </View>

            {!hasShop && !shopLoading ? (
              <View style={[styles.noShopCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.noShopIcon, { backgroundColor: `${colors.brand}18` }]}>
                  <Ionicons name="storefront-outline" size={26} color={colors.brand} />
                </View>
                <Text style={[styles.noShopTitle, { color: colors.text }]}>No Shop Yet</Text>
                <Text style={[styles.noShopMsg, { color: colors.textMuted }]}>
                  Your shop has not been added yet. Add your shop to unlock more features.
                </Text>
                <Pressable
                  onPress={() => router.push('/onboarding/shop')}
                  style={[styles.addShopBtn, { backgroundColor: colors.brand }]}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addShopBtnText}>Add Your Shop</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.statsRow}>
              <StatCard label="Today" value={formatNumber(bookedToday)} icon="today-outline" color={colors.brand} />
              <StatCard label="Pending" value={formatNumber(data?.pendingBookings ?? 0)} icon="time-outline" color={colors.warning} />
            </View>
            <View style={styles.statsRow}>
              <StatCard label="Confirmed" value={formatNumber(data?.confirmedBookings ?? 0)} icon="checkmark-done" color={colors.success} />
              <StatCard label="Revenue" value={formatINR(data?.revenue ?? 0)} icon="wallet-outline" color={colors.brand} />
            </View>

            <View style={styles.quickRow}>
              <QuickAction icon="person-add-outline" label="Bookings" color={colors.brand} onPress={() => openSection(DASHBOARD_SECTIONS[0])} />
              <QuickAction icon="cut-outline" label="Services" color={colors.brand} onPress={() => openSection(DASHBOARD_SECTIONS[3])} />
              <QuickAction icon="people-outline" label="Team" color={colors.brand} onPress={() => openSection(DASHBOARD_SECTIONS[4])} />
              <QuickAction icon="calendar-outline" label="Holidays" color={colors.brand} onPress={() => openSection(DASHBOARD_SECTIONS[5])} />
            </View>

            <SectionHeader title="Dashboard sections" />

            <View style={[styles.sectionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {DASHBOARD_SECTIONS.map((section, idx) => {
                const last = idx === DASHBOARD_SECTIONS.length - 1;
                const locked = !shopLoading && !shop;
                return (
                  <Pressable
                    key={section.label}
                    onPress={() => openSection(section)}
                    style={[
                      styles.sectionRow,
                      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={[styles.sectionIcon, { backgroundColor: colors.surface2 }]}>
                      <Ionicons name={section.icon} size={18} color={locked ? colors.textFaint : colors.brand} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionLabel, { color: locked ? colors.textFaint : colors.text }]}>
                        {section.label}
                      </Text>
                      {locked ? (
                        <Text style={[styles.sectionHint, { color: colors.textFaint }]}>Add your shop first</Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name={locked ? 'lock-closed-outline' : 'chevron-forward'}
                      size={16}
                      color={locked ? colors.textFaint : colors.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>

            {hasShop ? <SectionHeader title="Coming up today" actionLabel="View all" onAction={() => router.push('/(tabs)/bookings')} /> : null}
          </View>
        }
        ListEmptyComponent={
          hasShop ? (
            <EmptyState
              title="No bookings today"
              message="When customers book, they will show up here."
              icon="partly-sunny-outline"
            />
          ) : null
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
  noShopCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    marginTop: 14,
  },
  noShopIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  noShopTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  noShopMsg: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
    maxWidth: 260,
  },
  addShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 14,
  },
  addShopBtnText: {
    color: '#fff',
    fontSize: 15,
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
  sectionsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: 12,
    marginTop: 1,
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