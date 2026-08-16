import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  loadingText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all ' +
  'duration-200 ease-out select-none disabled:pointer-events-none disabled:opacity-55 ' +
  'active:scale-[0.98] motion-reduce:active:scale-100';

const variants: Record<Variant, string> = {
  primary:
    'bg-charcoal text-ivory shadow-card hover:shadow-card-hover hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
  gold:
    'bg-gradient-to-br from-gold-soft via-gold to-gold-deep text-white shadow-card ' +
    'hover:shadow-card-hover hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
  secondary: 'border border-line bg-surface-raised text-charcoal hover:border-gold/60 hover:bg-gold/5',
  ghost: 'text-muted hover:bg-charcoal/5 hover:text-charcoal dark:hover:bg-white/5',
  danger: 'bg-danger text-white shadow-card hover:brightness-110',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.8rem]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base py-3.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText,
    leadingIcon,
    trailingIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      // Disabling while a mutation runs is what prevents duplicate submissions.
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        leadingIcon && <span aria-hidden className="shrink-0">{leadingIcon}</span>
      )}
      <span className="truncate">{isLoading ? (loadingText ?? children) : children}</span>
      {!isLoading && trailingIcon && <span aria-hidden className="shrink-0">{trailingIcon}</span>}
    </button>
  );
});
