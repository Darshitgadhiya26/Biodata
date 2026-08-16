import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { SUPABASE_READY } from '@/lib/supabase';
import * as authService from '@/services/authService';
import type { AdminUser } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: AdminUser | null;
  /** True until the initial session lookup resolves. */
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!SUPABASE_READY) {
      setIsLoading(false);
      return;
    }

    let active = true;

    // Resolve whatever session is already persisted before rendering routes,
    // so a signed-in admin refreshing /admin is never bounced to /login.
    authService
      .getSession()
      .then((current) => {
        if (active) setSession(current);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const unsubscribe = authService.onAuthStateChange((next) => {
      if (!active) return;
      setSession(next);
      setIsLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const next = await authService.signIn(email, password);
      setSession(next);
      // Admin reads can include unpublished rows, so drop anonymous cache.
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: authService.toAdminUser(session?.user),
      isLoading,
      isAuthenticated: Boolean(session),
      signIn,
      signOut,
    }),
    [session, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
