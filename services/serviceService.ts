import { Service } from '@/types';
import { STORAGE_KEYS, readJSON, writeJSON, uid } from '@/utils/storage';

const LOCAL_KEY = STORAGE_KEYS.services;

async function getLocalServices(): Promise<Service[]> {
  return readJSON<Service[]>(LOCAL_KEY, []);
}

async function setLocalServices(list: Service[]): Promise<Service[]> {
  await writeJSON(LOCAL_KEY, list);
  return list;
}

export async function getServices(shopId?: string): Promise<Service[]> {
  const all = await getLocalServices();
  return shopId ? all.filter((s) => s.shop_id === shopId || s.shopId === shopId) : all;
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

  const list = await getLocalServices();
  list.push(service);
  await setLocalServices(list);
  return service;
}

export async function updateService(id: string, patch: Partial<Service>, shopId?: string): Promise<Service | null> {
  const current = await getService(id, shopId);
  if (!current) return null;
  const merged: Service = { ...current, ...patch, updated_at: new Date().toISOString() };
  const list = await getLocalServices();
  await setLocalServices(list.map((s) => (s.id === id ? merged : s)));
  return merged;
}

export async function setServiceActive(id: string, active: boolean, shopId?: string): Promise<Service | null> {
  return updateService(id, { is_active: active, status: active ? 'active' : 'inactive' }, shopId);
}

export async function deleteService(id: string, shopId?: string): Promise<void> {
  const list = await getLocalServices();
  const target = list.find((s) => s.id === id);
  if (target && shopId && (target.shop_id !== shopId && target.shopId !== shopId)) return;
  await setLocalServices(list.filter((s) => s.id !== id));
}