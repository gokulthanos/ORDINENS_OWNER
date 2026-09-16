import { StaffMember } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { isMockMode } from './dataMode';
import { STORAGE_KEYS, readJSON, writeJSON, uid } from '@/utils/storage';

const LOCAL_KEY = STORAGE_KEYS.staff;

function fromRow(row: Record<string, unknown>): StaffMember {
  const statusKey = String(row.status ?? row.is_active ?? 'active');
  return {
    id: String(row.id),
    shop_id: row.shop_id ? String(row.shop_id) : undefined,
    shopId: row.shop_id ? String(row.shop_id) : null,
    name: String(row.name ?? row.full_name ?? ''),
    role: String(row.role || row.title || 'Barber'),
    specialty: String(row.specialty ?? ''),
    years_of_experience: Number(row.years_of_experience ?? row.years ?? 0),
    status: statusKey === 'inactive' || statusKey === 'false' || statusKey === '0' ? 'inactive' : 'active',
    color: row.color ? String(row.color) : undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function toRow(staff: StaffMember, shopId: string): Record<string, unknown> {
  return {
    shop_id: shopId,
    name: staff.name,
    role: staff.role,
    specialty: staff.specialty,
    years_of_experience: staff.years_of_experience || 0,
    status: staff.status,
    is_active: staff.status === 'active',
    color: staff.color ?? null,
  };
}

async function getLocalStaff(): Promise<StaffMember[]> {
  return readJSON<StaffMember[]>(LOCAL_KEY, []);
}

async function setLocalStaff(list: StaffMember[]): Promise<StaffMember[]> {
  await writeJSON(LOCAL_KEY, list);
  return list;
}

export async function getStaff(shopId?: string): Promise<StaffMember[]> {
  if (isMockMode() || !isSupabaseConfigured) {
    const all = await getLocalStaff();
    return shopId ? all.filter((s) => s.shop_id === shopId) : all;
  }
  try {
    let query = supabase.from('barbers').select('*').order('name');
    if (shopId) query = query.eq('shop_id', shopId);
    const { data, error } = await query;
    if (error) {
      if (!String(error.message).toLowerCase().includes('does not exist')) throw error;
      return [];
    }
    const list = (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
    await setLocalStaff(list);
    return list;
  } catch (err) {
    console.warn('[staffService] getStaff fallback:', (err as Error).message);
    return getLocalStaff();
  }
}

export async function getStaffMember(id: string, shopId?: string): Promise<StaffMember | null> {
  const all = await getStaff(shopId);
  return all.find((s) => s.id === id) || null;
}

export async function addStaff(shopId: string, input: Pick<StaffMember, 'name' | 'role' | 'specialty' | 'years_of_experience' | 'color'>): Promise<StaffMember> {
  const staff: StaffMember = {
    id: uid('ST'),
    shop_id: shopId,
    shopId,
    name: input.name,
    role: input.role || 'Barber',
    specialty: input.specialty || '',
    years_of_experience: Number(input.years_of_experience || 0),
    status: 'active',
    color: input.color,
    created_at: new Date().toISOString(),
  };

  if (isMockMode() || !isSupabaseConfigured) {
    const list = await getLocalStaff();
    list.push(staff);
    await setLocalStaff(list);
    return staff;
  }
  try {
    const { data, error } = await supabase.from('barbers').insert(toRow(staff, shopId)).select().maybeSingle();
    if (error) throw error;
    const saved = data ? fromRow(data as Record<string, unknown>) : staff;
    const list = await getLocalStaff();
    list.push(saved);
    await setLocalStaff(list);
    return saved;
  } catch (err) {
    console.warn('[staffService] addStaff fallback:', (err as Error).message);
    const list = await getLocalStaff();
    list.push(staff);
    await setLocalStaff(list);
    return staff;
  }
}

export async function updateStaff(id: string, shopId: string, patch: Partial<StaffMember>): Promise<StaffMember | null> {
  const current = await getStaffMember(id, shopId);
  if (!current) return null;
  const merged: StaffMember = { ...current, ...patch };
  if (isMockMode() || !isSupabaseConfigured) {
    const list = await getLocalStaff();
    await setLocalStaff(list.map((s) => (s.id === id ? merged : s)));
    return merged;
  }
  try {
    const { error } = await supabase.from('barbers').update(toRow(merged, shopId)).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('[staffService] updateStaff fallback:', (err as Error).message);
  }
  const list = await getLocalStaff();
  await setLocalStaff(list.map((s) => (s.id === id ? merged : s)));
  return merged;
}

export async function setStaffActive(id: string, shopId: string, active: boolean): Promise<StaffMember | null> {
  return updateStaff(id, shopId, { status: active ? 'active' : 'inactive' });
}

export async function deleteStaff(id: string): Promise<void> {
  if (isMockMode() || !isSupabaseConfigured) {
    const list = await getLocalStaff();
    await setLocalStaff(list.filter((s) => s.id !== id));
    return;
  }
  try {
    const { error } = await supabase.from('barbers').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('[staffService] deleteStaff:', (err as Error).message);
  }
  const list = await getLocalStaff();
  await setLocalStaff(list.filter((s) => s.id !== id));
}

const STAFF_COLORS = ['#7c5cff', '#ff7a59', '#00c2a8', '#38b6ff', '#f5b201', '#ec4899'];

export function staffColor(index: number): string {
  return STAFF_COLORS[index % STAFF_COLORS.length];
}