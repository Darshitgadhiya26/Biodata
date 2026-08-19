import { useAdminSession } from '@/hooks/useAdminSession';
import { DraftProvider } from '@/hooks/useDraft';
import { LoadingState } from '@/components/ui/States';
import LoginPage from '@/pages/admin/LoginPage';
import { AdminLayout } from './AdminLayout';

/**
 * Everything under `/admin` passes through here.
 *
 * This is a convenience gate, not the security boundary: the editor is useless
 * without the API, and every `/api/github/*` route independently verifies the
 * session cookie before touching the repository. Hiding the UI simply keeps
 * the admin controls off the public website.
 */
export function AdminGate() {
  const { status } = useAdminSession();

  if (status === 'checking') return <LoadingState message="Checking your session…" />;
  if (status !== 'authenticated') return <LoginPage />;

  return (
    <DraftProvider>
      <AdminLayout />
    </DraftProvider>
  );
}

export default AdminGate;
