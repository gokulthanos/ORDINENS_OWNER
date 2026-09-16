import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="shop" />
      <Stack.Screen name="working-hours" />
      <Stack.Screen name="breaks" />
      <Stack.Screen name="services" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="booking-rules" />
      <Stack.Screen name="review" />
      <Stack.Screen name="go-live" />
    </Stack>
  );
}