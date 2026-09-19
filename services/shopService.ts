import { Shop, ShopStatus, ShopType, WorkingHours } from '@/types';
import { STORAGE_KEYS, readJSON, writeJSON, removeItem, uid } from '@/utils/storage';

const LOCAL_KEY = STORAGE_KEYS.shop;
const SHOPS_KEY = STORAGE_KEYS.shops;

export const EMPTY_WORKING_HOURS: WorkingHours = {
  sun: { open: false, start: '09:00', end: '21:00' },
  mon: { open: true, start: '09:00', end: '21:00' },
  tue: { open: true, start: '09:00', end: '21:00' },
  wed: { open: true, start: '09:00', end: '21:00' },
  thu: { open: true, start: '09:00', end: '21:00' },
  fri: { open: true, start: '09:00', end: '21:00' },
  sat: { open: true, start: '09:00', end: '21:00' },
};

/* ------------------------------ Shops list storage ------------------------------ */

async function localGetShops(): Promise<Shop[]> {
  return readJSON<Shop[]>(SHOPS_KEY, []);
}

async function localSetShops(list: Shop[]): Promise<void> {
  await writeJSON(SHOPS_KEY, list);
}

async function localUpsertShop(shop: Shop): Promise<void> {
  const shops = await localGetShops();
  const idx = shops.findIndex((s) => s.id === shop.id);
  if (idx >= 0) shops[idx] = shop;
  else shops.push(shop);
  await localSetShops(shops);
}

async function localRemoveShop(shopId: string): Promise<void> {
  const shops = await localGetShops();
  await localSetShops(shops.filter((s) => s.id !== shopId));
}

/**
 * Migrate a legacy single-shop storage key into the shops list if the list
 * is empty and the legacy shop belongs to the given owner (or has no owner_id).
 */
async function migrateLegacyShop(ownerId: string): Promise<Shop | null> {
  const shops = await localGetShops();
  if (shops.length > 0) return null;
  const legacy = await readJSON<Shop | null>(LOCAL_KEY, null);
  if (!legacy || !legacy.id) return null;
  const migrated: Shop = {
    ...legacy,
    owner_id: legacy.owner_id || ownerId,
  };
  await localSetShops([migrated]);
  return migrated;
}

/* ------------------------------- Shop -------------------------------- */

export async function getMyShop(ownerId?: string | null): Promise<Shop | null> {
  if (!ownerId) return null;
  await migrateLegacyShop(ownerId);
  const shops = await localGetShops();
  const owned = shops
    .filter((s) => s.owner_id === ownerId)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  return owned[0] ?? null;
}

export async function createShop(ownerId: string, input: Partial<Shop>): Promise<Shop> {
  const now = new Date().toISOString();
  const shop: Shop = {
    id: uid('SH'),
    owner_id: ownerId,
    ownerName: input.ownerName || '',
    ownerPhone: input.ownerPhone || input.phone || '',
    name: input.name || '',
    phone: input.phone || input.ownerPhone || '',
    shopType: (input.shopType as ShopType) || 'barber',
    shop_type: (input.shop_type as string) || (input.shopType as string) || 'barber',
    address: input.address || '',
    description: input.description || '',
    location: input.location || 'Coimbatore',
    area: input.area || '',
    status: 'pending',
    is_live: false,
    capacity: input.capacity || 1,
    booking_window: input.booking_window || 30,
    cancellation_hours: input.cancellation_hours ?? 2,
    number_of_barbers: input.number_of_barbers || 1,
    slot_interval: input.slot_interval || 30,
    workingHours: input.workingHours || EMPTY_WORKING_HOURS,
    breaks: input.breaks || [],
    imageUrl: input.imageUrl || null,
    image_url: input.imageUrl || null,
    created_at: now,
    updated_at: now,
  };

  await localUpsertShop(shop);
  return shop;
}

export async function updateShop(shopId: string, patch: Partial<Shop>): Promise<Shop | null> {
  const now = new Date().toISOString();
  const shops = await localGetShops();
  const idx = shops.findIndex((s) => s.id === shopId);
  if (idx === -1) return null;
  const merged: Shop = { ...shops[idx], ...patch, id: shopId, updated_at: now };
  shops[idx] = merged;
  await localSetShops(shops);
  return merged;
}

export async function setShopStatus(shopId: string, status: ShopStatus, isLive: boolean): Promise<void> {
  await updateShop(shopId, { status, is_live: isLive } as Partial<Shop>);
}

export async function saveWorkingHours(shopId: string, workingHours: WorkingHours): Promise<Shop | null> {
  return updateShop(shopId, { workingHours } as Partial<Shop>);
}

export async function saveBreaks(shopId: string, breaks: Array<{ id: string; label: string; start: string; end: string }>): Promise<Shop | null> {
  return updateShop(shopId, { breaks } as Partial<Shop>);
}

export async function uploadShopImage(uri: string, _shopId: string): Promise<string> {
  return uri;
}

export async function resetLocalShop(ownerId?: string | null): Promise<void> {
  if (ownerId) {
    const shops = await localGetShops();
    await localSetShops(shops.filter((s) => s.owner_id !== ownerId));
  } else {
    await removeItem(SHOPS_KEY);
  }
  await removeItem(LOCAL_KEY);
}