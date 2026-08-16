import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { ToastVariant } from '@/types';
import { cn } from '@/utils/cn';

const icons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const accents: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-gold',
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      data-toast-viewport
      // aria-live so screen readers hear the save confirmation too.
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.variant];

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface-raised p-4 shadow-card-hover"
            >
              <Icon aria-hidden className={cn('mt-0.5 h-5 w-5 shrink-0', accents[toast.variant])} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-charcoal">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-xs text-muted">{toast.description}</p>}
              </div>

              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-m-1 rounded-full p-1 text-subtle transition-colors hover:text-charcoal"
                aria-label="Dismiss notification"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
