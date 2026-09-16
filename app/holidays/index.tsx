import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import DatePickerField from '@/components/DatePickerField';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import { useOwner } from '@/store/owner';
import { getHolidays, addHoliday, deleteHoliday } from '@/services/holidayService';
import { ShopHoliday } from '@/types';

export default function HolidaysScreen() {
  const { colors, spacing } = useTheme();
  const { shop } = useOwner();

  const [holidays, setHolidays] = useState<ShopHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopHoliday | null>(null);

  const load = useCallback(async () => {
    if (!shop?.id) {
      setLoading(false);
      return;
    }
    setHolidays(await getHolidays(shop.id));
    setLoading(false);
  }, [shop?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const submit = async () => {
    if (!shop?.id) return;
    if (!date) {
      setFormError('Pick a date for the holiday.');
      return;
    }
    if (!name.trim()) {
      setFormError('Give the holiday a name.');
      return;
    }
    setFormError(null);
    await addHoliday(shop.id, { holiday_date: date, name: name.trim(), reason: reason.trim() });
    setAdding(false);
    setDate('');
    setName('');
    setReason('');
    await load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteHoliday(deleteTarget.id!);
    setDeleteTarget(null);
    await load();
  };

  if (loading && !refreshing) {
    return (
      <Screen>
        <Header title="Holidays" />
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded>
      <Header
        title="Holidays"
        subtitle="No bookings are accepted on these days."
        right={
          <Pressable onPress={() => setAdding((v) => !v)} style={[styles.addBtn, { backgroundColor: adding ? colors.surface2 : colors.brand }]}>
            <Ionicons name={adding ? 'close' : 'add'} size={18} color={adding ? colors.text : '#fff'} />
            <Text style={[styles.addBtnText, { color: adding ? colors.text : '#fff' }]}>{adding ? 'Close' : 'Add'}</Text>
          </Pressable>
        }
      />
      {adding ? (
        <Card noPadding style={{ padding: 14 }}>
          <DatePickerField
            label="Holiday date *"
            value={date}
            onChange={(d) => {
              setDate(d);
              setFormError(null);
            }}
            minimumDate={new Date()}
          />
          <Input label="Holiday name *" value={name} onChangeText={setName} placeholder="e.g. Diwali" />
          <Input label="Reason (optional)" value={reason} onChangeText={setReason} placeholder="e.g. Festival celebrations" />
          {formError ? <Text style={[styles.errorText, { color: colors.danger }]}>{formError}</Text> : null}
          <Button title="Save holiday" onPress={submit} style={{ marginTop: spacing.xs }} />
        </Card>
      ) : null}
      <FlatList
        data={holidays}
        keyExtractor={(h) => h.id ?? h.holiday_date}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListEmptyComponent={
          <EmptyState
            title="No holidays set"
            message="Add a holiday and bookings will pause on that day."
            icon="sunny-outline"
          />
        }
        renderItem={({ item }) => (
          <Card noPadding style={{ padding: 14 }}>
            <View style={styles.row}>
              <View style={[styles.dateBox, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.dateDay, { color: colors.brand }]}>{item.holiday_date}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                {item.reason ? <Text style={[styles.reason, { color: colors.textMuted }]}>{item.reason}</Text> : null}
              </View>
              <Pressable hitSlop={10} onPress={() => setDeleteTarget(item)} style={[styles.deleteBtn, { backgroundColor: colors.surface2 }]}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        )}
      />
      <ConfirmModal
        visible={!!deleteTarget}
        title="Remove this holiday?"
        message={`"${deleteTarget?.name}" will no longer block bookings.`}
        confirmLabel="Remove"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: 92,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  reason: {
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
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: -2,
  },
});