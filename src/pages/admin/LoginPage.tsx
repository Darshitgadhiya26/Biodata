import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, KeyRound, Lock } from 'lucide-react';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { errorMessage } from '@/utils/api';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';

/**
 * The admin password gate.
 *
 * The password is checked by `/api/admin/login` against a Vercel environment
 * variable; it is never compared, stored or referenced in this bundle. On
 * success the server sets an HttpOnly cookie that JavaScript cannot read.
 */
export function LoginPage() {
  const { signIn, configured, missing } = useAdminSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDocumentMeta({ title: 'Admin Sign In | Marriage Biodata' });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await signIn(password);
      setPassword('');
    } catch (caught) {
      setError(errorMessage(caught, 'Sign in failed.'));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ivory px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-line bg-surface-raised p-7 shadow-card sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold"
            >
              <Lock className="h-5 w-5" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-semibold text-charcoal">Admin Sign In</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Enter the admin password to edit this biodata.
            </p>
          </div>

          {!configured && (
            <div role="alert" className="mt-6 rounded-2xl border border-danger/40 bg-danger/5 p-4">
              <p className="flex items-start gap-2.5 text-sm text-charcoal">
                <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span>
                  <strong className="font-semibold">The server is not fully configured.</strong> Add{' '}
                  {missing.map((name, index) => (
                    <span key={name}>
                      {index > 0 && ', '}
                      <code className="text-xs">{name}</code>
                    </span>
                  ))}{' '}
                  in Vercel → Settings → Environment Variables, then redeploy.
                </span>
              </p>
            </div>
          )}

          <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
            <TextField
              label="Admin password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              error={error ?? undefined}
            />

            <Button
              type="submit"
              variant="gold"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
              loadingText="Signing in…"
              leadingIcon={<KeyRound className="h-4 w-4" />}
              disabled={password.length === 0}
            >
              Sign In
            </Button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-subtle underline-offset-4 transition-colors hover:text-gold hover:underline"
          >
            <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
            Back to the biodata
          </Link>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
