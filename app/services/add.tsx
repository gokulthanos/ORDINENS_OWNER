import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Chip from '@/components/Chip';
import Button from '@/components/Button';
import SwitchRow from '@/components/SwitchRow';
import LoadingState from '@/components/LoadingState';
import { useOwner } from '@/store/owner';
import { getService, addService, updateService } from '@/services/serviceService';

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function AddServiceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { shop } = useOwner();

  const isEdit = Boolean(id);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [loadingInit, setLoadingInit] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (id && shop?.id) {
      getService(id, shop.id).then((s) => {
        if (s) {
          setName(s.name);
          setPrice(String(s.price ?? ''));
          setDuration(String(s.duration_minutes ?? s.duration ?? 30));
          setDescription(s.description ?? '');
          setActive(s.is_active);
        }
        setLoadingInit(false);
      });
    }
  }, [id, shop?.id]);

  const save = async () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Service name is required.');
    const p = Number(price);
    if (!p || p <= 0) errs.push('Price must be greater than zero.');
    if (!Number(duration)) errs.push('Pick a duration.');
    setErrors(errs);
    if (errs.length || !shop?.id) return;

    setSaving(true);
    const input = {
      name: name.trim(),
      price: p,
      duration_minutes: Number(duration),
      description: description.trim() || null,
      emoji: null,
    };
    if (isEdit && id) {
      await updateService(id, { ...input, is_active: active, status: active ? 'active' : 'inactive' });
    } else {
      await addService(shop.id, input);
    }
    setSaving(false);
    router.back();
  };

  if (loadingInit) {
    return (
      <Screen>
        <Header title="Service" />
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded>
      <Header title={isEdit ? 'Edit service' : 'New service'} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
        {errors.length ? (
          <View style={[styles.errorBox, { backgroundColor: `${colors.danger}14`, borderColor: colors.danger }]}>
            {errors.map((e) => (
              <Text key={e} style={[styles.errorText, { color: colors.danger }]}>{e}</Text>
            ))}
          </View>
        ) : null}
        <Card noPadding style={{ padding: 14 }}>
          <Input label="Service name *" value={name} onChangeText={setName} placeholder="e.g. Haircut & Beard Trim" />
          <View style={styles.timeRow}>
            <Input
              label="Price (₹) *"
              value={price}
              onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              placeholder="199"
              containerStyle={{ flex: 1 }}
            />
            <View style={{ flex: 1 }} />
          </View>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Duration *</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map((d) => (
              <Chip key={d} label={`${d} min`} selected={Number(duration) === d} onPress={() => setDuration(String(d))} />
            ))}
          </View>
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Optional – what's included"
            multiline
            numberOfLines={3}
            style={{ height: 84, textAlignVertical: 'top', paddingTop: 10 }}
          />
          {isEdit ? (
            <SwitchRow label="Available for booking" value={active} onChange={setActive} />
          ) : null}
        </Card>
        <Button title={isEdit ? 'Save changes' : 'Add service'} onPress={save} loading={saving} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
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