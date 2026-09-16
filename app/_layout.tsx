import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/store/auth';
import { OwnerProvider } from '@/store/owner';
import { useTheme } from '@/constants/theme';

function RootNavigator() {
  const { session, loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  const signedIn = !!session;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="bookings/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="services/index" options={{ headerShown: false }} />
          <Stack.Screen name="services/add" options={{ headerShown: false }} />
          <Stack.Screen name="staff/index" options={{ headerShown: false }} />
          <Stack.Screen name="staff/add" options={{ headerShown: false }} />
          <Stack.Screen name="holidays/index" options={{ headerShown: false }} />
          <Stack.Screen name="shop/index" options={{ headerShown: false }} />
          <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OwnerProvider>
          <RootNavigator />
        </OwnerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}