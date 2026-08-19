import { Briefcase, Building2, MapPin } from 'lucide-react';
import type { Biodata } from '@/types';
import { Reveal } from './Reveal';
import { Section } from './Section';

/** Reads `biodata.career`. */
export function CareerSection({ biodata, still = false }: { biodata: Biodata; still?: boolean }) {
  const { career } = biodata;

  const rows = [
    { icon: Building2, label: 'Company', value: career.company },
    { icon: MapPin, label: 'Work Location', value: career.workLocation },
  ];

  return (
    <Section id="career" eyebrow="Profession" title="Career" still={still} compact={still}>
      <Reveal disabled={still}>
        <article className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-line bg-surface-raised shadow-card print-block">
          {/* Gold spine — the timeline rail */}
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold-soft via-gold to-gold-deep" />

          <div className="p-7 pl-8 sm:p-10 sm:pl-12">
            <header className="flex items-start gap-4">
              <span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold"
              >
                <Briefcase className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <p className="text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">Current Role</p>
                <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-charcoal sm:text-3xl">
                  {career.job || '—'}
                </h3>
              </div>
            </header>

            <div aria-hidden className="my-6 h-px w-full bg-gold-line opacity-70" />

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div className="min-w-0">
                    <dt className="text-[0.62rem] font-medium uppercase tracking-wideish text-subtle">{label}</dt>
                    <dd className="mt-1 break-words text-[0.95rem] font-medium text-charcoal">{value || '—'}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </article>
      </Reveal>
    </Section>
  );
}
