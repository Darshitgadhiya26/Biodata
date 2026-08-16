import { Link } from 'react-router-dom';
import { formatRelativeTime } from '@/utils/format';

interface FooterProps {
  name: string;
  updatedAt?: string | null;
}

export function Footer({ name, updatedAt }: FooterProps) {
  return (
    <footer className="border-t border-line py-10 print-tight">
      <div className="container-luxe flex flex-col items-center gap-3 text-center">
        <div aria-hidden className="flex items-center gap-2">
          <span className="h-px w-8 bg-gold/40" />
          <span className="h-1 w-1 rotate-45 bg-gold/70" />
          <span className="h-px w-8 bg-gold/40" />
        </div>

        <p className="font-display text-lg font-medium text-charcoal">{name}</p>
        <p className="text-xs uppercase tracking-wideish text-subtle">Marriage Biodata</p>

        {updatedAt && (
          <p className="text-[0.7rem] text-subtle">Last updated {formatRelativeTime(updatedAt)}</p>
        )}

        <Link
          to="/login"
          className="no-print mt-2 text-[0.7rem] text-subtle underline-offset-4 transition-colors hover:text-gold hover:underline"
        >
          Admin
        </Link>
      </div>
    </footer>
  );
}
