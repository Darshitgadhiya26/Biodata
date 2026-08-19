import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export function NotFoundPage() {
  useDocumentMeta({ title: 'Page not found | Marriage Biodata' });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-ivory px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">This page does not exist</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        The link may be mistyped, or the page may have been removed.
      </p>
      <Link
        to="/"
        className="inline-flex h-12 items-center justify-center rounded-full bg-charcoal px-7 text-sm font-medium text-ivory shadow-card transition-transform hover:-translate-y-0.5"
      >
        Back to the biodata
      </Link>
    </main>
  );
}

export default NotFoundPage;
