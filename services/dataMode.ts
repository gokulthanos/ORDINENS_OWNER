export type DataMode = 'supabase' | 'mock';

function readMode(): DataMode {
  const raw = process.env.EXPO_PUBLIC_DATA_MODE ?? 'mock';
  return raw === 'supabase' ? 'supabase' : 'mock';
}

export const DATA_MODE: DataMode = readMode();

export function isMockMode(): boolean {
  return DATA_MODE === 'mock';
}

export function isSupabaseMode(): boolean {
  return DATA_MODE === 'supabase';
}