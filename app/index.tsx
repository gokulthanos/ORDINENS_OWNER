import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/store/auth';
import { useOwner } from '@/store/owner';
import LoadingState from '@/components/LoadingState';

export default function Index() {
  const { session, loading } = useAuth();
  const { shop, shopLoading } = useOwner();

  if (loading || shopLoading) return <LoadingState label="Opening your workspace…" />;
  if (!session) return <Redirect href="/auth/login" />;
  if (!shop) return <Redirect href="/onboarding/shop" />;
  if (shop.status === 'pending' && shop.is_live === false) return <Redirect href="/onboarding/review" />;
  return <Redirect href="/(tabs)/dashboard" />;
}