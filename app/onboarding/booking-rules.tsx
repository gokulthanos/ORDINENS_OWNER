import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme';
import OnboardingLayout from '@/components/OnboardingLayout';
import Input from '@/components/Input';
import Chip from '@/components/Chip';
import Card from '@/components/Card';
import { useOwner } from '@/store/owner';
import { BookingRules } from '@/types';
import { validateBookingRules } from '@/services/ownerService';
import { required } from '@/utils/validation';

const INTERVALS = [15, 30, 45, 60];

export default function OnboardingBookingRules() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { draft, setDraftRules, markStepComplete } = useOwner();
  const rules: BookingRules = draft?.bookingRules ?? { booking_window: 30, cancellation_hours: 2, capacity: 1, slot_interval: 30 };
  const [errors, setErrors] = useState<string[]>([]);

  const setRule = (key: keyof BookingRules, value: number) => {
    setErrors([]);
    const next: BookingRules = { ...rules, [key]: value };
    void setDraftRules(next);
  };

  const continueNext = async () => {
    const v = validateBookingRules(rules);
    if (!v.valid) {
      setErrors(v.errors);
      return;
    }
    setErrors([]);
    await markStepComplete('booking-rules');
    router.push('/onboarding/review');
  };

  return (
    <OnboardingLayout
      step={6}
      totalSteps={8}
      title="Booking rules"
      subtitle="These control how far ahead and how often customers can book."
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

        <Card noPadding style={{ padding: 14 }}>
          <Input
            label="Advance booking window (days)"
            value={String(rules.booking_window ?? '')}
            onChangeText={(t) => setRule('booking_window', Number(t.replace(/[^0-9]/g, '')) || 0)}
            keyboardType="numeric"
            placeholder="e.g. 30"
          />
          <Input
            label="Cancellation deadline (hours before booking)"
            value={String(rules.cancellation_hours ?? '')}
            onChangeText={(t) => setRule('cancellation_hours', Number(t.replace(/[^0-9]/g, '')) || 0)}
            keyboardType="numeric"
            placeholder="e.g. 2"
          />
          <Input
            label="Seats / capacity"
            value={String(rules.capacity ?? '')}
            onChangeText={(t) => setRule('capacity', Math.max(1, Number(t.replace(/[^0-9]/g, '')) || 1))}
            keyboardType="numeric"
            placeholder="e.g. 1"
          />
        </Card>

        <Card noPadding style={{ padding: 14 }}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Slot interval</Text>
          <Text style={[styles.hint, { color: colors.textFaint }]}>
            Minimum gap between booking start times. 30 min means 10:00, 10:30, 11:00…
          </Text>
          <View style={styles.chipRow}>
            {INTERVALS.map((d) => (
              <Chip
                key={d}
                label={`${d} min`}
                selected={Number(rules.slot_interval) === d}
                onPress={() => setRule('slot_interval', d)}
              />
            ))}
          </View>
        </Card>
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 17,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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