import { Service } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { isMockMode } from './dataMode';
import { STORAGE_KEYS, readJSON, writeJSON, uid } from '@/utils/storage';

const LOCAL_KEY = STORAGE_KEYS.services;

function fromRow(row: Record<string, unknown>): Service {
  return {
    id: String(row.id),
    shop_id: row.shop_id ? String(row.shop_id) : undefined,
    shopId: row.shop_id ? String(row.shop_id) : undefined,
    name: String(row.name ?? ''),
    emoji: row.emoji == null ? null : String(row.emoji),
    icon: row.icon == null ? null : String(row.icon),
    duration_minutes: Number(row.duration_minutes ?? row.duration ?? 30),
    duration: Number(row.duration_minutes ?? row.duration ?? 30),
    price: Number(row.price ?? 0),
    description: row.description == null ? null : String(row.description),
    is_active: row.is_active === true || row.is_active === 1 || row.is_active === 'true' || String(row.status ?? 'active') !== 'inactive',
    status: String(row.status ?? 'active') === 'inactive' ? 'inactive' : 'active',
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function toRow(service: Service, shopId?: string): Record<string, unknown> {
  return {
    shop_id: shopId ?? service.shop_id ?? service.shopId,
    name: service.name,
    emoji: service.emoji ?? null,
    duration_minutes: service.duration_minutes || service.duration || 30,
    price: service.price,
    description: service.description ?? null,
    is_active: service.is_active,
    updated_at: new Date().toISOString(),
  };
}

async function getLocalServices(): Promise<Service[]> {
  return readJSON<Service[]>(LOCAL_KEY, []);
}

async function setLocalServices(list: Service[]): Promise<Service[]> {
  await writeJSON(LOCAL_KEY, list);
  return list;
}

export async function getServices(shopId?: string): Promise<Service[]> {
  if (isMockMode() || !isSupabaseConfigured) {
    const all = await getLocalServices();
    return shopId ? all.filter((s) => s.shop_id === shopId || s.shopId === shopId) : all;
  }
  try {
    let query = supabase.from('services').select('*').order('name');
    if (shopId) query = query.eq('shop_id', shopId);
    const { data, error } = await query;
    if (error) {
      if (!String(error.message).toLowerCase().includes('does not exist')) throw error;
      return [];
    }
    const list = (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
    await setLocalServices(list);
    return list;
  } catch (err) {
    console.warn('[serviceService] getServices fallback:', (err as Error).message);
    return getLocalServices();
  }
}

export async function getService(id: string, shopId?: string): Promise<Service | null> {
  const all = await getServices(shopId);
  return all.find((s) => s.id === id) || null;
}

export async function addService(shopId: string, input: Pick<Service, 'name' | 'price' | 'duration_minutes' | 'description' | 'duration' | 'emoji'>): Promise<Service> {
  const service: Service = {
    id: uid('SV'),
    shop_id: shopId,
    shopId,
    name: input.name,
    emoji: input.emoji ?? null,
    duration_minutes: Number(input.duration_minutes || input.duration || 30),
    duration: Number(input.duration_minutes || input.duration || 30),
    price: Number(input.price || 0),
    description: input.description ?? null,
    is_active: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isMockMode() || !isSupabaseConfigured) {
    const list = await getLocalServices();
    list.push(service);
    await setLocalServices(list);
    return service;
  }
  try {
    const { data, error } = await supabase.from('services').insert(toRow(service, shopId)).select().maybeSingle();
    if (error) throw error;
    const saved = data ? fromRow(data as Record<string, unknown>) : service;
    const list = await getLocalServices();
    list.push(saved);
    await setLocalServices(list);
    return saved;
  } catch (err) {
    console.warn('[serviceService] addService fallback:', (err as Error).message);
    const list = await getLocalServices();
    list.push(service);
    await setLocalServices(list);
    return service;
  }
}

export async function updateService(id: string, patch: Partial<Service>): Promise<Service | null> {
  const current = await getService(id);
  if (!current) return null;
  const merged: Service = { ...current, ...patch, updated_at: new Date().toISOString() };
  if (isMockMode() || !isSupabaseConfigured) {
    const list = await getLocalServices();
    await setLocalServices(list.map((s) => (s.id === id ? merged : s)));
    return merged;
  }
  try {
    const { error } = await supabase.from('services').update(toRow(merged)).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('[serviceService] updateService fallback:', (err as Error).message);
  }
  const list = await getLocalServices();
  await setLocalServices(list.map((s) => (s.id === id ? merged : s)));
  return merged;
}

export async function setServiceActive(id: string, active: boolean): Promise<Service | null> {
  return updateService(id, { is_active: active, status: active ? 'active' : 'inactive' });
}

export async function deleteService(id: string): Promise<void> {
  if (isMockMode() || !isSupabaseConfigured) {
    const list = await getLocalServices();
    await setLocalServices(list.filter((s) => s.id !== id));
    return;
  }
  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('[serviceService] deleteService:', (err as Error).message);
  }
  const list = await getLocalServices();
  await setLocalServices(list.filter((s) => s.id !== id));
}