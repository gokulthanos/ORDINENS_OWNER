import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import EmptyState from './EmptyState';
import Button from './Button';

interface ShopRequiredStateProps {
  title?: string;
  message?: string;
  showButton?: boolean;
}

/*
 * Locked empty state shown for shop-dependent features when the owner
 * has not created a shop yet. The owner is never auto-redirected to the
 * setup flow from here — they decide whether to add the shop.
 */
export default function ShopRequiredState({
  title = 'Add your shop first',
  message = 'This feature unlocks once your shop has been added.',
  showButton = true,
}: ShopRequiredStateProps) {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 40 }}>
      <EmptyState title={title} message={message} icon="storefront-outline" />
      {showButton ? (
        <Button
          title="Add Your Shop"
          onPress={() => router.push('/onboarding/shop')}
          style={{ alignSelf: 'center', marginTop: spacing.md, minWidth: 180 }}
          icon={<Ionicons name="add" size={16} color={colors.white} />}
        />
      ) : null}
    </View>
  );
}