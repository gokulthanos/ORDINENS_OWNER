import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Card from '@/components/Card';
import SwitchRow from '@/components/SwitchRow';
import Button from '@/components/Button';
import { useAuth } from '@/store/auth';
import { useOwner } from '@/store/owner';
import { setShopLiveStatus } from '@/services/ownerService';

export default function MoreScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { shop, shopLoading, refreshShop } = useOwner();

  useFocusEffect(
    useCallback(() => {
      refreshShop();
    }, [refreshShop])
  );

  const loading = shopLoading || !shop;

  const toggleLive = async (value: boolean) => {
    if (!shop) return;
    Alert.alert(
      value ? 'Go live' : 'Take shop offline',
      value
        ? 'Customers will be able to book immediately.'
        : 'Customers will no longer be able to create new bookings while your shop is offline.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: value ? 'Go live' : 'Go offline',
          style: value ? 'default' : 'destructive',
          onPress: async () => {
            await setShopLiveStatus(shop.id, value ? 'active' : 'inactive');
            await refreshShop();
          },
        },
      ]
    );
  };

  const onSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen title="More" subtitle="Manage your shop and account" scroll={false}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <Card noPadding style={{ padding: 6 }}>
          <MenuItem icon="storefront-outline" label="Shop details" onPress={() => router.push('/shop')} last={false} />
          <MenuItem icon="cut-outline" label="Services" onPress={() => router.push('/services')} last={false} />
          <MenuItem icon="people-outline" label="Team" onPress={() => router.push('/staff')} last={false} />
          <MenuItem icon="sunny-outline" label="Holidays" onPress={() => router.push('/holidays')} last />
        </Card>

        {!loading ? (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Shop status</Text>
            <SwitchRow
              label="Accept new bookings"
              hint={shop.is_live ? 'Your shop is live on Ordinens.' : 'Customers cannot book right now.'}
              value={shop.is_live || shop.status === 'active'}
              onChange={toggleLive}
            />
          </Card>
        ) : null}

        <Card noPadding style={{ padding: 6 }}>
          <MenuItem icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} last={false} />
          <MenuItem icon="help-circle-outline" label="Support & feedback" onPress={() => Alert.alert('Support', 'Write to support@ordinens.tech and we will help you right away.')} last />
        </Card>

        <Button
          title="Sign out"
          variant="danger"
          onPress={onSignOut}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </Screen>
  );
}

function MenuItem({ icon, label, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; last: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.menuItem,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: colors.surface2 }]}>
        <Ionicons name={icon} size={18} color={colors.brand} />
      </View>
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
});