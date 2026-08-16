import type { Session, User } from '@supabase/supabase-js';
import { assertSupabaseConfigured, supabase } from '@/lib/supabase';
import { BiodataError, type AdminUser } from '@/types';

/**
 * Authentication for the admin dashboard.
 *
 * There is deliberately no sign-up path: the single administrator account is
 * created by hand in the Supabase dashboard (see README). Everything here goes
 * through Supabase Auth, which stores the session and refreshes the JWT.
 */

export function toAdminUser(user: User | null | undefined): AdminUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

export async function getSession(): Promise<Session | null> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new BiodataError('Unable to verify your session. Please sign in again.', { cause: error });
  return data.session;
}

export async function signIn(email: string, password: string): Promise<Session> {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    // Deliberately vague: never confirm whether an address exists.
    if (error.status === 400 || /invalid login/i.test(error.message)) {
      throw new BiodataError('Incorrect email or password.', { cause: error });
    }
    if (error.status === 429) {
      throw new BiodataError('Too many attempts. Please wait a moment and try again.', { cause: error });
    }
    throw new BiodataError('Unable to sign in right now. Please try again.', { cause: error });
  }

  if (!data.session) throw new BiodataError('Unable to sign in right now. Please try again.');
  return data.session;
}

export async function signOut(): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await supabase.auth.signOut();
  if (error) throw new BiodataError('Unable to sign out. Please try again.', { cause: error });
}

/** Subscribes to sign-in / sign-out / token-refresh events. */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));

  return () => subscription.unsubscribe();
}
