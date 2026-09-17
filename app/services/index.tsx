import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Header from '@/components/Header';
import ServiceCard from '@/components/ServiceCard';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import { useOwner } from '@/store/owner';
import { getServices, setServiceActive, deleteService } from '@/services/serviceService';
import { Service } from '@/types';

export default function ServicesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { shop } = useOwner();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const load = useCallback(async () => {
    if (!shop?.id) {
      setLoading(false);
      return;
    }
    setServices(await getServices(shop.id));
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

  const toggleActive = async (service: Service) => {
    if (!shop?.id) return;
    await setServiceActive(service.id, !service.is_active, shop.id);
    await load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !shop?.id) return;
    await deleteService(deleteTarget.id, shop.id);
    setDeleteTarget(null);
    await load();
  };

  if (loading && !refreshing) {
    return (
      <Screen>
        <Header title="Services" />
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded>
      <Header
        title="Services"
        subtitle={services.length ? `${services.length} service(s) offered` : undefined}
        right={
          <Pressable
            onPress={() => router.push('/services/add')}
            style={[styles.addBtn, { backgroundColor: colors.brand }]}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        }
      />
      <FlatList
        data={services}
        keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListEmptyComponent={
          <EmptyState
            title="No services yet"
            message="Tap Add to create your first service."
            icon="cut-outline"
          />
        }
        renderItem={({ item }) => (
          <View>
            <ServiceCard
              service={item}
              active={item.is_active}
              onPress={() => router.push(`/services/add?id=${item.id}`)}
            />
            <View style={[styles.rowActions, { borderColor: colors.border }]}>
              <Pressable onPress={() => toggleActive(item)} style={styles.rowAction}>
                <Ionicons
                  name={item.is_active ? 'eye-off-outline' : 'eye-outline'}
                  size={15}
                  color={colors.textMuted}
                />
                <Text style={[styles.rowActionText, { color: colors.textMuted }]}>
                  {item.is_active ? 'Make inactive' : 'Make active'}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push(`/services/add?id=${item.id}`)} style={styles.rowAction}>
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
        title="Delete this service?"
        message={`"${deleteTarget?.name}" will be removed from your shop. Bookings already made are not affected.`}
        confirmLabel="Delete"
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