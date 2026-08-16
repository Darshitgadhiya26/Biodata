import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { BiodataError } from '@/types';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './env';

/**
 * Single shared Supabase client.
 *
 * When the environment variables are missing we still construct a client
 * against a placeholder origin so that importing this module can never crash
 * the app — `assertSupabaseConfigured()` turns the situation into a readable
 * error state instead of a blank screen.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-anon-key',
  {
    auth: {
      // Supabase Auth persists a short-lived JWT + refresh token. This is the
      // session only — biodata itself always lives in Postgres.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'biodata-auth',
      flowType: 'pkce',
    },
    db: { schema: 'public' },
    global: {
      headers: { 'x-application-name': 'marriage-biodata' },
    },
    realtime: {
      params: { eventsPerSecond: 4 },
    },
  },
);

export const SUPABASE_READY = isSupabaseConfigured;

/** Throws a human-readable error when the project has not been configured. */
export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new BiodataError(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment, then reload.',
      { code: 'SUPABASE_NOT_CONFIGURED' },
    );
  }
}
