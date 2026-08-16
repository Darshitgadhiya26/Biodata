import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeMode } from '@/types';
import { cn } from '@/utils/cn';

const OPTIONS: Array<{ mode: ThemeMode; label: string; Icon: typeof Sun }> = [
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark', label: 'Dark', Icon: Moon },
  { mode: 'system', label: 'System', Icon: Monitor },
];

/** Segmented light / dark / system control. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn('inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5', className)}
    >
      {OPTIONS.map(({ mode: value, label, Icon }) => {
        const active = mode === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setMode(value)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200',
              active ? 'bg-charcoal text-ivory shadow-sm' : 'text-subtle hover:text-charcoal',
            )}
          >
            <Icon aria-hidden className="h-[0.95rem] w-[0.95rem]" />
          </button>
        );
      })}
    </div>
  );
}

/** Compact single-button variant for tight toolbars. */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { mode, resolved, cycleMode } = useTheme();
  const Icon = mode === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={cycleMode}
      aria-label={`Theme: ${mode}. Click to change.`}
      title={`Theme: ${mode}`}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-gold/60 hover:text-charcoal',
        className,
      )}
    >
      <Icon aria-hidden className="h-4 w-4" />
    </button>
  );
}
