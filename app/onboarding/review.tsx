import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import OnboardingLayout from '@/components/OnboardingLayout';
import Card from '@/components/Card';
import { useOwner } from '@/store/owner';
import {
  validateBookingRules,
  validateBreaks,
  validateServices,
  validateShopDetails,
  validateStaff,
  validateWorkingHours,
} from '@/services/ownerService';
import { EMPTY_WORKING_HOURS } from '@/services/shopService';

const DAY_LABEL: Record<string, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

export default function OnboardingReview() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { draft, markStepComplete } = useOwner();
  const shop = draft?.shop ?? {};
  const services = draft?.services ?? [];
  const staff = draft?.staff ?? [];
  const rules = draft?.bookingRules ?? { booking_window: 30, cancellation_hours: 2, capacity: 1, slot_interval: 30 };
  const workingHours = shop.workingHours ?? EMPTY_WORKING_HOURS;
  const breaks = shop.breaks ?? [];
  const [pressed, setPressed] = useState(false);

  const checks = useMemo(() => {
    return [
      { label: 'Shop details', check: validateShopDetails(shop) },
      { label: 'Working hours', check: validateWorkingHours(workingHours) },
      { label: 'Breaks', check: validateBreaks(workingHours, breaks) },
      { label: 'Services (at least one)', check: validateServices(services) },
      { label: 'Team (at least one)', check: validateStaff(staff) },
      { label: 'Booking rules', check: validateBookingRules(rules) },
    ];
  }, [shop, workingHours, breaks, services, staff, rules]);

  const allValid = checks.every((c) => c.check.valid);
  const missingCount = checks.filter((c) => !c.check.valid).length;
  const openDays = Object.entries(workingHours).filter(([, v]) => v.open).map(([k]) => DAY_LABEL[k] ?? k);

  const continueNext = async () => {
    setPressed(true);
    if (!allValid) return;
    await markStepComplete('review');
    router.push('/onboarding/go-live');
  };

  return (
    <OnboardingLayout
      step={7}
      totalSteps={8}
      title="Review everything"
      subtitle="Confirm your shop is ready before going live."
      onBack={() => router.back()}
      onContinue={continueNext}
      continueDisabled={pressed && !allValid}
      continueLabel={allValid ? 'Looks good' : `Fix ${missingCount} item${missingCount === 1 ? '' : 's'}`}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <Card noPadding style={{ padding: 14 }}>
          <CheckRow label="Shop details" ok={checks[0].check.valid} detail={checks[0].check.valid ? `${shop.name ?? '—'} · ${openDays.length} days open` : checks[0].check.errors[0]} />
          <CheckRow label="Working hours" ok={checks[1].check.valid} detail={checks[1].check.valid ? openDays.join(', ') || 'None set' : checks[1].check.errors[0]} />
          <CheckRow label="Breaks" ok={checks[2].check.valid} detail={checks[2].check.valid ? (`${breaks.length}` === '0' ? 'No breaks' : `${breaks.length} break(s)`) : checks[2].check.errors[0]} />
          <CheckRow label="Services" ok={checks[3].check.valid} detail={services.length ? `${services.length} service(s)` : undefined} />
          <CheckRow label="Team" ok={checks[4].check.valid} detail={staff.length ? `${staff.length} member(s)` : undefined} />
          <CheckRow label="Booking rules" ok={checks[5].check.valid} detail={`${rules.capacity} seat(s) · ${rules.booking_window}d window · every ${rules.slot_interval} min`} />
        </Card>

        <Card noPadding style={{ padding: 14 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {shop.address || 'Address not set'}
          </Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {shop.phone || shop.ownerPhone || 'Contact not set'}
          </Text>
        </Card>

        {!allValid ? (
          <View style={[styles.warnBox, { backgroundColor: `${colors.warning}14`, borderColor: colors.warning }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={[styles.warnText, { color: colors.warning }]}>
              Complete the highlighted sections before going live.
            </Text>
          </View>
        ) : (
          <View style={[styles.goodBox, { backgroundColor: `${colors.success}14`, borderColor: colors.success }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={[styles.warnText, { color: colors.success }]}>
              Everything is ready. Continue to go live.
            </Text>
          </View>
        )}
      </ScrollView>
    </OnboardingLayout>
  );
}

function CheckRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={ok ? colors.success : colors.warning}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.checkLabel, { color: colors.text }]}>{label}</Text>
        {ok && detail ? <Text style={[styles.detail, { color: colors.textMuted }]}>{detail}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  checkLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  detail: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  goodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  warnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});