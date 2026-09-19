import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/store/auth';
import LoadingState from '@/components/LoadingState';

export default function Index() {
  const { session, loading } = useAuth();

  // 1. Wait for the session check to complete before rendering anything.
  //    Never show the dashboard while auth is still being decided.
  if (loading) return <LoadingState label="Opening your workspace…" />;

  // 2. No authenticated owner session -> Login Page. Always the entry point.
  if (!session) return <Redirect href="/auth/login" />;

  // 3. Authenticated owner -> Owner Dashboard.
  //    The dashboard is always the main screen after login.
  //    Shop state (created or not) is handled inside the dashboard:
  //    owners without a shop see the "No Shop Yet" state there.
  //    We never redirect an unauthenticated user to shop setup screens.
  return <Redirect href="/(tabs)/dashboard" />;
}