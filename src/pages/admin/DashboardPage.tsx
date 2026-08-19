import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Camera,
  ExternalLink,
  FileJson,
  GitBranch,
  GraduationCap,
  Heart,
  Palette,
  Phone,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDraft, useDraftData } from '@/hooks/useDraft';
import { formatRelativeTime } from '@/utils/format';

interface Shortcut {
  to: string;
  label: string;
  summary: string;
  Icon: LucideIcon;
}

/** Landing page of the dashboard: what is where, and what is unpublished. */
export function DashboardPage() {
  const { isDirty, repo, branch, lastCommitAt, fileUrl } = useDraft();
  const biodata = useDraftData();

  const shortcuts: Shortcut[] = [
    { to: '/admin/personal', label: 'Personal', summary: biodata.personal.name, Icon: User },
    { to: '/admin/family', label: 'Family', summary: biodata.family.fatherName, Icon: Users },
    {
      to: '/admin/maternal',
      label: 'Maternal',
      summary: `${biodata.maternal.relatives.length} relative${biodata.maternal.relatives.length === 1 ? '' : 's'}`,
      Icon: Heart,
    },
    { to: '/admin/education', label: 'Education', summary: biodata.education.degree, Icon: GraduationCap },
    { to: '/admin/career', label: 'Career', summary: biodata.career.job, Icon: Briefcase },
    {
      to: '/admin/hobbies',
      label: 'Hobbies',
      summary: biodata.hobbies.join(', ') || 'None yet',
      Icon: Sparkles,
    },
    { to: '/admin/contact', label: 'Contact', summary: biodata.contact.phone, Icon: Phone },
    { to: '/admin/photo', label: 'Profile Photo', summary: biodata.profilePhoto, Icon: Camera },
    { to: '/admin/appearance', label: 'Appearance', summary: `${biodata.theme.mode} · ${biodata.theme.accent}`, Icon: Palette },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-line bg-surface-raised p-5 sm:p-7">
        <h1 className="font-display text-2xl font-semibold text-charcoal">Dashboard</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          This dashboard is an editor for a single file — <code className="text-xs">data/biodata.json</code> — in your
          GitHub repository. There is no database behind it.
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <dt className="text-[0.62rem] font-medium uppercase tracking-wideish text-subtle">Repository</dt>
            <dd className="mt-1 flex items-center gap-1.5 truncate text-sm font-medium text-charcoal">
              <GitBranch aria-hidden className="h-3.5 w-3.5 shrink-0 text-gold" />
              {repo ?? '—'}
            </dd>
            <dd className="mt-0.5 text-xs text-subtle">Branch: {branch ?? 'main'}</dd>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4">
            <dt className="text-[0.62rem] font-medium uppercase tracking-wideish text-subtle">Last published</dt>
            <dd className="mt-1 text-sm font-medium text-charcoal">{formatRelativeTime(lastCommitAt)}</dd>
            <dd className="mt-0.5 text-xs text-subtle">Most recent commit to the JSON file.</dd>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4">
            <dt className="text-[0.62rem] font-medium uppercase tracking-wideish text-subtle">Draft status</dt>
            <dd className="mt-1 text-sm font-medium text-charcoal">
              {isDirty ? 'Unpublished changes' : 'Everything published'}
            </dd>
            <dd className="mt-0.5 text-xs text-subtle">
              {isDirty ? 'Use Publish Changes to commit them.' : 'The editor matches GitHub.'}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-3 text-xs">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-gold underline-offset-4 hover:underline"
          >
            <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            Open the public website
          </Link>

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-gold underline-offset-4 hover:underline"
            >
              <FileJson aria-hidden className="h-3.5 w-3.5" />
              View biodata.json on GitHub
            </a>
          )}
        </div>
      </section>

      {/* ---- How publishing works ---- */}
      <section className="rounded-3xl border border-line bg-surface-raised p-5 sm:p-7">
        <h2 className="font-display text-lg font-semibold text-charcoal">How publishing works</h2>
        <ol className="mt-4 space-y-2.5">
          {[
            'Edit any section — the preview updates as you type.',
            'Click Publish Changes.',
            'The change is committed to data/biodata.json in GitHub.',
            'Vercel notices the commit and starts a deployment.',
            'When that build finishes, the public website shows the new details.',
          ].map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm text-muted">
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/12 text-[0.65rem] font-semibold text-gold"
              >
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-subtle">
          The site is rebuilt on every publish, so updates appear after the deployment finishes rather than instantly.
        </p>
      </section>

      {/* ---- Sections ---- */}
      <section className="rounded-3xl border border-line bg-surface-raised p-5 sm:p-7">
        <h2 className="font-display text-lg font-semibold text-charcoal">Sections</h2>

        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {shortcuts.map(({ to, label, summary, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:border-gold/50"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold"
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-charcoal">{label}</span>
                  <span className="block truncate text-xs text-subtle">{summary || '—'}</span>
                </span>

                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-gold"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default DashboardPage;
