import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSession, login as apiLogin, logout as apiLogout, type SessionInfo } from '@/utils/api';

type Status = 'checking' | 'authenticated' | 'anonymous';

interface AdminSessionValue {
  status: Status;
  /** False when the server is missing an environment variable. */
  configured: boolean;
  /** Names of any missing variables — never their values. */
  missing: string[];
  branch: string;
  signIn: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

/**
 * Admin session state.
 *
 * The session itself is an HttpOnly cookie the browser cannot read, so this
 * hook asks the server whether it is still valid rather than tracking it
 * locally. Nothing sensitive is held in React state.
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const [info, setInfo] = useState<SessionInfo>({
    authenticated: false,
    configured: true,
    missing: [],
    branch: 'main',
  });

  const refresh = useCallback(async () => {
    try {
      const session = await getSession();
      setInfo(session);
      setStatus(session.authenticated ? 'authenticated' : 'anonymous');
    } catch {
      // The endpoint is unreachable (offline, or `vite dev` without `vercel dev`).
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (password: string) => {
    await apiLogin(password);
    setStatus('authenticated');
    setInfo((current) => ({ ...current, authenticated: true }));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setStatus('anonymous');
      setInfo((current) => ({ ...current, authenticated: false }));
    }
  }, []);

  const value = useMemo<AdminSessionValue>(
    () => ({
      status,
      configured: info.configured,
      missing: info.missing,
      branch: info.branch,
      signIn,
      signOut,
      refresh,
    }),
    [status, info.configured, info.missing, info.branch, signIn, signOut, refresh],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession(): AdminSessionValue {
  const context = useContext(AdminSessionContext);
  if (!context) throw new Error('useAdminSession must be used inside <AdminSessionProvider>');
  return context;
}
