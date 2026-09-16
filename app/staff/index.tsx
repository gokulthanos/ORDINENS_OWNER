import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Header from '@/components/Header';
import StaffCard from '@/components/StaffCard';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import { useOwner } from '@/store/owner';
import { getStaff, setStaffActive, deleteStaff } from '@/services/staffService';
import { StaffMember } from '@/types';

export default function StaffScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { shop } = useOwner();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const load = useCallback(async () => {
    if (!shop?.id) {
      setLoading(false);
      return;
    }
    setStaff(await getStaff(shop.id));
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

  const toggleActive = async (m: StaffMember) => {
    if (!shop?.id) return;
    await setStaffActive(m.id, shop.id, m.status !== 'active');
    await load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteStaff(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  };

  if (loading && !refreshing) {
    return (
      <Screen>
        <Header title="Team" />
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded>
      <Header
        title="Team"
        subtitle={staff.length ? `${staff.length} member(s)` : undefined}
        right={
          <Pressable
            onPress={() => router.push('/staff/add')}
            style={[styles.addBtn, { backgroundColor: colors.brand }]}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        }
      />
      <FlatList
        data={staff}
        keyExtractor={(m) => m.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListEmptyComponent={
          <EmptyState title="No team members yet" message="Tap Add to bring someone on the team." icon="people-outline" />
        }
        renderItem={({ item }) => (
          <View>
            <StaffCard staff={item} onPress={() => router.push(`/staff/add?id=${item.id}`)} />
            <View style={[styles.rowActions, { borderColor: colors.border }]}>
              <Pressable onPress={() => toggleActive(item)} style={styles.rowAction}>
                <Ionicons name={item.status === 'active' ? 'eye-off-outline' : 'eye-outline'} size={15} color={colors.textMuted} />
                <Text style={[styles.rowActionText, { color: colors.textMuted }]}>
                  {item.status === 'active' ? 'Deactivate' : 'Activate'}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push(`/staff/add?id=${item.id}`)} style={styles.rowAction}>
                <Ionicons name="create-outline" size={15} color={colors.textMuted} />
                <Text style={[styles.rowActionText, { color: colors.textMuted }]}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => setDeleteTarget(item)} style={styles.rowAction}>
                <Ionicons name="trash-outline" size={15} color={colors.danger} />
                <Text style={[styles.rowActionText, { color: colors.danger }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      <ConfirmModal
        visible={!!deleteTarget}
        title="Remove this team member?"
        message={`"${deleteTarget?.name}" will be removed from your shop. Existing bookings are not affected.`}
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    gap: 18,
  },
  rowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  rowActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});