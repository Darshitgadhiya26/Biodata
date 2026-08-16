import type { ReactNode } from 'react';
import { Reveal } from './Reveal';
import { cn } from '@/utils/cn';

interface SectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  /** Live preview turns animations off. */
  still?: boolean;
}

/**
 * Shared section shell: a small gold eyebrow, a serif title and a hairline
 * gold rule. Repeating this exactly is what makes the page read as one
 * document rather than a stack of widgets.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  compact = false,
  still = false,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn('scroll-mt-24 print-block', compact ? 'py-10' : 'py-16 sm:py-20', className)}
    >
      <div className="container-luxe">
        <Reveal disabled={still} className="mb-8 text-center sm:mb-12">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}

          <h2
            id={`${id}-title`}
            className={cn(
              'font-display font-semibold tracking-tight text-charcoal',
              compact ? 'text-2xl' : 'text-3xl sm:text-4xl',
            )}
          >
            {title}
          </h2>

          <div className="mx-auto mt-4 flex items-center justify-center gap-2" aria-hidden>
            <span className="h-px w-10 bg-gold/40" />
            <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
            <span className="h-px w-10 bg-gold/40" />
          </div>

          {description && (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
          )}
        </Reveal>

        {children}
      </div>
    </section>
  );
}
