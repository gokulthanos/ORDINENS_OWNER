import { DayConfig, DayKey, Shop, ShopStatus, ShopType, WorkingHours } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { isMockMode } from './dataMode';
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

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/* ------------------------------ Mappers ------------------------------ */

function str(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v);
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

export function fromShopRow(row: Record<string, unknown> | null | undefined): Shop | null {
  if (!row) return null;
  const id = str(row.id);
  if (!id) return null;

  const rawType = str(row.shop_type || row.shopType, 'barber').toLowerCase();
  let shopType: ShopType = 'barber';
  if (rawType.includes('salon') && rawType.includes('barber')) shopType = 'barber-salon';
  else if (rawType.includes('salon')) shopType = 'salon';
  else shopType = 'barber';

  const rawHours = (row.workingHours as Record<string, DayConfig>) || (row.working_hours as Record<string, DayConfig>) || {};
  const workingHours: WorkingHours = { ...EMPTY_WORKING_HOURS };
  for (const key of DAY_KEYS) {
    const cfg = rawHours[key];
    if (cfg) {
      workingHours[key] = {
        open: Boolean(cfg.open),
        start: str(cfg.start, '09:00'),
        end: str(cfg.end, '21:00'),
      };
    }
  }
  const rawBreaks = (row.breaks as Array<{ id?: string; label?: string; start?: string; end?: string }>) || [];

  return {
    id,
    owner_id: row.owner_id ? str(row.owner_id) : null,
    ownerName: str(row.owner_name || row.ownerName),
    ownerPhone: str(row.phone || row.owner_phone || row.ownerPhone),
    name: str(row.name, 'Unnamed Shop'),
    phone: str(row.phone || row.owner_phone || row.ownerPhone),
    shopType,
    shop_type: rawType,
    address: str(row.address),
    description: str(row.description),
    location: str(row.location, 'Coimbatore'),
    area: str(row.area),
    status: (str(row.status, 'pending') as ShopStatus),
    is_live: row.is_live === true || row.is_live === 1 || row.is_live === 'true',
    capacity: num(row.capacity, 1),
    booking_window: num(row.booking_window ?? row.bookingWindow, 30),
    cancellation_hours: num(row.cancellation_hours ?? row.cancellationHours, 2),
    number_of_barbers: num(row.number_of_barbers, 1),
    slot_interval: num(row.slot_interval, 30),
    workingHours,
    breaks: (rawBreaks || []).map((b, idx) => ({
      id: str(b.id, `brk-${idx + 1}`),
      label: str(b.label, 'Break'),
      start: str(b.start),
      end: str(b.end),
    })),
    imageUrl: row.image_url == null && row.imageUrl == null ? null : str(row.image_url || row.imageUrl) || null,
    image_url: row.image_url == null && row.imageUrl == null ? null : str(row.image_url || row.imageUrl) || null,
    created_at: str(row.created_at) || new Date().toISOString(),
    updated_at: str(row.updated_at),
  };
}

export function toShopRow(shop: Shop): Record<string, unknown> {
  const row: Record<string, unknown> = {
    owner_id: shop.owner_id,
    name: shop.name,
    shop_type: shop.shop_type || shop.shopType,
    phone: shop.phone || shop.ownerPhone,
    address: shop.address,
    description: shop.description,
    location: shop.location,
    area: shop.area,
    status: shop.status,
    is_live: shop.is_live,
    capacity: shop.capacity,
    booking_window: shop.booking_window,
    cancellation_hours: shop.cancellation_hours,
    number_of_barbers: shop.number_of_barbers,
    slot_interval: shop.slot_interval,
    workingHours: shop.workingHours,
    breaks: shop.breaks,
    updated_at: new Date().toISOString(),
  };
  if (shop.imageUrl) row.image_url = shop.imageUrl;
  return row;
}

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
  if (isMockMode() || !isSupabaseConfigured) {
    if (!ownerId) return null;
    await migrateLegacyShop(ownerId);
    const shops = await localGetShops();
    const owned = shops
      .filter((s) => s.owner_id === ownerId)
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
    return owned[0] ?? null;
  }
  try {
    let query = supabase.from('shops').select('*').order('created_at', { ascending: false });
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      if (!String(error.message).toLowerCase().includes('does not exist')) throw error;
      return null;
    }
    if (data) {
      const shop = fromShopRow(data);
      if (shop) await localUpsertShop(shop);
      return shop;
    }
  } catch (err) {
    console.warn('[shopService] getMyShop fallback:', (err as Error).message);
  }
  return null;
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

  if (isMockMode() || !isSupabaseConfigured) {
    await localUpsertShop(shop);
    return shop;
  }
  try {
    const row = toShopRow(shop);
    row.created_at = now;
    const { data, error } = await supabase.from('shops').insert(row).select().maybeSingle();
    if (error) throw error;
    const saved = fromShopRow(data);
    if (saved) {
      await localUpsertShop(saved);
      return saved;
    }
  } catch (err) {
    console.warn('[shopService] createShop fallback:', (err as Error).message);
  }
  await localUpsertShop(shop);
  return shop;
}

