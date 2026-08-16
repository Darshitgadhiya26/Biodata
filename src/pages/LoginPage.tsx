import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Lock, LogIn, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { SUPABASE_READY } from '@/lib/supabase';
import { errorMessage } from '@/services/errors';
import { loginSchema, type LoginFormValues } from '@/utils/validation';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { LoadingState } from '@/components/ui/States';
import { ThemeToggleButton } from '@/components/ui/ThemeToggle';

interface LocationState {
  from?: string;
}

/**
 * Admin sign-in. There is deliberately no "create account" link — the single
 * administrator is provisioned in the Supabase dashboard.
 */
export function LoginPage() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  useDocumentMeta({ title: 'Admin Sign In | Marriage Biodata' });

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setFocus('email');
  }, [isLoading, isAuthenticated, setFocus]);

  if (isLoading) return <LoadingState message="Checking your session…" />;

  // Already signed in — go straight where they were headed.
  if (isAuthenticated) {
    const from = (location.state as LocationState | null)?.from;
    return <Navigate to={from ?? '/admin'} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await signIn(values.email, values.password);
      const from = (location.state as LocationState | null)?.from;
      navigate(from ?? '/admin', { replace: true });
    } catch (error) {
      setFormError(errorMessage(error, 'Unable to sign in right now. Please try again.'));
    }
  });

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.08] via-transparent to-transparent" />
        <div className="absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-gold-soft/10 blur-3xl" />
      </div>

      <div className="absolute right-5 top-5">
        <ThemeToggleButton />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-charcoal"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to biodata
        </Link>

        <div className="rounded-3xl border border-line bg-surface-raised p-7 shadow-card sm:p-9">
          <header className="text-center">
            <span
              aria-hidden
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold"
            >
              <Lock className="h-5 w-5" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold text-charcoal">Admin Sign In</h1>
            <p className="mt-2 text-sm text-muted">Sign in to manage this marriage biodata.</p>
          </header>

          {!SUPABASE_READY && (
            <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
              Supabase is not configured. Add <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> to your environment.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="admin@example.com"
              error={errors.email?.message}
              required
              {...register('email')}
            />

            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              required
              {...register('password')}
            />

            {formError && (
              <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              loadingText="Signing in…"
              leadingIcon={<LogIn className="h-4 w-4" />}
              disabled={!SUPABASE_READY}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-subtle">
            <Mail aria-hidden className="h-3.5 w-3.5" />
            Access is limited to the account created in Supabase.
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default LoginPage;
