import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme';
import OnboardingLayout from '@/components/OnboardingLayout';
import TimePickerField from '@/components/TimePickerField';
import SwitchRow from '@/components/SwitchRow';
import { useOwner } from '@/store/owner';
import { DayKey, DayConfig, Shop, WorkingHours } from '@/types';
import { EMPTY_WORKING_HOURS } from '@/services/shopService';
import { validateWorkingHours } from '@/services/ownerService';

const DAY_ORDER: Array<{ key: DayKey; label: string }> = [
  { key: 'sun', label: 'Sunday' },
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
];

export default function OnboardingWorkingHours() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { draft, updateDraftShop, markStepComplete } = useOwner();
  const workingHours: WorkingHours = draft?.shop?.workingHours ?? EMPTY_WORKING_HOURS;
  const [errors, setErrors] = useState<string[]>([]);

  const setDay = (key: DayKey, patch: Partial<DayConfig>) => {
    setErrors([]);
    void updateDraftShop({ workingHours: { ...workingHours, [key]: { ...workingHours[key], ...patch } } } as Partial<Shop>);
  };

  const continueNext = async () => {
    const v = validateWorkingHours(workingHours);
    if (!v.valid) {
      setErrors(v.errors);
      return;
    }
    await markStepComplete('working-hours');
    router.push('/onboarding/breaks');
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={8}
      title="Working hours"
      subtitle="Set when you are open. Customers can only book within these hours."
      onBack={() => router.back()}
      onContinue={continueNext}
      continueDisabled={errors.length > 0}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {errors.length ? (
          <View style={[styles.errorBox, { backgroundColor: `${colors.danger}14`, borderColor: colors.danger }]}>
            {errors.map((e) => (
              <Text key={e} style={[styles.errorText, { color: colors.danger }]}>
                {e}
              </Text>
            ))}
          </View>
        ) : null}
        {DAY_ORDER.map(({ key, label }) => {
          const cfg = workingHours[key];
          return (
            <View key={key} style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <SwitchRow
                label={label}
                value={!!cfg.open}
                onChange={(open) => setDay(key, { open })}
              />
              {cfg.open ? (
                <View style={styles.timeRow}>
                  <TimePickerField
                    label="Opens"
                    value={cfg.start}
                    onChange={(start) => setDay(key, { start })}
                    containerStyle={{ flex: 1 }}
                  />
                  <TimePickerField
                    label="Closes"
                    value={cfg.end}
                    onChange={(end) => setDay(key, { end })}
                    containerStyle={{ flex: 1 }}
                  />
                </View>
              ) : (
                <Text style={[styles.closed, { color: colors.textFaint }]}>Closed on {label}s</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  dayCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  closed: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingTop: 4,
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});