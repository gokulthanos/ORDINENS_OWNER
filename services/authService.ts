import AsyncStorage from '@react-native-async-storage/async-storage';
import { OwnerSession, Profile, Role } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { isMockMode, isSupabaseMode } from './dataMode';
import { STORAGE_KEYS, removeItem } from '@/utils/storage';

const SESSION_KEY = STORAGE_KEYS.session;

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
  profile: Profile | null
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
  };
}

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

export async function signUpOwner(email: string, password: string, name: string, phone?: string): Promise<SignUpResult> {
  if (isMockMode() || !isSupabaseConfigured) {
    const session: OwnerSession = {
      id: `mock-${Date.now()}`,
      email,
      name,
      phone: phone ?? null,
      role: 'owner',
      authenticated: true,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
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

    const session = toOwnerSession(user, {
      id: userId,
      user_id: userId,
      full_name: name,
      email,
      phone: phone ?? null,
      profile_photo: null,
      role: 'owner',
      created_at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { session, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { session: null, error: msg || 'Unable to sign up. Check your connection.' };
  }
}

export async function signInOwner(email: string, password: string): Promise<SignInResult> {
  if (isMockMode() || !isSupabaseConfigured) {
    const session: OwnerSession = {
      id: `mock-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'owner',
      authenticated: true,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
    const session = toOwnerSession(data.user, profile);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
      return raw ? (JSON.parse(raw) as OwnerSession) : null;
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
    const session = toOwnerSession(user, profile);
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