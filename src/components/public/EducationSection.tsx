import { GraduationCap, School } from 'lucide-react';
import type { Biodata } from '@/types';
import { Reveal } from './Reveal';
import { Section } from './Section';

export function EducationSection({ biodata, still = false }: { biodata: Biodata; still?: boolean }) {
  return (
    <Section id="education" eyebrow="Academics" title="Education" still={still} compact={still}>
      <Reveal disabled={still}>
        <article className="flourish relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-line bg-surface-raised p-7 shadow-card sm:p-10 print-block">
          <div aria-hidden className="absolute inset-0 bg-gold-sheen opacity-60" />

          <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
            <span
              aria-hidden
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold"
            >
              <GraduationCap className="h-7 w-7" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">
                Highest Qualification
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-charcoal sm:text-3xl">
                {biodata.degree || '—'}
              </h3>

              <div aria-hidden className="my-5 h-px w-full bg-gold-line opacity-70" />

              <div className="flex items-center justify-center gap-2.5 text-muted sm:justify-start">
                <School aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                <p className="text-sm font-medium">{biodata.college || '—'}</p>
              </div>
            </div>
          </div>
        </article>
      </Reveal>
    </Section>
  );
}
