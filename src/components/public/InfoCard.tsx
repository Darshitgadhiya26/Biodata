import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useMotionAllowed } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';

interface InfoCardProps {
  icon: LucideIcon;
  label: string;
  value: string | null | undefined;
  /** Multi-line values (addresses) render as stacked lines. */
  lines?: string[];
  className?: string;
  still?: boolean;
  emphasis?: boolean;
}

/**
 * The atom of the whole biodata: a labelled fact in a premium card.
 * Renders an em dash rather than disappearing when a value is missing, so the
 * layout never collapses and nothing is invented to fill the gap.
 */
export function InfoCard({ icon: Icon, label, value, lines, className, still, emphasis }: InfoCardProps) {
  const motionAllowed = useMotionAllowed();
  const hasLines = Array.isArray(lines) && lines.length > 0;
  const isEmpty = !hasLines && !value;

  return (
    <motion.div
      whileHover={still || !motionAllowed ? undefined : { y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'group relative flex gap-4 overflow-hidden rounded-2xl border border-line bg-surface-raised p-5 shadow-card transition-shadow duration-300 hover:shadow-card-hover print-block',
        emphasis && 'bg-gold-sheen',
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold transition-colors duration-300 group-hover:border-gold/50 group-hover:bg-gold/15"
      >
        <Icon className="h-[1.15rem] w-[1.15rem]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">{label}</p>

        {hasLines ? (
          <address className="mt-1.5 space-y-0.5 not-italic">
            {lines.map((line, index) => (
              <span key={`${line}-${index}`} className="block break-words text-[0.95rem] leading-snug text-charcoal">
                {line}
              </span>
            ))}
          </address>
        ) : (
          <p
            className={cn(
              'mt-1.5 break-words text-[0.95rem] font-medium leading-snug',
              isEmpty ? 'text-subtle' : 'text-charcoal',
            )}
          >
            {value || '—'}
          </p>
        )}
      </div>
    </motion.div>
  );
}
