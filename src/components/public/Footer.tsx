import { Link } from 'react-router-dom';

/** Quiet close to the document, with an unobtrusive way into the dashboard. */
export function Footer({ name }: { name: string }) {
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

        <Link
          to="/admin"
          className="no-print mt-2 text-[0.7rem] text-subtle underline-offset-4 transition-colors hover:text-gold hover:underline"
        >
          Admin
        </Link>
      </div>
    </footer>
  );
}
