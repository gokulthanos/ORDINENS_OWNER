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
import { StaffMember } from '@/types';
import { validateStaff } from '@/services/ownerService';
import { staffColor } from '@/services/staffService';

const ROLES = ['Barber', 'Hair Stylist', 'Colorist', 'Massage Therapist', 'Makeup Artist'];

interface EditState {
  index: number | null;
  name: string;
  role: string;
  specialty: string;
  years: string;
}

export default function OnboardingStaff() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { draft, setDraftStaff, markStepComplete } = useOwner();
  const staff: Partial<StaffMember>[] = draft?.staff ?? [];
  const [errors, setErrors] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [edit, setEdit] = useState<EditState>({ index: null, name: '', role: 'Barber', specialty: '', years: '' });

  const resetForm = () => setEdit({ index: null, name: '', role: 'Barber', specialty: '', years: '' });

  const startAdd = () => {
    setErrors([]);
    resetForm();
    setAdding(true);
  };

  const startEdit = (index: number) => {
    setErrors([]);
    const m = staff[index] ?? {};
    setEdit({
      index,
      name: m.name ?? '',
      role: m.role || 'Barber',
      specialty: m.specialty ?? '',
      years: m.years_of_experience ? String(m.years_of_experience) : '',
    });
    setAdding(true);
  };

  const save = () => {
    if (!edit.name.trim()) {
      setErrors(['Full name is required.']);
      return;
    }
    const entry: Partial<StaffMember> = {
      name: edit.name.trim(),
      role: edit.role || 'Barber',
      specialty: edit.specialty.trim(),
      years_of_experience: Number(edit.years) || 0,
      status: 'active',
      color: staffColor(staff.length),
    };
    const next = [...staff];
    if (edit.index != null && next[edit.index]) {
      next[edit.index] = { ...next[edit.index], ...entry };
    } else {
      next.push(entry);
    }
    void setDraftStaff(next);
    setAdding(false);
    setErrors([]);
  };

  const remove = (index: number) => {
    void setDraftStaff(staff.filter((_, i) => i !== index));
  };

  const continueNext = async () => {
    const v = validateStaff(staff);
    if (!v.valid) {
      setErrors(v.errors);
      return;
    }
    setErrors([]);
    await markStepComplete('staff');
    router.push('/onboarding/booking-rules');
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={8}
      title="Your team"
      subtitle="Add the barbers and stylists who work at your shop."
      onBack={() => router.back()}
      onContinue={staff.length ? continueNext : undefined}
      continueDisabled={staff.length === 0}
      footerExtra={
        adding ? (
          <Card noPadding style={{ padding: 14 }}>
            <Input label="Full name *" value={edit.name} onChangeText={(t) => setEdit({ ...edit, name: t })} placeholder="e.g. Rakesh Kumar" />
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Role</Text>
            <View style={styles.chipRow}>
              {ROLES.map((r) => (
                <Chip key={r} label={r} selected={edit.role === r} onPress={() => setEdit({ ...edit, role: r })} />
              ))}
            </View>
            <View style={styles.timeRow}>
              <Input
                label="Specialty"
                value={edit.specialty}
                onChangeText={(t) => setEdit({ ...edit, specialty: t })}
                placeholder="e.g. Beard sculpting"
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Years exp."
                value={edit.years}
                onChangeText={(t) => setEdit({ ...edit, years: t.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
                placeholder="5"
              />
            </View>
            {errors.length ? (
              <Text style={[styles.errorText, { color: colors.danger, marginBottom: spacing.sm }]}>{errors[0]}</Text>
            ) : null}
            <View style={styles.addActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button title={edit.index != null ? 'Save' : 'Add to team'} onPress={save} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : null
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {staff.map((m, i) => (
          <Card key={`${m.name}-${i}`} noPadding style={{ padding: 14 }}>
            <View style={styles.svcRow}>
              <View style={[styles.avatar, { backgroundColor: m.color || colors.brand }]}>
                <Text style={styles.avatarText}>{(m.name ?? 'S').slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.svcName, { color: colors.text }]}>{m.name}</Text>
                <Text style={[styles.svcMeta, { color: colors.textMuted }]}>
                  {m.role} {m.years_of_experience ? `· ${m.years_of_experience}+ yrs` : ''}
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
        {staff.length === 0 && !adding ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>No team members yet. Add your first one.</Text>
        ) : null}
        {!adding ? (
          <Button
            title="Add a team member"
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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