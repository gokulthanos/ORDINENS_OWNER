import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Chip from '@/components/Chip';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import { useOwner } from '@/store/owner';
import { BookingRules } from '@/types';
import { validateBookingRules } from '@/services/ownerService';

const INTERVALS = [15, 30, 45, 60];

export default function BookingRulesScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { shop, shopLoading, updateShopDetails, refreshShop } = useOwner();

  const [rules, setRules] = useState<BookingRules>(() => ({
    booking_window: shop?.booking_window ?? 30,
    cancellation_hours: shop?.cancellation_hours ?? 2,
    capacity: shop?.capacity ?? 1,
    slot_interval: shop?.slot_interval ?? 30,
  }));
  const [saving, setSaving] = useState(false);

  if (shopLoading) return <Screen><Header title="Booking rules" /></Screen>;

  // Shop-dependent feature — locked until the owner adds a shop.
  if (!shop) {
    return (
      <Screen scroll={false} padded>
        <Header title="Booking rules" />
        <EmptyState
          title="Add your shop first"
          message="Booking rules unlock once your shop has been added."
          icon="time-outline"
        />
        <Button title="Add Your Shop" onPress={() => router.push('/onboarding/shop')} style={{ marginBottom: spacing.xl }} icon={<Ionicons name="add" size={16} color="#fff" />} />
      </Screen>
    );
  }

  const setRule = (key: keyof BookingRules, value: number) => {
    setRules((r) => ({ ...r, [key]: value }));
  };

  const save = async () => {
    const v = validateBookingRules(rules);
    if (!v.valid) {
      Alert.alert('Check your rules', v.errors[0]);
      return;
    }
    setSaving(true);
    try {
      await updateShopDetails({
        booking_window: rules.booking_window,
        cancellation_hours: rules.cancellation_hours,
        capacity: rules.capacity,
        slot_interval: rules.slot_interval,
      });
      await refreshShop();
      Alert.alert('Saved', 'Your booking rules were updated.');
    } catch {
      Alert.alert('Error', 'Unable to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false} padded>
      <Header title="Booking rules" subtitle="These control how far ahead and how often customers can book" />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
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

        <Button title="Save changes" onPress={save} loading={saving} style={{ marginTop: spacing.xl, marginBottom: spacing.xl }} />
      </ScrollView>
    </Screen>
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
});