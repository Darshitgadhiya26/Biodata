import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotionAllowed } from '@/hooks/useTheme';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds of delay, used to stagger siblings. */
  delay?: number;
  y?: number;
  as?: 'div' | 'li' | 'section' | 'article' | 'span';
  /** Disable animation entirely (the admin live preview does this). */
  disabled?: boolean;
}

/**
 * Scroll-reveal wrapper. Deliberately restrained: a short fade with a small
 * upward drift, once per element. When the visitor prefers reduced motion — or
 * `theme.animations` is off in the JSON — the content is rendered immediately
 * with no transform at all.
 */
export function Reveal({ children, className, delay = 0, y = 18, as = 'div', disabled }: RevealProps) {
  const motionAllowed = useMotionAllowed();
  const MotionTag = motion[as];

  if (!motionAllowed || disabled) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px 0px -80px 0px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}

/** Container/child variants for staggered lists. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
