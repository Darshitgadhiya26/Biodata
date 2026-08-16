import { motion } from 'framer-motion';
import { Briefcase, CalendarDays, GraduationCap, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Biodata } from '@/types';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { calculateAge, formatDateMedium, toLines } from '@/utils/format';
import { ProfilePhoto } from './ProfilePhoto';
import { cn } from '@/utils/cn';

interface HeroProps {
  biodata: Biodata;
  still?: boolean;
}

interface Fact {
  icon: LucideIcon;
  label: string;
  value: string;
}

/** Last line of an address is the district — the most useful "location" chip. */
function locationFrom(biodata: Biodata): string {
  const lines = toLines(biodata.address);
  return lines[lines.length - 1] ?? '';
}

export function Hero({ biodata, still = false }: HeroProps) {
  const reduceMotion = usePrefersReducedMotion();
  const animate = !still && !reduceMotion;

  const age = calculateAge(biodata.date_of_birth);
  const dob = formatDateMedium(biodata.date_of_birth);

  const facts: Fact[] = [
    {
      icon: CalendarDays,
      label: 'Date of Birth',
      value: dob ? (age !== null ? `${dob} · ${age} yrs` : dob) : '—',
    },
    { icon: GraduationCap, label: 'Education', value: biodata.degree || '—' },
    { icon: Briefcase, label: 'Profession', value: biodata.job_title || '—' },
    { icon: MapPin, label: 'Location', value: biodata.work_location || locationFrom(biodata) || '—' },
  ];

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section
      id="home"
      aria-label="Introduction"
      className={cn(
        'relative isolate overflow-hidden print-block',
        still ? 'pb-10 pt-8' : 'pb-16 pt-28 sm:pb-20 sm:pt-32 print:pt-0',
      )}
    >
      {/* ---- Decorative layer (never announced, hidden on paper) ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 print:hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.07] via-transparent to-transparent" />
        <div
          className={cn(
            'absolute -left-24 top-10 h-64 w-64 rounded-full bg-gold/10 blur-3xl',
            animate && 'animate-float',
          )}
        />
        <div
          className={cn(
            'absolute -right-20 top-40 h-72 w-72 rounded-full bg-gold-soft/10 blur-3xl',
            animate && 'animate-float',
          )}
          style={animate ? { animationDelay: '2.5s' } : undefined}
        />
        {/* Fine paper grid, barely visible — adds depth without noise */}
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgb(var(--c-gold))_1px,transparent_1px),linear-gradient(90deg,rgb(var(--c-gold))_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <motion.div
        variants={animate ? container : undefined}
        initial={animate ? 'hidden' : false}
        animate={animate ? 'visible' : undefined}
        className="container-luxe flex flex-col items-center text-center"
      >
        <motion.p variants={animate ? item : undefined} className="eyebrow">
          Marriage Biodata
        </motion.p>

        <motion.div variants={animate ? item : undefined} className="mt-8 sm:mt-10">
          <ProfilePhoto
            src={biodata.profile_photo_url}
            name={biodata.name}
            size={still ? 'md' : 'lg'}
            still={still}
            priority
          />
        </motion.div>

        <motion.h1
          variants={animate ? item : undefined}
          className={cn(
            'mt-9 font-display font-semibold uppercase leading-[1.05] tracking-tight text-charcoal',
            still ? 'text-3xl' : 'text-[2.1rem] xs:text-5xl sm:text-6xl lg:text-7xl',
          )}
        >
          {biodata.name}
        </motion.h1>

        <motion.div variants={animate ? item : undefined} className="mt-6 flex items-center gap-3" aria-hidden>
          <span className="h-px w-12 bg-gold/40 sm:w-20" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          <span className="h-px w-12 bg-gold/40 sm:w-20" />
        </motion.div>

        <motion.p
          variants={animate ? item : undefined}
          className="mt-6 max-w-md text-sm leading-relaxed text-muted"
        >
          {[biodata.job_title, biodata.company].filter(Boolean).join(' · ') || 'Marriage biodata'}
        </motion.p>

        {/* ---- Quick facts ---- */}
        <motion.dl
          variants={animate ? item : undefined}
          /* Hidden on paper: every value here is repeated in full by the
             Personal, Education and Career sections below. */
          className="no-print mt-12 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
        >
          {facts.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-line/80 bg-surface-raised/70 p-4 text-left shadow-card backdrop-blur-sm transition-shadow duration-300 hover:shadow-card-hover"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold"
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-[0.62rem] font-medium uppercase tracking-wideish text-subtle">{label}</dt>
                <dd className="mt-0.5 truncate text-[0.83rem] font-medium text-charcoal" title={value}>
                  {value}
                </dd>
              </div>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}
