import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Accent, ThemeMode, ThemePreference } from '@/types';
import { usePrefersReducedMotion } from './useMediaQuery';

const STORAGE_KEY = 'biodata-theme';

interface ThemeContextValue {
  /** What this browser is set to (may differ from the published default). */
  mode: ThemePreference;
  /** What is actually on screen once "system" is resolved. */
  resolved: 'light' | 'dark';
  /** The default published in `data/biodata.json`. */
  publishedMode: ThemeMode;
  /** True when this browser has overridden the published default. */
  isOverridden: boolean;
  accent: Accent;
  /** `theme.animations` from the JSON, and the visitor's motion preference. */
  animationsEnabled: boolean;
  setMode: (mode: ThemePreference) => void;
  cycleMode: () => void;
  /** Drops the local override and returns to the published default. */
  resetToPublished: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemePreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* storage blocked (private mode) — fall back to the published default */
  }
  return null;
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

interface ThemeProviderProps {
  children: ReactNode;
  /** `theme.mode` from `data/biodata.json` — the site-wide default. */
  defaultMode: ThemeMode;
  /** `theme.accent` from `data/biodata.json`. */
  accent: Accent;
  /** `theme.animations` from `data/biodata.json`. */
  animations: boolean;
}

/**
 * Theme state.
 *
 * The published default lives in `data/biodata.json`, so it is shared by
 * everyone who opens the link. A visitor who picks a different theme gets a
 * browser-local override in localStorage — a personal preference, which is
 * exactly the kind of thing localStorage is for. No biodata content is ever
 * stored there.
 */
export function ThemeProvider({ children, defaultMode, accent, animations }: ThemeProviderProps) {
  const [override, setOverride] = useState<ThemePreference | null>(readStoredMode);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const mode: ThemePreference = override ?? defaultMode;
  const resolved: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [resolved]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  const setMode = useCallback((next: ThemePreference) => {
    setOverride(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the preference simply will not persist */
    }
  }, []);

  const resetToPublished = useCallback(() => {
    setOverride(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
  }, []);

  const cycleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      publishedMode: defaultMode,
      isOverridden: override !== null && override !== defaultMode,
      accent,
      animationsEnabled: animations && !reduceMotion,
      setMode,
      cycleMode,
      resetToPublished,
    }),
    [mode, resolved, defaultMode, override, accent, animations, reduceMotion, setMode, cycleMode, resetToPublished],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}

/**
 * Whether decorative motion should run at all: the published `animations`
 * switch AND the visitor's `prefers-reduced-motion` setting must both allow it.
 */
export function useMotionAllowed(): boolean {
  return useTheme().animationsEnabled;
}
