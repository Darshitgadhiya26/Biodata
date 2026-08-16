import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Toast, ToastVariant } from '@/types';

interface ToastOptions {
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  notify: (title: string, options?: ToastOptions) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (title: string, options: ToastOptions = {}) => {
      const id = crypto.randomUUID();
      const toast: Toast = {
        id,
        title,
        description: options.description,
        variant: options.variant ?? 'info',
        duration: options.duration ?? (options.variant === 'error' ? 6000 : 3800),
      };

      // Keep at most three on screen so the corner never fills up.
      setToasts((current) => [...current.slice(-2), toast]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), toast.duration),
      );

      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, description?: string) => notify(title, { description, variant: 'success' }),
    [notify],
  );

  const error = useCallback(
    (title: string, description?: string) => notify(title, { description, variant: 'error' }),
    [notify],
  );

  const value = useMemo(
    () => ({ toasts, notify, success, error, dismiss }),
    [toasts, notify, success, error, dismiss],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
