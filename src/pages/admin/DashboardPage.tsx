import { Link } from 'react-router-dom';
import {
  Briefcase,
  Camera,
  Clock,
  ExternalLink,
  Heart,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminBundle } from '@/layouts/AdminLayout';
import { formatRelativeTime, formatTimestamp } from '@/utils/format';
import { ProfilePhoto } from '@/components/public/ProfilePhoto';

interface QuickAction {
  to: string;
  label: string;
  Icon: LucideIcon;
  external?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { to: '/admin/personal', label: 'Edit Personal Info', Icon: User },
  { to: '/admin/photo', label: 'Change Photo', Icon: Camera },
  { to: '/admin/career', label: 'Edit Career', Icon: Briefcase },
  { to: '/', label: 'View Public Website', Icon: ExternalLink, external: true },
];

export function DashboardPage() {
  const { biodata, hobbies, maternalRelatives } = useAdminBundle();

  const stats = [
    { label: 'Hobbies', value: hobbies.length, Icon: Sparkles, to: '/admin/hobbies' },
    { label: 'Maternal Relatives', value: maternalRelatives.length, Icon: Heart, to: '/admin/maternal' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">Dashboard</h1>
        <p className="mt-1.5 text-sm text-muted">
          Everything you change here is stored in Supabase and appears on the public website immediately.
        </p>
      </header>

      {/* ---- Profile summary ---- */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-surface-raised p-6 text-center shadow-card sm:flex-row sm:items-center sm:text-left"
      >
        <ProfilePhoto src={biodata.profile_photo_url} name={biodata.name} size="sm" still />

        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">Profile</p>
          <h2 className="mt-1 truncate font-display text-2xl font-semibold text-charcoal">{biodata.name}</h2>

          <p className="mt-1.5 truncate text-sm text-muted">
            {[biodata.job_title, biodata.company].filter(Boolean).join(' · ') || 'No career details yet'}
          </p>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-subtle sm:justify-start">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            <span title={formatTimestamp(biodata.updated_at)}>
              Last updated {formatRelativeTime(biodata.updated_at)}
            </span>
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold ${
            biodata.is_published ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}
        >
          {biodata.is_published ? 'Published' : 'Hidden'}
        </span>
      </motion.section>

      {/* ---- Counts ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map(({ label, value, Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="group flex items-center gap-4 rounded-2xl border border-line bg-surface-raised p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover motion-reduce:hover:translate-y-0"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold"
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-3xl font-semibold leading-none text-charcoal">{value}</p>
              <p className="mt-1.5 text-xs uppercase tracking-wideish text-subtle">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ---- Quick actions ---- */}
      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="mb-3 text-sm font-semibold text-charcoal">
          Quick actions
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map(({ to, label, Icon, external }) => (
            <Link
              key={label}
              to={to}
              {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface-raised p-4 text-sm font-medium text-charcoal shadow-card transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-card-hover motion-reduce:hover:translate-y-0"
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0 text-gold" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
