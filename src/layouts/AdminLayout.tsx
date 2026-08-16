import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  Camera,
  ExternalLink,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  Settings,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBiodata, useCreateBiodata } from '@/hooks/useBiodata';
import { useHobbies } from '@/hooks/useHobbies';
import { useMaternalRelatives } from '@/hooks/useMaternal';
import { useRealtimeBiodata } from '@/hooks/useRealtimeBiodata';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useToast } from '@/hooks/useToast';
import { errorMessage } from '@/services/errors';
import type { BiodataBundle } from '@/types';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { ThemeToggleButton } from '@/components/ui/ThemeToggle';
import { cn } from '@/utils/cn';

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
  { to: '/admin/photo', label: 'Photo', Icon: Camera },
  { to: '/admin/settings', label: 'Settings', Icon: Settings },
];

/** Typed access to the data the layout has already loaded. */
export function useAdminBundle(): BiodataBundle {
  return useOutletContext<BiodataBundle>();
}

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
 * Admin shell: persistent sidebar on desktop, a slide-over drawer on mobile.
 *
 * Deliberately functional and quiet — the opposite of the public page — so the
 * two never feel like the same surface.
 */
export function AdminLayout() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const biodataQuery = useBiodata();
  const biodata = biodataQuery.data ?? null;
  const hobbiesQuery = useHobbies(biodata?.id);
  const maternalQuery = useMaternalRelatives(biodata?.id);
  const createBiodata = useCreateBiodata();

  useRealtimeBiodata(biodata?.id);
  useDocumentMeta({ title: 'Admin Dashboard | Marriage Biodata' });

  // Close the drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

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

  const handleSeed = async () => {
    try {
      await createBiodata.mutateAsync();
      toast.success('Biodata created', 'The original details were added to your database.');
    } catch (error) {
      toast.error('Unable to create the biodata.', errorMessage(error));
    }
  };

  const bundle: BiodataBundle | null = biodata
    ? {
        biodata,
        hobbies: hobbiesQuery.data ?? [],
        maternalRelatives: maternalQuery.data ?? [],
      }
    : null;

  return (
    <div className="min-h-dvh bg-ivory">
      {/* ---------------- Top bar ---------------- */}
      <header
        data-admin-chrome
        className="sticky top-0 z-40 border-b border-line bg-ivory/85 backdrop-blur-xl"
      >
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
                {biodata?.name ?? 'Marriage Biodata'}
              </p>
              <p className="truncate text-[0.7rem] text-subtle">{user?.email ?? 'Administrator'}</p>
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

      <div className="flex">
        {/* ---------------- Desktop sidebar ---------------- */}
        <aside
          data-admin-chrome
          className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-line bg-surface p-4 lg:block"
        >
          <SidebarLinks />

          <div className="mt-6 rounded-2xl border border-line bg-surface-raised p-4">
            <p className="text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">Live sync</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Saved changes appear on the public website immediately — no redeployment needed.
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
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {biodataQuery.isLoading ? (
            <LoadingState message="Loading biodata…" />
          ) : biodataQuery.isError ? (
            <ErrorState
              title="Unable to load biodata."
              message={errorMessage(biodataQuery.error, 'Please try again.')}
              onRetry={() => void biodataQuery.refetch()}
              isRetrying={biodataQuery.isFetching}
            />
          ) : !bundle ? (
            <div className="mx-auto max-w-md rounded-3xl border border-dashed border-line p-8 text-center">
              <h2 className="font-display text-2xl font-semibold text-charcoal">No biodata yet</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Your database has no biodata row. Create it from the original details, then edit anything you
                like. (Running <code className="text-xs">supabase/seed.sql</code> does the same thing.)
              </p>
              <Button
                variant="gold"
                className="mt-5"
                onClick={() => void handleSeed()}
                isLoading={createBiodata.isPending}
                loadingText="Creating…"
              >
                Create biodata
              </Button>
            </div>
          ) : (
            <Outlet context={bundle} />
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
