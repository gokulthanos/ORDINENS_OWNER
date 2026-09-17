import AsyncStorage from '@react-native-async-storage/async-storage';
import { OwnerRecord, OwnerSession, Profile, Role } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { isMockMode, isSupabaseMode } from './dataMode';
import { STORAGE_KEYS, ownerScopedKey, readJSON, writeJSON, removeItem, uid } from '@/utils/storage';

const SESSION_KEY = STORAGE_KEYS.session;
const OWNERS_KEY = STORAGE_KEYS.owners;

export interface SignInResult {
  session: OwnerSession | null;
  error: string | null;
}

export interface SignUpResult {
  session: OwnerSession | null;
  error: string | null;
  message?: string;
}

function toOwnerSession(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  profile: Profile | null,
  shopId: string | null = null
): OwnerSession {
  const name =
    profile?.full_name ||
    (user.user_metadata?.full_name as string) ||
    (user.email ? user.email.split('@')[0] : 'Owner');
  return {
    id: user.id,
    email: user.email ?? profile?.email ?? '',
    name: name.charAt(0).toUpperCase() + name.slice(1),
    phone: profile?.phone ?? (user.user_metadata?.phone as string | null) ?? null,
    role: 'owner',
    authenticated: true,
    shopId: shopId ?? null,
  };
}

/* ---------------------------- Owner registry (mock) --------------------------- */

async function getOwners(): Promise<OwnerRecord[]> {
  return readJSON<OwnerRecord[]>(OWNERS_KEY, []);
}

async function saveOwners(list: OwnerRecord[]): Promise<void> {
  await writeJSON(OWNERS_KEY, list);
}

async function getOwnerByEmail(email: string): Promise<OwnerRecord | null> {
  const owners = await getOwners();
  return owners.find((o) => o.email.toLowerCase() === email.toLowerCase()) ?? null;
}

async function getOwnerById(id: string): Promise<OwnerRecord | null> {
  const owners = await getOwners();
  return owners.find((o) => o.id === id) ?? null;
}

async function saveOwnerRecord(record: OwnerRecord): Promise<void> {
  const owners = await getOwners();
  const idx = owners.findIndex((o) => o.id === record.id);
  if (idx >= 0) owners[idx] = record;
  else owners.push(record);
  await saveOwners(owners);
}

export async function updateOwnerShopId(ownerId: string, shopId: string | null): Promise<void> {
  const owner = await getOwnerById(ownerId);
  if (!owner) return;
  owner.shopId = shopId;
  await saveOwnerRecord(owner);
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw) as OwnerSession;
      if (session.id === ownerId && session.shopId !== shopId) {
        session.shopId = shopId;
        await writeJSON(SESSION_KEY, session);
      }
    } catch {
      // best effort
    }
  }
}

/* ---------------------------- Supabase helpers ---------------------------- */

export async function fetchProfileForUser(userId: string): Promise<Profile | null> {
  if (isMockMode() || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return null;
    return data ? mapProfileRow(data) : null;
  } catch {
    return null;
  }
}

async function getShopIdForSupabaseUser(userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? String(data.id) : null;
  } catch {
    return null;
  }
}

/* ---------------------------- Auth operations ---------------------------- */

export async function signUpOwner(email: string, password: string, name: string, phone?: string): Promise<SignUpResult> {
  if (isMockMode() || !isSupabaseConfigured) {
    const existing = await getOwnerByEmail(email);
    if (existing) return { session: null, error: 'An account with this email already exists.' };

    const id = uid('OWN');
    const shopId: string | null = null;
    const record: OwnerRecord = {
      id,
      email: email.toLowerCase(),
      password,
      name,
      phone: phone ?? null,
      role: 'owner',
      shopId,
      createdAt: new Date().toISOString(),
    };
    await saveOwnerRecord(record);

    const session: OwnerSession = {
      id,
      email: email.toLowerCase(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      phone: phone ?? null,
      role: 'owner',
      authenticated: true,
      shopId,
    };
    await writeJSON(SESSION_KEY, session);
    return { session, error: null };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone, role: 'owner' } },
    });
    if (authError) throw authError;
    const user = authData.user;
    if (!user) return { session: null, error: 'Sign up failed. Please try again.' };

    const userId = user.id;
    await supabase.from('profiles').upsert(
      {
        user_id: userId,
        full_name: name,
        email,
        phone: phone ?? null,
        role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    const shopId = await getShopIdForSupabaseUser(userId);
    const session = toOwnerSession(user, {
      id: userId,
      user_id: userId,
      full_name: name,
      email,
      phone: phone ?? null,
      profile_photo: null,
      role: 'owner',
      created_at: new Date().toISOString(),
    }, shopId);
    await writeJSON(SESSION_KEY, session);
    return { session, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { session: null, error: msg || 'Unable to sign up. Check your connection.' };
  }
}

export async function signInOwner(email: string, password: string): Promise<SignInResult> {
  if (isMockMode() || !isSupabaseConfigured) {
    const owner = await getOwnerByEmail(email);
    if (!owner) return { session: null, error: 'No account found with this email.' };
    if (owner.password !== password) return { session: null, error: 'Invalid login credentials.' };

    const session: OwnerSession = {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      phone: owner.phone ?? null,
      role: 'owner',
      authenticated: true,
      shopId: owner.shopId,
    };
    await writeJSON(SESSION_KEY, session);
    return { session, error: null };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return { session: null, error: 'Invalid login credentials.' };
    }
    const profile = await fetchProfileForUser(data.user.id);
    if (profile && profile.role !== 'owner') {
      await supabase.auth.signOut();
      return { session: null, error: 'Access denied. This account is not an owner.' };
    }
    const shopId = await getShopIdForSupabaseUser(data.user.id);
    const session = toOwnerSession(data.user, profile, shopId);
    await writeJSON(SESSION_KEY, session);
    return { session, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { session: null, error: msg || 'Unable to reach the server. Check your connection.' };
  }
}

export async function signOutOwner(): Promise<void> {
  await removeItem(SESSION_KEY);
  if (isSupabaseMode() && isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch {
      // best effort
    }
  }
}

export async function restoreOwnerSession(): Promise<OwnerSession | null> {
  if (isMockMode() || !isSupabaseConfigured) {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as OwnerSession;
      const owner = await getOwnerById(session.id);
      if (!owner) {
        await removeItem(SESSION_KEY);
        return null;
      }
      const refreshed: OwnerSession = {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        phone: owner.phone ?? null,
        role: 'owner',
        authenticated: true,
        shopId: owner.shopId,
      };
      await writeJSON(SESSION_KEY, refreshed);
      return refreshed;
    } catch {
      return null;
    }
  }
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const profile = await fetchProfileForUser(user.id);
    if (profile && profile.role !== 'owner') return null;
    const shopId = await getShopIdForSupabaseUser(user.id);
    const session = toOwnerSession(user, profile, shopId);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch {
    return null;
  }
}

export function mapProfileRow(row: Record<string, unknown> | null | undefined): Profile | null {
  if (!row) return null;
  const str = (v: unknown, f = ''): string => (v == null ? f : String(v));
  return {
    id: str(row.id ?? row.user_id),
    user_id: str(row.user_id ?? row.id),
    full_name: str(row.full_name, 'User'),
    email: str(row.email),
    phone: row.phone == null ? null : str(row.phone),
    profile_photo: row.profile_photo == null ? null : str(row.profile_photo),
    role: (str(row.role, 'customer') as Role),
    created_at: str(row.created_at) || new Date().toISOString(),
    updated_at: row.updated_at == null ? undefined : str(row.updated_at),
  };
}