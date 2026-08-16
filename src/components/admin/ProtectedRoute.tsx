import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/States';

/**
 * Gate for /admin.
 *
 * This is a convenience redirect, not a security control — the real boundary is
 * Row Level Security in Postgres. Even if someone rendered the dashboard by
 * force, every write would be rejected by the database.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Never redirect before the persisted session has been resolved, or a
  // refresh on /admin would bounce a signed-in admin to /login.
  if (isLoading) return <LoadingState message="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