export async function updateShop(shopId: string, patch: Partial<Shop>): Promise<Shop | null> {
  const now = new Date().toISOString();
  if (isMockMode() || !isSupabaseConfigured) {
    const shops = await localGetShops();
    const idx = shops.findIndex((s) => s.id === shopId);
    if (idx === -1) return null;
    const merged: Shop = { ...shops[idx], ...patch, id: shopId, updated_at: now };
    shops[idx] = merged;
    await localSetShops(shops);
    return merged;
  }
  try {
    const { data: row, error: fetchErr } = await supabase.from('shops').select('*').eq('id', shopId).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!row) return null;
    const current = fromShopRow(row);
    const merged: Shop = { ...(current as Shop), ...patch, id: shopId, updated_at: now };
    const { error: upErr } = await supabase.from('shops').update(toShopRow(merged)).eq('id', shopId);
    if (upErr) throw upErr;
    await localUpsertShop(merged);
    return merged;
  } catch (err) {
    console.warn('[shopService] updateShop fallback:', (err as Error).message);
    const shops = await localGetShops();
    const idx = shops.findIndex((s) => s.id === shopId);
    if (idx === -1) return null;
    const merged: Shop = { ...shops[idx], ...patch, id: shopId, updated_at: now };
    shops[idx] = merged;
    await localSetShops(shops);
    return merged;
  }
}

export async function setShopStatus(shopId: string, status: ShopStatus, isLive: boolean): Promise<void> {
  await updateShop(shopId, { status, is_live: isLive } as Partial<Shop>);
  if (isMockMode() || !isSupabaseConfigured) return;
  try {
    const { error } = await supabase
      .from('shops')
      .update({ status, is_live: isLive, updated_at: new Date().toISOString() })
      .eq('id', shopId);
    if (error) throw error;
  } catch (err) {
    console.warn('[shopService] setShopStatus:', (err as Error).message);
  }
}

export async function saveWorkingHours(shopId: string, workingHours: WorkingHours): Promise<Shop | null> {
  const shop = await updateShop(shopId, { workingHours } as Partial<Shop>);
  if (isMockMode() || !isSupabaseConfigured) return shop;
  try {
    const { data: existing } = await supabase.from('shop_working_hours').select('*').eq('shop_id', shopId);
    if (existing !== null) {
      for (const key of DAY_KEYS) {
        const cfg = workingHours[key];
        const row = existing.find((r) => r.day_of_week === key);
        const payload = {
          shop_id: shopId,
          day_of_week: key,
          is_open: cfg.open,
          open_time: cfg.start,
          close_time: cfg.end,
        };
        if (row) {
          await supabase.from('shop_working_hours').update(payload).eq('id', row.id);
        } else {
          await supabase.from('shop_working_hours').insert(payload);
        }
      }
    }
  } catch (err) {
    console.warn('[shopService] saveWorkingHours sync:', (err as Error).message);
  }
  return shop;
}

export async function saveBreaks(shopId: string, breaks: Array<{ id: string; label: string; start: string; end: string }>): Promise<Shop | null> {
  const shop = await updateShop(shopId, { breaks } as Partial<Shop>);
  if (isMockMode() || !isSupabaseConfigured) return shop;
  try {
    const { data: existing } = await supabase.from('shop_breaks').select('*').eq('shop_id', shopId);
    if (existing !== null && Array.isArray(existing)) {
      const keep = new Set(breaks.map((b) => b.id));
      for (const row of existing) {
        if (!keep.has(String(row.id))) {
          await supabase.from('shop_breaks').delete().eq('id', row.id);
        }
      }
      for (const b of breaks) {
        const row = existing.find((r) => String(r.id) === b.id);
        const payload = { shop_id: shopId, label: b.label, start_time: b.start, end_time: b.end };
        if (row) {
          await supabase.from('shop_breaks').update(payload).eq('id', row.id);
        } else {
          await supabase.from('shop_breaks').insert(payload);
        }
      }
    }
  } catch (err) {
    console.warn('[shopService] saveBreaks sync:', (err as Error).message);
  }
  return shop;
}

export async function uploadShopImage(uri: string, shopId: string): Promise<string> {
  if (isMockMode() || !isSupabaseConfigured) {
    return uri;
  }
  try {
    const ext = uri.includes('.png') ? 'png' : uri.includes('.webp') ? 'webp' : 'jpg';
    const fileName = `shops/${shopId}-${Date.now()}.${ext}`;
    const res = await fetch(uri);
    const blob = await res.blob();
    const { error } = await supabase.storage.from('shop-images').upload(fileName, blob, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('shop-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.warn('[shopService] uploadShopImage fallback (kept local):', (err as Error).message);
    return uri;
  }
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
