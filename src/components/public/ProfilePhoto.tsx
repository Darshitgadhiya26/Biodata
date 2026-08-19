import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMotionAllowed } from '@/hooks/useTheme';
import { initials } from '@/utils/format';
import { cn } from '@/utils/cn';

interface ProfilePhotoProps {
  src: string | null | undefined;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  still?: boolean;
  /** The hero photo is the LCP element and must not be lazy-loaded. */
  priority?: boolean;
}

const sizes = {
  sm: 'h-24 w-24',
  md: 'h-40 w-40 sm:h-48 sm:w-48',
  lg: 'h-52 w-52 xs:h-60 xs:w-60 sm:h-72 sm:w-72 lg:h-80 lg:w-80',
} as const;

/**
 * Premium portrait: a champagne ring, a soft ambient glow and a gentle lift on
 * hover. Falls back to monogram initials if the photo is missing or fails.
 */
export function ProfilePhoto({
  src,
  name,
  size = 'lg',
  className,
  still = false,
  priority = false,
}: ProfilePhotoProps) {
  const motionAllowed = useMotionAllowed();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // A newly uploaded photo changes the URL — reset the error/loaded flags.
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;
  const animate = !still && motionAllowed;

  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.94 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={animate ? { scale: 1.02 } : undefined}
      data-portrait
      className={cn('group relative shrink-0', sizes[size], className)}
    >
      {/* Ambient champagne glow behind the portrait */}
      <span
        aria-hidden
        className="absolute -inset-5 rounded-full bg-gold/15 blur-2xl transition-opacity duration-500 group-hover:opacity-90 print:hidden"
      />

      {/* Gold ring */}
      <span
        aria-hidden
        className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-gold-soft via-gold to-gold-deep opacity-90"
      />
      <span aria-hidden className="absolute -inset-[3px] rounded-full bg-ivory" />

      <div className="relative h-full w-full overflow-hidden rounded-full bg-surface-raised shadow-portrait">
        {showImage ? (
          <>
            {!loaded && <span aria-hidden className="absolute inset-0 skeleton rounded-full" />}
            <img
              src={src as string}
              alt={`Portrait photograph of ${name}`}
              width={512}
              height={512}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              // @ts-expect-error fetchPriority is valid HTML; React 18 types lag.
              fetchpriority={priority ? 'high' : undefined}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={cn(
                'h-full w-full object-cover object-center transition-all duration-700',
                loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
                animate && 'group-hover:scale-[1.04]',
              )}
            />
          </>
        ) : (
          <div
            role="img"
            aria-label={`${name} — no photograph available`}
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold/12 to-gold/5"
          >
            <span className="font-display text-4xl font-light tracking-wide text-gold sm:text-5xl">
              {initials(name) || '—'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
