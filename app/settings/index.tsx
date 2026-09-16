import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/store/auth';
import { useOwner } from '@/store/owner';
import { isSupabaseMode } from '@/services/dataMode';
import { isSupabaseConfigured } from '@/services/supabase';
import { STORAGE_KEYS, removeItem } from '@/utils/storage';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { colors, spacing } = useTheme();
  const { session } = useAuth();
  const { resetDraft, refreshShop } = useOwner();

  const mode = isSupabaseConfigured && isSupabaseMode() ? 'supabase' : 'mock';

  const clearCachedData = () => {
    Alert.alert(
      'Clear cached data?',
      'Removes the locally stored shop, bookings, services, team and holidays. Your sign-in stays. Reloads fresh data from the server when available.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await removeItem(STORAGE_KEYS.shop);
            await removeItem(STORAGE_KEYS.bookings);
            await removeItem(STORAGE_KEYS.services);
            await removeItem(STORAGE_KEYS.staff);
            await removeItem(STORAGE_KEYS.holidays);
            await removeItem(STORAGE_KEYS.onboarding);
            await refreshShop();
            Alert.alert('Done', 'Cached data cleared.');
          },
        },
      ]
    );
  };

  const restartOnboarding = () => {
    Alert.alert(
      'Start setup again?',
      'This resets your shop profile and onboarding progress. Your account stays signed in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetDraft();
            Alert.alert('Done', 'Onboarding was reset. Finish setup again to go live.', [
              { text: 'OK' },
            ]);
          },
        },
      ]
    );
  };

  return (
    <Screen scroll={false} padded>
      <Header title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <Card>
          <Text style={[styles.section, { color: colors.textMuted }]}>Account</Text>
          <Row icon="mail-outline" label="Email" value={session?.email ?? '—'} />
          <Row icon="person-outline" label="Name" value={session?.name ?? '—'} />
        </Card>

        <Card>
          <Text style={[styles.section, { color: colors.textMuted }]}>Data mode</Text>
          <View style={styles.modeRow}>
            <View style={[styles.modeBadge, { backgroundColor: colors.surface2 }]}>
              <Ionicons name={mode === 'mock' ? 'flask-outline' : 'server-outline'} size={14} color={colors.brand} />
              <Text style={[styles.modeText, { color: colors.text }]}>
                {mode === 'mock' ? 'Prototype mode (local storage)' : 'Live backend (Supabase)'}
              </Text>
            </View>
            <Text style={[styles.modeHint, { color: colors.textFaint }]}>
              {isSupabaseConfigured
                ? 'Backend is configured. Flip EXPO_PUBLIC_DATA_MODE in .env to "supabase" to go live.'
                : 'Add your Supabase keys in .env to connect the backend.'}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={[styles.section, { color: colors.textMuted }]}>Storage</Text>
          <Button title="Clear cached data" variant="outline" onPress={clearCachedData} style={{ marginBottom: 8 }} />
          <Button title="Restart shop setup" variant="secondary" onPress={restartOnboarding} />
        </Card>

        <Card>
          <Text style={[styles.section, { color: colors.textMuted }]}>About</Text>
          <Row icon="information-circle-outline" label="App" value="Ordinens Owner" />
          <Row icon="cube-outline" label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
          <Row icon="globe-outline" label="Website" value="ordinens.tech" />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 'auto',
    flexShrink: 1,
  },
  modeRow: {
    gap: 8,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modeHint: {
    fontSize: 12,
    lineHeight: 17,
  },
});