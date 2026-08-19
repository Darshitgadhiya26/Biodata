import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  Camera,
  ExternalLink,
  GitBranch,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Phone,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useDraft } from '@/hooks/useDraft';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useToast } from '@/hooks/useToast';
import { errorMessage } from '@/utils/api';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { ThemeToggleButton } from '@/components/ui/ThemeToggle';
import { LivePreview } from './LivePreview';
import { PublishBar } from './PublishBar';

interface NavEntry {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
}

const NAV: NavEntry[] = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/personal', label: 'Personal', Icon: User },
  { to: '/admin/family', label: 'Family', Icon: Users },
  { to: '/admin/maternal', label: 'Maternal', Icon: Heart },
  { to: '/admin/education', label: 'Education', Icon: GraduationCap },
  { to: '/admin/career', label: 'Career', Icon: Briefcase },
  { to: '/admin/hobbies', label: 'Hobbies', Icon: Sparkles },
  { to: '/admin/contact', label: 'Contact', Icon: Phone },
  { to: '/admin/photo', label: 'Profile Photo', Icon: Camera },
  { to: '/admin/appearance', label: 'Appearance', Icon: Palette },
];

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Dashboard sections" className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-charcoal text-ivory shadow-sm'
                : 'text-muted hover:bg-charcoal/5 hover:text-charcoal dark:hover:bg-white/5',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon aria-hidden className={cn('h-4 w-4 shrink-0', !isActive && 'text-subtle')} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Admin shell: sections on the left, the editor in the middle, the live preview
 * on the right, and the publish bar pinned to the bottom.
 *
 * Deliberately quiet and functional — the opposite of the public page — so the
 * two never feel like the same surface.
 */
export function AdminLayout() {
  const { signOut, branch } = useAdminSession();
  const { draft, loadState, loadError, isDirty, reload, repo, restoredLocally } = useDraft();
  const toast = useToast();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useDocumentMeta({ title: 'Admin Dashboard | Marriage Biodata' });

  // Close the drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    if (restoredLocally) {
      toast.notify('Unpublished draft restored.', {
        description: 'It was saved in this browser and has not been published yet.',
      });
    }
  }, [restoredLocally, toast]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      toast.error('Unable to sign out.', errorMessage(error));
    } finally {
      setSigningOut(false);
    }
  };

  // The dedicated preview route takes the full width — no side-by-side pane.
  const isFullPreview = location.pathname === '/admin/preview';
  const showPreviewPane = Boolean(draft) && !isFullPreview;

  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      {/* ---------------- Top bar ---------------- */}
      <header data-admin-chrome className="sticky top-0 z-40 border-b border-line bg-ivory/85 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open dashboard menu"
              aria-expanded={drawerOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-charcoal transition-colors hover:border-gold/60 lg:hidden"
            >
              <Menu aria-hidden className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-tight text-charcoal">
                {draft?.personal.name ?? 'Marriage Biodata'}
              </p>
              <p className="flex items-center gap-1.5 truncate text-[0.7rem] text-subtle">
                <GitBranch aria-hidden className="h-3 w-3" />
                {repo ? `${repo} · ${branch}` : 'GitHub'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[0.8rem] font-medium text-muted transition-colors hover:border-gold/60 hover:text-charcoal sm:inline-flex"
            >
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              Public Website
            </Link>

            <ThemeToggleButton />

            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleSignOut()}
              isLoading={signingOut}
              loadingText="Signing out…"
              leadingIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ---------------- Desktop sidebar ---------------- */}
        <aside
          data-admin-chrome
          className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-line bg-surface p-4 lg:block"
        >
          <SidebarLinks />

          <div className="mt-6 rounded-2xl border border-line bg-surface-raised p-4">
            <p className="text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">How publishing works</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Publishing commits <code className="text-[0.7rem]">data/biodata.json</code> to GitHub. Vercel then
              rebuilds the site, so the public page updates a moment later — not instantly.
            </p>
          </div>
        </aside>

        {/* ---------------- Mobile drawer ---------------- */}
        <AnimatePresence>
          {drawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" data-admin-chrome>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
                aria-hidden
              />

              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Dashboard menu"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                className="absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] overflow-y-auto border-r border-line bg-surface p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-display text-lg font-semibold text-charcoal">Dashboard</p>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close menu"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-charcoal"
                  >
                    <X aria-hidden className="h-4 w-4" />
                  </button>
                </div>

                <SidebarLinks onNavigate={() => setDrawerOpen(false)} />

                <Link
                  to="/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-charcoal/5 hover:text-charcoal"
                >
                  <ExternalLink aria-hidden className="h-4 w-4 text-subtle" />
                  Public Website
                </Link>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ---------------- Content ---------------- */}
        <main className="min-w-0 flex-1">
          {loadState === 'loading' || loadState === 'idle' ? (
            <LoadingState message="Loading biodata from GitHub…" />
          ) : loadState === 'error' ? (
            <ErrorState
              title="Unable to load the biodata."
              message={loadError ?? 'Please try again.'}
              onRetry={() => void reload()}
            />
          ) : (
            <div
              className={cn(
                'gap-5 px-4 py-6 sm:px-6',
                showPreviewPane && 'grid grid-cols-1 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]',
              )}
            >
              <div className="min-w-0">
                <Outlet />
              </div>

              {showPreviewPane && draft && (
                <div className="hidden min-w-0 xl:block">
                  <div className="sticky top-[5.5rem] h-[calc(100dvh-11rem)]">
                    <LivePreview biodata={draft} isDirty={isDirty} className="h-full" />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {loadState === 'ready' && <PublishBar />}
    </div>
  );
}

export default AdminLayout;
