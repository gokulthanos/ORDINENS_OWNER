import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/theme';
import Button from '@/components/Button';

export default function NotFound() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Page not found</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>The screen you are looking for does not exist.</Text>
      <Button title="Go home" onPress={() => router.replace('/(tabs)/dashboard')} style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  sub: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});