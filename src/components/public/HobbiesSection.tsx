import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Hobby } from '@/types';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { EmptyState } from '@/components/ui/States';
import { Reveal, staggerContainer, staggerItem } from './Reveal';
import { Section } from './Section';

export function HobbiesSection({ hobbies, still = false }: { hobbies: Hobby[]; still?: boolean }) {
  const reduceMotion = usePrefersReducedMotion();
  const animate = !still && !reduceMotion;

  return (
    <Section id="interests" eyebrow="Beyond Work" title="Hobbies & Interests" still={still} compact={still}>
      {hobbies.length === 0 ? (
        <Reveal disabled={still}>
          <EmptyState
            className="mx-auto max-w-md"
            title="No hobbies listed yet"
            message="They will appear here once added."
            icon={<Sparkles className="h-5 w-5" />}
          />
        </Reveal>
      ) : (
        <motion.ul
          variants={animate ? staggerContainer : undefined}
          initial={animate ? 'hidden' : false}
          whileInView={animate ? 'visible' : undefined}
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          {hobbies.map((hobby) => (
            <motion.li
              key={hobby.id}
              variants={animate ? staggerItem : undefined}
              whileHover={animate ? { y: -4, scale: 1.03 } : undefined}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="group flex items-center gap-2.5 rounded-full border border-line bg-surface-raised px-5 py-3 shadow-card transition-shadow duration-300 hover:border-gold/50 hover:shadow-card-hover print-block"
            >
              <Sparkles
                aria-hidden
                className="h-3.5 w-3.5 text-gold transition-transform duration-300 group-hover:rotate-12"
              />
              <span className="text-sm font-medium text-charcoal">{hobby.name}</span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </Section>
  );
}
