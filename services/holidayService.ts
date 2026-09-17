import { ShopHoliday } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { isMockMode } from './dataMode';
import { STORAGE_KEYS, readJSON, writeJSON, uid } from '@/utils/storage';

const LOCAL_KEY = STORAGE_KEYS.holidays;

function fromRow(row: Record<string, unknown>): ShopHoliday {
  return {
    id: row.id ? String(row.id) : undefined,
    shop_id: row.shop_id ? String(row.shop_id) : undefined,
    holiday_date: String(row.holiday_date ?? ''),
    name: String(row.name ?? ''),
    reason: String(row.reason ?? ''),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

async function getLocalHolidays(shopId?: string): Promise<ShopHoliday[]> {
  const all = await readJSON<ShopHoliday[]>(LOCAL_KEY, []);
  return shopId ? all.filter((h) => (h.shop_id ?? '') === shopId) : all;
}

async function setLocalHolidays(list: ShopHoliday[]): Promise<ShopHoliday[]> {
  await writeJSON(LOCAL_KEY, list);
  return list;
}

export async function getHolidays(shopId?: string): Promise<ShopHoliday[]> {
  if (isMockMode() || !isSupabaseConfigured) {
    return getLocalHolidays(shopId);
  }
  try {
    let query = supabase.from('shop_holidays').select('*').order('holiday_date');
    if (shopId) query = query.eq('shop_id', shopId);
    const { data, error } = await query;
    if (error) {
      if (!String(error.message).toLowerCase().includes('does not exist')) throw error;
      return [];
    }
    const list = (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
    await setLocalHolidays(list);
    return list;
  } catch (err) {
    console.warn('[holidayService] getHolidays fallback:', (err as Error).message);
    return getLocalHolidays(shopId);
  }
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
  if (isMockMode() || !isSupabaseConfigured) {
    const list = await getLocalHolidays();
    list.push(holiday);
    await setLocalHolidays(list);
    return holiday;
  }
  try {
    const { data, error } = await supabase
      .from('shop_holidays')
      .insert({ shop_id: shopId, holiday_date: input.holiday_date, name: input.name, reason: input.reason })
      .select()
      .maybeSingle();
    if (error) throw error;
    const saved = data ? fromRow(data as Record<string, unknown>) : holiday;
    const list = await getLocalHolidays();
    list.push(saved);
    await setLocalHolidays(list);
    return saved;
  } catch (err) {
    console.warn('[holidayService] addHoliday fallback:', (err as Error).message);
    const list = await getLocalHolidays();
    list.push(holiday);
    await setLocalHolidays(list);
    return holiday;
  }
}

export async function updateHoliday(id: string, patch: { holiday_date?: string; name?: string; reason?: string }, shopId?: string): Promise<ShopHoliday | null> {
  const all = await getLocalHolidays();
  const current = all.find((h) => h.id === id) ?? null;
  if (!current) return null;
  if (shopId && (current.shop_id ?? '') !== shopId) return null;
  const merged: ShopHoliday = { ...current, ...patch };
  if (isMockMode() || !isSupabaseConfigured) {
    await setLocalHolidays(all.map((h) => (h.id === id ? merged : h)));
    return merged;
  }
  try {
    const { error } = await supabase.from('shop_holidays').update({ ...patch }).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('[holidayService] updateHoliday fallback:', (err as Error).message);
  }
  await setLocalHolidays(all.map((h) => (h.id === id ? merged : h)));
  return merged;
}

export async function deleteHoliday(id: string, shopId?: string): Promise<void> {
  if (isMockMode() || !isSupabaseConfigured) {
    const all = await getLocalHolidays();
    const target = all.find((h) => h.id === id);
    if (target && shopId && (target.shop_id ?? '') !== shopId) return;
    await setLocalHolidays(all.filter((h) => h.id !== id));
    return;
  }
  try {
    let query = supabase.from('shop_holidays').delete().eq('id', id);
    if (shopId) query = query.eq('shop_id', shopId);
    const { error } = await query;
    if (error) throw error;
  } catch (err) {
    console.warn('[holidayService] deleteHoliday:', (err as Error).message);
  }
  const all = await getLocalHolidays();
  await setLocalHolidays(all.filter((h) => h.id !== id));
}