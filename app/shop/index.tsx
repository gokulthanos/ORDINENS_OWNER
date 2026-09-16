import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Chip from '@/components/Chip';
import Button from '@/components/Button';
import TimePickerField from '@/components/TimePickerField';
import SwitchRow from '@/components/SwitchRow';
import LoadingState from '@/components/LoadingState';
import { useOwner } from '@/store/owner';
import { Shop, ShopType, DayKey, DayConfig, ShopBreak } from '@/types';
import { EMPTY_WORKING_HOURS } from '@/services/shopService';
import { saveWorkingHours, saveBreaks } from '@/services/shopService';
import { uid } from '@/utils/storage';

const SHOP_TYPES: Array<{ label: string; value: ShopType }> = [
  { label: 'Barber', value: 'barber' },
  { label: 'Salon', value: 'salon' },
  { label: 'Barber + Salon', value: 'barber-salon' },
];

const DAY_ORDER: Array<{ key: DayKey; label: string }> = [
  { key: 'sun', label: 'Sunday' },
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
];

export default function ShopScreen() {
  const { colors, spacing } = useTheme();
  const { shop, shopLoading, updateShopDetails, setShopImage, refreshShop } = useOwner();

  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ShopType>('barber');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [workingHours, setWorkingHours] = useState({ ...EMPTY_WORKING_HOURS });
  const [breaks, setBreaks] = useState<ShopBreak[]>([]);
  const [newBreakLabel, setNewBreakLabel] = useState('');
  const [newBreakStart, setNewBreakStart] = useState('13:00');
  const [newBreakEnd, setNewBreakEnd] = useState('14:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shop) {
      setName(shop.name ?? '');
      setOwnerName(shop.ownerName ?? '');
      setPhone(shop.phone || shop.ownerPhone || '');
      setLocation(shop.location ?? '');
      setAddress(shop.address ?? '');
      setDescription(shop.description ?? '');
      setType((shop.shopType as ShopType) || 'barber');
      setImageUrl(shop.imageUrl ?? shop.image_url ?? null);
      setWorkingHours(shop.workingHours ?? { ...EMPTY_WORKING_HOURS });
      setBreaks(shop.breaks ?? []);
    }
  }, [shop?.id]);

  if (shopLoading && !shop) {
    return (
      <Screen>
        <Header title="Shop details" />
        <LoadingState />
      </Screen>
    );
  }

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const setDay = (key: DayKey, patch: Partial<DayConfig>) => {
    setWorkingHours((wh) => ({ ...wh, [key]: { ...wh[key], ...patch } }));
  };

  const addBreak = () => {
    if (!newBreakLabel.trim()) return;
    setBreaks((b) => [...b, { id: uid('BR'), label: newBreakLabel.trim(), start: newBreakStart, end: newBreakEnd }]);
    setNewBreakLabel('');
  };

  const removeBreak = (id: string) => setBreaks((b) => b.filter((x) => x.id !== id));

  const save = async () => {
    if (!shop) return;
    if (!name.trim()) {
      Alert.alert('Shop name required', 'Please enter your shop name.');
      return;
    }
    setSaving(true);
    try {
      await updateShopDetails({
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        address: address.trim(),
        description: description.trim(),
        shopType: type,
        shop_type: type,
      });
      await saveWorkingHours(shop.id, workingHours);
      await saveBreaks(shop.id, breaks);
      const currentImage = imageUrl;
      if (currentImage && currentImage.startsWith('file://')) {
        await setShopImage(currentImage);
      }
      await refreshShop();
      Alert.alert('Saved', 'Your shop details were updated.');
    } catch {
      Alert.alert('Error', 'Unable to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false} padded>
      <Header title="Shop details" subtitle="Edit how your shop appears" />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
        <Pressable onPress={pickImage} style={[styles.logoWrap, { marginBottom: spacing.lg }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={[styles.logo, { borderColor: colors.border }]} />
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
              selected={type === t.value}
              onPress={() => setType(t.value)}
              style={{ flex: 1, alignItems: 'center' }}
            />
          ))}
        </View>

        <Card noPadding style={{ padding: 14 }}>
          <Input label="Shop name *" value={name} onChangeText={setName} placeholder="Shop name" />
          <Input label="Owner name" value={ownerName} onChangeText={setOwnerName} placeholder="Owner name" />
          <Input label="Contact number" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
          <Input label="Location / area" value={location} onChangeText={setLocation} placeholder="Area, city" />
          <Input label="Full address" value={address} onChangeText={setAddress} placeholder="Street, landmark, city" multiline numberOfLines={2} style={{ height: 66, textAlignVertical: 'top', paddingTop: 10 }} />
          <Input label="About" value={description} onChangeText={setDescription} placeholder="Short description" multiline numberOfLines={2} style={{ height: 66, textAlignVertical: 'top', paddingTop: 10 }} />
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.sm }]}>Working hours</Text>
        {DAY_ORDER.map(({ key, label }) => {
          const cfg = workingHours[key];
          return (
            <Card key={key} noPadding style={{ padding: 14 }}>
              <SwitchRow label={label} value={!!cfg.open} onChange={(open) => setDay(key, { open })} />
              {cfg.open ? (
                <View style={styles.timeRow}>
                  <TimePickerField label="Opens" value={cfg.start} onChange={(start) => setDay(key, { start })} containerStyle={{ flex: 1 }} />
                  <TimePickerField label="Closes" value={cfg.end} onChange={(end) => setDay(key, { end })} containerStyle={{ flex: 1 }} />
                </View>
              ) : (
                <Text style={[styles.closed, { color: colors.textFaint }]}>Closed on {label}s</Text>
              )}
            </Card>
          );
        })}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Breaks</Text>
        {breaks.map((b) => (
          <Card key={b.id} noPadding style={{ padding: 14 }}>
            <View style={styles.breakRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.breakName, { color: colors.text }]}>{b.label}</Text>
                <Text style={[styles.breakMeta, { color: colors.textMuted }]}>{b.start} – {b.end}</Text>
              </View>
              <Pressable hitSlop={10} onPress={() => removeBreak(b.id)} style={[styles.deleteBtn, { backgroundColor: colors.surface2 }]}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))}
        <Card noPadding style={{ padding: 14 }}>
          <Input label="Break name" value={newBreakLabel} onChangeText={setNewBreakLabel} placeholder="e.g. Lunch break" small />
          <View style={styles.timeRow}>
            <TimePickerField label="Starts" value={newBreakStart} onChange={setNewBreakStart} containerStyle={{ flex: 1 }} />
            <TimePickerField label="Ends" value={newBreakEnd} onChange={setNewBreakEnd} containerStyle={{ flex: 1 }} />
          </View>
          <Button title="Add break" variant="outline" onPress={addBreak} icon={<Ionicons name="add" size={16} color={colors.brand} />} />
        </Card>

        <Button title="Save changes" onPress={save} loading={saving} style={{ marginTop: spacing.xl, marginBottom: spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  closed: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingTop: 4,
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakName: {
    fontSize: 15,
    fontWeight: '600',
  },
  breakMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});