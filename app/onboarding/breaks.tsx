import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import OnboardingLayout from '@/components/OnboardingLayout';
import TimePickerField from '@/components/TimePickerField';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useOwner } from '@/store/owner';
import { Shop, ShopBreak } from '@/types';
import { validateBreaks } from '@/services/ownerService';
import { EMPTY_WORKING_HOURS } from '@/services/shopService';
import { uid } from '@/utils/storage';

export default function OnboardingBreaks() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { draft, updateDraftShop, markStepComplete } = useOwner();
  const breaks: ShopBreak[] = draft?.shop?.breaks ?? [];
  const [errors, setErrors] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [start, setStart] = useState('13:00');
  const [end, setEnd] = useState('14:00');

  const persist = (next: ShopBreak[]) => {
    setErrors([]);
    void updateDraftShop({ breaks: next } as Partial<Shop>);
  };

  const addBreak = () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setErrors([...errors, 'Give the break a name like "Lunch break".']);
      return;
    }
    const next = [...breaks, { id: uid('BR'), label: trimmed, start, end }];
    persist(next);
    setAdding(false);
    setLabel('');
  };

  const removeBreak = (id: string) => {
    persist(breaks.filter((b) => b.id !== id));
  };

  const continueNext = async () => {
    const v = validateBreaks(draft?.shop?.workingHours ?? EMPTY_WORKING_HOURS, breaks);
    if (!v.valid) {
      setErrors(v.errors);
      return;
    }
    setErrors([]);
    await markStepComplete('breaks');
    router.push('/onboarding/services');
  };

  return (
    <OnboardingLayout
      step={3}
      totalSteps={8}
      title="Breaks"
      subtitle="No bookings happen during breaks. Set lunch or prayer breaks."
      onBack={() => router.back()}
      onContinue={continueNext}
      continueDisabled={errors.length > 0}
      footerExtra={
        adding ? (
          <Card noPadding style={{ padding: 14 }}>
            <Input label="Break name" value={label} onChangeText={setLabel} placeholder="e.g. Lunch break" small />
            <View style={styles.timeRow}>
              <TimePickerField label="Starts" value={start} onChange={setStart} containerStyle={{ flex: 1 }} />
              <TimePickerField label="Ends" value={end} onChange={setEnd} containerStyle={{ flex: 1 }} />
            </View>
            <View style={styles.addActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button title="Add break" onPress={addBreak} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : null
      }
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
        {breaks.length === 0 && !adding ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>No breaks yet. Add one below or skip.</Text>
        ) : null}
        {breaks.map((b) => (
          <Card key={b.id} noPadding style={{ padding: 14 }}>
            <View style={styles.breakRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.breakName, { color: colors.text }]}>{b.label}</Text>
                <Text style={[styles.breakMeta, { color: colors.textMuted }]}>
                  {b.start} – {b.end}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => removeBreak(b.id)} style={[styles.deleteBtn, { backgroundColor: colors.surface2 }]}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))}
        {!adding ? (
          <Button
            title="Add a break"
            variant="outline"
            onPress={() => setAdding(true)}
            icon={<Ionicons name="add" size={18} color={colors.brand} />}
            style={{ marginTop: 4 }}
          />
        ) : null}
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakName: {
    fontSize: 15,
    fontWeight: '600',
  },
  breakMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    fontSize: 13,
    marginBottom: 12,
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