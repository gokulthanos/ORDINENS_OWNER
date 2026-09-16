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
import { getStaffMember, addStaff, updateStaff } from '@/services/staffService';

const ROLES = ['Barber', 'Hair Stylist', 'Colorist', 'Massage Therapist', 'Makeup Artist'];

export default function AddStaffScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { shop } = useOwner();

  const isEdit = Boolean(id);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Barber');
  const [specialty, setSpecialty] = useState('');
  const [years, setYears] = useState('');
  const [active, setActive] = useState(true);
  const [loadingInit, setLoadingInit] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (id && shop?.id) {
      getStaffMember(id, shop.id).then((m) => {
        if (m) {
          setName(m.name);
          setRole(m.role || 'Barber');
          setSpecialty(m.specialty ?? '');
          setYears(m.years_of_experience ? String(m.years_of_experience) : '');
          setActive(m.status === 'active');
        }
        setLoadingInit(false);
      });
    }
  }, [id, shop?.id]);

  const save = async () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Full name is required.');
    setErrors(errs);
    if (errs.length || !shop?.id) return;

    setSaving(true);
    const input = {
      name: name.trim(),
      role: role || 'Barber',
      specialty: specialty.trim(),
      years_of_experience: Number(years) || 0,
    };
    if (isEdit && id) {
      await updateStaff(id, shop.id, { ...input, status: active ? 'active' : 'inactive' });
    } else {
      await addStaff(shop.id, input);
    }
    setSaving(false);
    router.back();
  };

  if (loadingInit) {
    return (
      <Screen>
        <Header title="Team member" />
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded>
      <Header title={isEdit ? 'Edit team member' : 'New team member'} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
        {errors.length ? (
          <View style={[styles.errorBox, { backgroundColor: `${colors.danger}14`, borderColor: colors.danger }]}>
            {errors.map((e) => (
              <Text key={e} style={[styles.errorText, { color: colors.danger }]}>{e}</Text>
            ))}
          </View>
        ) : null}
        <Card noPadding style={{ padding: 14 }}>
          <Input label="Full name *" value={name} onChangeText={setName} placeholder="e.g. Rakesh Kumar" />
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Role</Text>
          <View style={styles.chipRow}>
            {ROLES.map((r) => (
              <Chip key={r} label={r} selected={role === r} onPress={() => setRole(r)} />
            ))}
          </View>
          <View style={styles.timeRow}>
            <Input
              label="Specialty"
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="e.g. Beard sculpting"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Years exp."
              value={years}
              onChangeText={(t) => setYears(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
              placeholder="5"
            />
          </View>
          {isEdit ? (
            <SwitchRow label="Active member" value={active} onChange={setActive} />
          ) : null}
        </Card>
        <Button title={isEdit ? 'Save changes' : 'Add to team'} onPress={save} loading={saving} style={{ marginTop: spacing.sm }} />
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