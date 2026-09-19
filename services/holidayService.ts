import { ShopHoliday } from '@/types';
import { STORAGE_KEYS, readJSON, writeJSON, uid } from '@/utils/storage';

const LOCAL_KEY = STORAGE_KEYS.holidays;

async function getLocalHolidays(shopId?: string): Promise<ShopHoliday[]> {
  const all = await readJSON<ShopHoliday[]>(LOCAL_KEY, []);
  return shopId ? all.filter((h) => (h.shop_id ?? '') === shopId) : all;
}

async function setLocalHolidays(list: ShopHoliday[]): Promise<ShopHoliday[]> {
  await writeJSON(LOCAL_KEY, list);
  return list;
}

export async function getHolidays(shopId?: string): Promise<ShopHoliday[]> {
  return getLocalHolidays(shopId);
}

export async function addHoliday(shopId: string, input: { holiday_date: string; name: string; reason: string }): Promise<ShopHoliday> {
  const holiday: ShopHoliday = {
    id: uid('HL'),
    shop_id: shopId,
    holiday_date: input.holiday_date,
    name: input.name,
    reason: input.reason,
    created_at: new Date().toISOString(),
  };
  const list = await getLocalHolidays();
  list.push(holiday);
  await setLocalHolidays(list);
  return holiday;
}

export async function updateHoliday(id: string, patch: { holiday_date?: string; name?: string; reason?: string }, shopId?: string): Promise<ShopHoliday | null> {
  const all = await getLocalHolidays();
  const current = all.find((h) => h.id === id) ?? null;
  if (!current) return null;
  if (shopId && (current.shop_id ?? '') !== shopId) return null;
  const merged: ShopHoliday = { ...current, ...patch };
  await setLocalHolidays(all.map((h) => (h.id === id ? merged : h)));
  return merged;
}

export async function deleteHoliday(id: string, shopId?: string): Promise<void> {
  const all = await getLocalHolidays();
  const target = all.find((h) => h.id === id);
  if (target && shopId && (target.shop_id ?? '') !== shopId) return;
  await setLocalHolidays(all.filter((h) => h.id !== id));
}