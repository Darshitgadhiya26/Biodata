import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center gap-2', className)}>
      <Loader2 aria-hidden className="h-4 w-4 animate-spin text-gold" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Full-section loading state used while the biodata is being fetched. */
export function LoadingState({ message = 'Loading biodata…' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <span className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold/20" />
        <Loader2 aria-hidden className="h-7 w-7 animate-spin text-gold" />
      </span>
      <p className="font-display text-lg text-muted">{message}</p>
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load biodata.',
  message = 'Please try again.',
  onRetry,
  isRetrying,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle aria-hidden className="h-6 w-6 text-danger" />
      </span>

      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-semibold text-charcoal">{title}</h2>
        <p className="text-sm leading-relaxed text-muted">{message}</p>
      </div>

      {onRetry && (
        <Button variant="secondary" onClick={onRetry} isLoading={isRetrying} loadingText="Retrying…">
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  className,
}: {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/10 text-gold">
        {icon ?? <Inbox aria-hidden className="h-5 w-5" />}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-charcoal">{title}</p>
        {message && <p className="text-xs text-muted">{message}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}
