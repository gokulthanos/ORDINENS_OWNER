import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import OnboardingLayout from '@/components/OnboardingLayout';
import Input from '@/components/Input';
import Chip from '@/components/Chip';
import { useOwner } from '@/store/owner';
import { Shop, ShopType } from '@/types';
import { validateShopDetails } from '@/services/ownerService';
import { required } from '@/utils/validation';

const SHOP_TYPES: Array<{ label: string; value: ShopType }> = [
  { label: 'Barber', value: 'barber' },
  { label: 'Salon', value: 'salon' },
  { label: 'Barber + Salon', value: 'barber-salon' },
];

export default function OnboardingShop() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { draft, updateDraftShop, markStepComplete } = useOwner();
  const shop = draft?.shop ?? {};

  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (key: string, value: string) => {
    setErrors((e) => ({ ...e, form: '' }));
    void updateDraftShop({ [key]: value });
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      void updateDraftShop({ imageUrl: result.assets[0].uri } as Partial<Shop>);
    }
  };

  const continueNext = async () => {
    const v = validateShopDetails({
      ...shop,
      name: shop.name ?? '',
      ownerName: shop.ownerName ?? '',
      phone: shop.phone || shop.ownerPhone || '',
      location: shop.location ?? '',
      address: shop.address ?? '',
    });
    if (!v.valid) {
      setErrors({ form: v.errors[0] });
      return;
    }
    const phone = shop.phone || shop.ownerPhone || '';
    await updateDraftShop({
      phone,
      ownerPhone: phone,
      ownerName: shop.ownerName || shop.ownerName || '',
      shopType: (shop.shopType as ShopType) || 'barber',
    });
    await markStepComplete('shop');
    router.push('/onboarding/working-hours');
  };

  return (
    <OnboardingLayout
      step={1}
      totalSteps={8}
      title="Tell us about your shop"
      subtitle="This info appears to customers looking for you."
      onBack={() => router.back()}
      onContinue={continueNext}
      continueDisabled={!!errors.form}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
        {errors.form ? (
          <Text style={[styles.formError, { color: colors.danger, marginBottom: spacing.sm }]}>{errors.form}</Text>
        ) : null}

        <Pressable onPress={pickImage} style={styles.logoWrap}>
          {shop.imageUrl ? (
            <Image source={{ uri: shop.imageUrl }} style={[styles.logo, { borderColor: colors.border }]} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Ionicons name="image-outline" size={26} color={colors.brand} />
              <Text style={[styles.logoText, { color: colors.textMuted }]}>Add logo</Text>
            </View>
          )}
        </Pressable>

        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Shop type</Text>
        <View style={[styles.typeRow, { marginBottom: spacing.md }]}>
          {SHOP_TYPES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={(shop.shopType as ShopType) === t.value || (shop.shop_type as ShopType) === t.value}
              onPress={() => void updateDraftShop({ shopType: t.value, shop_type: t.value } as Partial<Shop>)}
              style={{ flex: 1, alignItems: 'center' }}
            />
          ))}
        </View>

        <Input label="Shop name *" value={shop.name ?? ''} onChangeText={(t) => setField('name', t)} placeholder="e.g. Styles & Fades" />
        <Input label="Owner name *" value={shop.ownerName ?? ''} onChangeText={(t) => setField('ownerName', t)} placeholder="Your full name" />
        <Input
          label="Contact number *"
          value={shop.phone || shop.ownerPhone || ''}
          onChangeText={(t) => setField('phone', t)}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
        />
        <Input label="Location / area *" value={shop.location ?? ''} onChangeText={(t) => setField('location', t)} placeholder="e.g. RS Puram, Coimbatore" />
        <Input label="Full address *" value={shop.address ?? ''} onChangeText={(t) => setField('address', t)} placeholder="Street, landmark, city" />
        <Input
          label="About your shop"
          value={shop.description ?? ''}
          onChangeText={(t) => setField('description', t)}
          placeholder="Short description for customers"
        />
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  formError: {
    fontSize: 13,
    fontWeight: '500',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
});