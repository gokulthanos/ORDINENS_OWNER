import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import OnboardingLayout from '@/components/OnboardingLayout';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Chip from '@/components/Chip';
import { useOwner } from '@/store/owner';
import { Service } from '@/types';
import { validateServices } from '@/services/ownerService';

const DURATIONS = [15, 30, 45, 60, 90, 120];

interface EditState {
  index: number | null;
  name: string;
  price: string;
  duration: string;
  description: string;
}

export default function OnboardingServices() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { draft, setDraftServices, markStepComplete } = useOwner();
  const services: Partial<Service>[] = draft?.services ?? [];
  const [errors, setErrors] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [edit, setEdit] = useState<EditState>({ index: null, name: '', price: '', duration: '30', description: '' });

  const resetForm = () => setEdit({ index: null, name: '', price: '', duration: '30', description: '' });

  const startAdd = () => {
    setErrors([]);
    resetForm();
    setAdding(true);
  };

  const startEdit = (index: number) => {
    setErrors([]);
    const s = services[index] ?? {};
    setEdit({
      index,
      name: s.name ?? '',
      price: s.price != null ? String(s.price) : '',
      duration: String(s.duration_minutes ?? s.duration ?? 30),
      description: s.description ?? '',
    });
    setAdding(true);
  };

  const save = () => {
    const errs: string[] = [];
    if (!edit.name.trim()) errs.push('Service name is required.');
    const price = Number(edit.price);
    if (!price || price <= 0) errs.push('Price must be greater than zero.');
    if (!Number(edit.duration)) errs.push('Pick a duration.');
    setErrors(errs);
    if (errs.length) return;

    const entry: Partial<Service> = {
      name: edit.name.trim(),
      price,
      duration_minutes: Number(edit.duration),
      duration: Number(edit.duration),
      description: edit.description.trim() || null,
      is_active: true,
      status: 'active',
    };
    const next = [...services];
    if (edit.index != null && next[edit.index]) {
      next[edit.index] = { ...next[edit.index], ...entry };
    } else {
      next.push(entry);
    }
    void setDraftServices(next);
    setAdding(false);
    setErrors([]);
  };

  const remove = (index: number) => {
    const next = services.filter((_, i) => i !== index);
    void setDraftServices(next);
  };

  const continueNext = async () => {
    const v = validateServices(services);
    if (!v.valid) {
      setErrors(v.errors);
      return;
    }
    setErrors([]);
    await markStepComplete('services');
    router.push('/onboarding/staff');
  };

  return (
    <OnboardingLayout
      step={4}
      totalSteps={8}
      title="Services"
      subtitle="Add what you offer. Price is what customers pay when they book."
      onBack={() => router.back()}
      onContinue={services.length ? continueNext : undefined}
      continueDisabled={services.length === 0}
      footerExtra={
        adding ? (
          <Card noPadding style={{ padding: 14 }}>
            <Input label="Service name *" value={edit.name} onChangeText={(t) => setEdit({ ...edit, name: t })} placeholder="e.g. Haircut & Beard Trim" />
            <View style={styles.timeRow}>
              <Input
                label="Price (₹) *"
                value={edit.price}
                onChangeText={(t) => setEdit({ ...edit, price: t.replace(/[^0-9.]/g, '') })}
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
                placeholder="199"
              />
              <View style={{ flex: 1 }} />
            </View>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Duration *</Text>
            <View style={styles.chipRow}>
              {DURATIONS.map((d) => (
                <Chip
                  key={d}
                  label={`${d} min`}
                  selected={Number(edit.duration) === d}
                  onPress={() => setEdit({ ...edit, duration: String(d) })}
                />
              ))}
            </View>
            <Input
              label="Description"
              value={edit.description}
              onChangeText={(t) => setEdit({ ...edit, description: t })}
              placeholder="Optional – what's included"
              multiline
              numberOfLines={2}
              style={{ height: 70, textAlignVertical: 'top', paddingTop: 10 }}
            />
            {errors.length ? (
              <Text style={[styles.errorText, { color: colors.danger, marginBottom: spacing.sm }]}>{errors[0]}</Text>
            ) : null}
            <View style={styles.addActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button title={edit.index != null ? 'Save' : 'Add service'} onPress={save} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : null
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {services.map((s, i) => (
          <Card key={`${s.name}-${i}`} noPadding style={{ padding: 14 }}>
            <View style={styles.svcRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.svcName, { color: colors.text }]}>{s.name}</Text>
                <Text style={[styles.svcMeta, { color: colors.textMuted }]}>
                  ₹{s.price ?? 0} · {s.duration_minutes ?? s.duration ?? 30} min
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => startEdit(i)} style={styles.iconBtn}>
                <Ionicons name="create-outline" size={16} color={colors.brand} />
              </Pressable>
              <Pressable hitSlop={10} onPress={() => remove(i)} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))}
        {services.length === 0 && !adding ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>No services yet. Add your first one.</Text>
        ) : null}
        {!adding ? (
          <Button
            title="Add a service"
            variant="outline"
            onPress={startAdd}
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
  svcRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  svcName: {
    fontSize: 15,
    fontWeight: '600',
  },
  svcMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  iconBtn: {
    padding: 8,
    marginLeft: 4,
  },
  empty: {
    fontSize: 13,
    marginBottom: 12,
  },
  addActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});