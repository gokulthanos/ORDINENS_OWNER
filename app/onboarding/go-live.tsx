import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import OnboardingLayout from '@/components/OnboardingLayout';
import Card from '@/components/Card';
import { useOwner } from '@/store/owner';
import { useAuth } from '@/store/auth';
import { Shop } from '@/types';
import { goLive, GoLiveResult, validateBookingRules, validateBreaks, validateServices, validateShopDetails, validateStaff, validateWorkingHours } from '@/services/ownerService';
import { addService } from '@/services/serviceService';
import { addStaff } from '@/services/staffService';
import { EMPTY_WORKING_HOURS } from '@/services/shopService';

const STEPS: Array<{ key: string; label: string }> = [
  { key: 'shop', label: 'Creating your shop profile…' },
  { key: 'image', label: 'Uploading your logo…' },
  { key: 'services', label: 'Saving your services…' },
  { key: 'staff', label: 'Saving your team…' },
  { key: 'live', label: 'Going live…' },
];

export default function OnboardingGoLive() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { draft, shop, createNewShop, setShopImage, updateShopDetails, refreshShop, resetDraft } = useOwner();
  const { session } = useAuth();

  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!draft) return null;

  const commit = async () => {
    if (!session || !draft) return;
    setRunning(true);
    setError(null);

    try {
      const shopDraft = draft.shop ?? {};
      const workingHours = shopDraft.workingHours ?? EMPTY_WORKING_HOURS;
      const breaks = shopDraft.breaks ?? [];
      const services = draft.services ?? [];
      const staff = draft.staff ?? [];
      const rules = draft.bookingRules ?? { booking_window: 30, cancellation_hours: 2, capacity: 1, slot_interval: 30 };

      const preChecks = [
        validateShopDetails(shopDraft),
        validateWorkingHours(workingHours),
        validateBreaks(workingHours, breaks),
        validateServices(services),
        validateStaff(staff),
        validateBookingRules(rules),
      ];
      const firstBad = preChecks.find((c) => !c.valid);
      if (firstBad) {
        setError(firstBad.errors[0]);
        setRunning(false);
        return;
      }

      setPhase(0);
      let target: Shop | null = shop;
      if (!target) {
        target = await createNewShop({
          ...shopDraft,
          workingHours,
          breaks,
          booking_window: rules.booking_window,
          cancellation_hours: rules.cancellation_hours,
          capacity: rules.capacity,
          slot_interval: rules.slot_interval,
          number_of_barbers: Math.max(1, staff.length),
        } as Partial<Shop>);
        await refreshShop();
      } else {
        await updateShopDetails({
          ...shopDraft,
          workingHours,
          breaks,
          booking_window: rules.booking_window,
          cancellation_hours: rules.cancellation_hours,
          capacity: rules.capacity,
          slot_interval: rules.slot_interval,
          number_of_barbers: Math.max(1, staff.length),
        } as Partial<Shop>);
      }

      if (shopDraft.imageUrl && !shopDraft.imageUrl.startsWith('http')) {
        setPhase(1);
        await setShopImage(shopDraft.imageUrl);
      }

      setPhase(2);
      for (const s of services) {
        if (!s.name) continue;
        await addService(target.id, {
          name: s.name,
          price: Number(s.price) || 0,
          duration_minutes: Number(s.duration_minutes || s.duration || 30),
          description: s.description ?? null,
          emoji: s.emoji ?? null,
        });
      }

      setPhase(3);
      for (const m of staff) {
        if (!m.name) continue;
        await addStaff(target.id, {
          name: m.name,
          role: m.role || 'Barber',
          specialty: m.specialty || '',
          years_of_experience: Number(m.years_of_experience || 0),
          color: m.color,
        });
      }

      setPhase(4);
      const result: GoLiveResult = await goLive(
        {
          id: target.id,
          owner_id: target.owner_id ?? session.id,
          ownerName: target.ownerName || shopDraft.ownerName || '',
          name: target.name || '',
          phone: target.phone || target.ownerPhone || shopDraft.phone || '',
          location: target.location || shopDraft.location || '',
          address: target.address || shopDraft.address || '',
          workingHours,
          breaks,
        } as Partial<Shop>,
        session.id,
        rules
      );
      if (!result.ok) {
        setError(result.error ?? 'Unable to go live. Please try again.');
        setRunning(false);
        return;
      }

      await resetDraft();
      await refreshShop();
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const currentStepLabel = phase < STEPS.length ? STEPS[phase].label : '';

  return (
    <OnboardingLayout
      step={8}
      totalSteps={8}
      title="You're ready to go live"
      subtitle="Customers will be able to find you and book instantly once you hit go live."
      onBack={() => router.back()}
      onContinue={commit}
      continueLabel={running ? currentStepLabel : 'Go live'}
      continueLoading={running}
      continueDisabled={running}
      footerExtra={
        <View style={{ marginBottom: 0 }}>
          <Card noPadding style={{ padding: 14 }}>
            <View style={styles.liveList}>
              <LiveRow label="Instant online booking" />
              <LiveRow label="Manage appointments from one place" />
              <LiveRow label="Your services and team made public" />
            </View>
          </Card>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: `${colors.danger}14`, borderColor: colors.danger }]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${colors.brand}18` }]}>
            <Ionicons name="rocket-outline" size={30} color={colors.brand} />
          </View>
          <Text style={[styles.heroText, { color: colors.text }]}>
            {draft.services.length} services · {draft.staff.length} team members ready to accept bookings.
          </Text>
        </View>
        {running && phase < STEPS.length ? (
          <Text style={[styles.running, { color: colors.textMuted }]}>{currentStepLabel}</Text>
        ) : null}
      </ScrollView>
    </OnboardingLayout>
  );
}

function LiveRow({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.liveRow}>
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      <Text style={[styles.liveLabel, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  running: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  liveList: {
    gap: 8,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});