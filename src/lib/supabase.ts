// Supabase client — optional cloud backup for user data.
// The app works 100% offline without an account; login only enables cross-device backup.
// Credentials are placeholders until the owner creates a Supabase project (see README).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PLACEHOLDER_URL = 'https://YOUR_PROJECT.supabase.co';
const PLACEHOLDER_KEY = 'YOUR_ANON_KEY';

function getConfig(): { url: string; anonKey: string } {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const url = (extra.supabaseUrl as string) || process.env.EXPO_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
  const anonKey = (extra.supabaseAnonKey as string) || process.env.EXPO_PUBLIC_SUPABASE_KEY || PLACEHOLDER_KEY;
  return { url, anonKey };
}

/** Supabase project URL (used by Edge Function calls). */
export const SUPABASE_URL = getConfig().url;
/** Supabase anon key (used by Edge Function calls). */
export const SUPABASE_ANON_KEY = getConfig().anonKey;

/** True when the owner has filled in real Supabase credentials. */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getConfig();
  return (
    !!url && !!anonKey &&
    !url.includes('YOUR_PROJECT') &&
    !anonKey.includes('YOUR_ANON_KEY') &&
    url.startsWith('https://')
  );
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    const { url, anonKey } = getConfig();
    client = createClient(url, anonKey, {
      auth: {
        // Persist session on device so login survives restarts.
        // AsyncStorage is required - default localStorage doesn't exist in React Native.
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
