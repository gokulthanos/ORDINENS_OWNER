import { StaffMember } from '@/types';
import { STORAGE_KEYS, readJSON, writeJSON, uid } from '@/utils/storage';

const LOCAL_KEY = STORAGE_KEYS.staff;

async function getLocalStaff(): Promise<StaffMember[]> {
  return readJSON<StaffMember[]>(LOCAL_KEY, []);
}

async function setLocalStaff(list: StaffMember[]): Promise<StaffMember[]> {
  await writeJSON(LOCAL_KEY, list);
  return list;
}

export async function getStaff(shopId?: string): Promise<StaffMember[]> {
  const all = await getLocalStaff();
  return shopId ? all.filter((s) => s.shop_id === shopId) : all;
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

  const list = await getLocalStaff();
  list.push(staff);
  await setLocalStaff(list);
  return staff;
}

export async function updateStaff(id: string, shopId: string, patch: Partial<StaffMember>): Promise<StaffMember | null> {
  const current = await getStaffMember(id, shopId);
  if (!current) return null;
  const merged: StaffMember = { ...current, ...patch };
  const list = await getLocalStaff();
  await setLocalStaff(list.map((s) => (s.id === id ? merged : s)));
  return merged;
}

export async function setStaffActive(id: string, shopId: string, active: boolean): Promise<StaffMember | null> {
  return updateStaff(id, shopId, { status: active ? 'active' : 'inactive' });
}

export async function deleteStaff(id: string, shopId?: string): Promise<void> {
  const all = await getLocalStaff();
  const target = all.find((s) => s.id === id);
  if (target && shopId && target.shop_id !== shopId && target.shopId !== shopId) return;
  await setLocalStaff(all.filter((s) => s.id !== id));
}

const STAFF_COLORS = ['#f97316', '#fb923c', '#ea580c', '#fdba74', '#c2410c', '#d97706'];

export function staffColor(index: number): string {
  return STAFF_COLORS[index % STAFF_COLORS.length];
}