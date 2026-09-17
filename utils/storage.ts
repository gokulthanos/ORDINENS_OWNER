import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  session: 'owner_session',
  owners: 'owner_owners',
  shop: 'owner_shop',
  shops: 'owner_shops',
  bookings: 'owner_bookings',
  services: 'owner_services',
  staff: 'owner_staff',
  holidays: 'owner_holidays',
  onboarding: 'owner_onboarding',
  config: 'owner_config',
} as const;

export function ownerScopedKey(base: string, ownerId: string): string {
  return `${base}_${ownerId}`;
}

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // prototype storage is best effort
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // best effort
  }
}

export async function clearAll(): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    // best effort
  }
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}