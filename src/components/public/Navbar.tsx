import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Share2, X } from 'lucide-react';
import { useScrollSpy, useScrolled } from '@/hooks/useScrollSpy';
import { useMotionAllowed } from '@/hooks/useTheme';
import { ThemeToggleButton } from '@/components/ui/ThemeToggle';
import { cn } from '@/utils/cn';

interface NavItem {
  id: string;
  label: string;
  /** Section ids that should light this item up. */
  covers?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'personal', label: 'Personal' },
  { id: 'family', label: 'Family', covers: ['family', 'maternal'] },
  { id: 'education', label: 'Education' },
  { id: 'career', label: 'Career' },
  { id: 'interests', label: 'Interests' },
  { id: 'contact', label: 'Contact' },
];

const SPY_IDS = NAV_ITEMS.flatMap((item) => item.covers ?? [item.id]);

interface NavbarProps {
  name: string;
  onShare: () => void;
}

export function Navbar({ name, onShare }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled(16);
  const activeSection = useScrollSpy(SPY_IDS);
  const motionAllowed = useMotionAllowed();

  const activeNavId = useMemo(() => {
    const match = NAV_ITEMS.find((item) => (item.covers ?? [item.id]).includes(activeSection));
    return match?.id ?? 'home';
  }, [activeSection]);

  // Close the sheet on Escape and lock the page behind it.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const scrollToSection = useCallback(
    (id: string) => {
      setMenuOpen(false);

      const target = document.getElementById(id);
      if (!target) return;

      // rAF lets the mobile sheet finish closing before we scroll.
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: motionAllowed ? 'smooth' : 'auto', block: 'start' });
        // Move keyboard focus with the eye.
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    },
    [motionAllowed],
  );

  return (
    <>
      <a
        href="#personal"
        className="sr-only-focusable fixed left-4 top-4 z-[80] rounded-full bg-charcoal px-5 py-2.5 text-sm font-medium text-ivory shadow-card"
      >
        Skip to biodata
      </a>

      <nav
        data-site-nav
        aria-label="Section navigation"
        className={cn(
          'no-print fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled ? 'border-b border-line/70 bg-ivory/80 backdrop-blur-xl' : 'bg-transparent',
        )}
      >
        <div className="container-luxe flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
          {/* ---- Wordmark ---- */}
          <button
            type="button"
            onClick={() => scrollToSection('home')}
            className="group flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-2 text-left"
            aria-label={`${name} — back to top`}
          >
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-display text-sm font-semibold text-gold transition-colors group-hover:bg-gold/20"
            >
              {name.charAt(0) || 'B'}
            </span>
            <span className="truncate font-display text-base font-semibold tracking-tight text-charcoal sm:text-lg">
              {name}
            </span>
          </button>

          {/* ---- Desktop links ---- */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = activeNavId === item.id;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'relative rounded-full px-3.5 py-2 text-[0.82rem] font-medium transition-colors duration-200',
                      active ? 'text-charcoal' : 'text-muted hover:text-charcoal',
                    )}
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-full bg-gold/12 ring-1 ring-gold/25"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* ---- Actions ---- */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onShare}
              aria-label="Share this biodata"
              title="Share biodata"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-gold/60 hover:text-charcoal sm:flex"
            >
              <Share2 aria-hidden className="h-4 w-4" />
            </button>

            <ThemeToggleButton />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-charcoal transition-colors hover:border-gold/60 lg:hidden"
            >
              {menuOpen ? <X aria-hidden className="h-4 w-4" /> : <Menu aria-hidden className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Hairline that fades in with the blur */}
        <div
          aria-hidden
          className={cn(
            'h-px w-full bg-gold-line transition-opacity duration-300',
            scrolled ? 'opacity-60' : 'opacity-0',
          )}
        />
      </nav>

      {/* ---- Mobile sheet ---- */}
      <AnimatePresence>
        {menuOpen && (
          <div className="no-print fixed inset-0 z-[55] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-charcoal/35 backdrop-blur-sm"
              aria-hidden
            />

            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute inset-x-3 top-[4.5rem] overflow-hidden rounded-3xl border border-line bg-surface-raised p-3 shadow-card-hover"
            >
              <ul className="flex flex-col">
                {NAV_ITEMS.map((item, index) => {
                  const active = activeNavId === item.id;

                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * index, duration: 0.28 }}
                    >
                      <button
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                          'flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[0.95rem] font-medium transition-colors',
                          active ? 'bg-gold/12 text-charcoal' : 'text-muted hover:bg-charcoal/5 hover:text-charcoal',
                        )}
                      >
                        {item.label}
                        {active && <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-gold" />}
                      </button>
                    </motion.li>
                  );
                })}
              </ul>

              <div className="mt-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onShare();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-3.5 text-left text-[0.95rem] font-medium text-muted transition-colors hover:bg-charcoal/5 hover:text-charcoal"
                >
                  <Share2 aria-hidden className="h-4 w-4" />
                  Share biodata
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
