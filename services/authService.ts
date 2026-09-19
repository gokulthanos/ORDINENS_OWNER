import AsyncStorage from '@react-native-async-storage/async-storage';
import { OwnerRecord, OwnerSession } from '@/types';
import { STORAGE_KEYS, readJSON, writeJSON, removeItem, uid } from '@/utils/storage';

/*
 * TEMPORARY LOCAL AUTHENTICATION (PROTOTYPE)
 *
 * Authentication and session handling is isolated behind this service so it can
 * be swapped for a real backend later without touching the screens.
 *
 * Flow:
 *   Owner Login
 *       ↓
 *   authService.login()
 *       ↓
 *   Temporary Local Auth (AsyncStorage)
 *       ↓
 *   Future Custom Backend
 */

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

/* ---------------------------- Owner registry ---------------------------- */

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

/* ------------------------------ Auth API ------------------------------ */

/**
 * TEMPORARY PROTOTYPE AUTH
 * Accept valid email/password format only.
 * Replace with real backend authentication before production.
 */
export async function login(email: string, _password: string): Promise<SignInResult> {
  const owner = await getOwnerByEmail(email);
  const fallbackName =
    email
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .trim() || 'Owner';

  const session: OwnerSession = {
    id: owner?.id ?? uid('OWN'),
    email: email.toLowerCase(),
    name: owner?.name ?? fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
    phone: owner?.phone ?? null,
    role: 'owner',
    authenticated: true,
    shopId: owner?.shopId ?? null,
  };
  await writeJSON(SESSION_KEY, session);
  return { session, error: null };
}

export async function signUp(email: string, password: string, name: string, phone?: string): Promise<SignUpResult> {
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

export async function logout(): Promise<void> {
  await removeItem(SESSION_KEY);
}

/**
 * A stored owner session only counts as valid when it identifies the owner
 * (id + email) and is explicitly flagged as an authenticated owner session.
 * Anything else (missing/invalid/corrupted) is discarded.
 */
function isValidSession(session: unknown): session is OwnerSession {
  if (!session || typeof session !== 'object') return false;
  const s = session as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    s.id.trim().length > 0 &&
    typeof s.email === 'string' &&
    s.email.trim().length > 0 &&
    s.role === 'owner' &&
    s.authenticated === true
  );
}

export async function getCurrentSession(): Promise<OwnerSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSession(parsed)) {
      await removeItem(SESSION_KEY);
      return null;
    }
    const session = parsed;
    const owner = await getOwnerById(session.id);
    if (!owner) {
      // TEMPORARY PROTOTYPE AUTH
      // Keep lightweight prototype sessions that have no registered record.
      return session;
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
    await removeItem(SESSION_KEY);
    return null;
  }
}

export const authService = {
  login,
  signUp,
  logout,
  getCurrentSession,
  updateOwnerShopId,
};

export default authService;