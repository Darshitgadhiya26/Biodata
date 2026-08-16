import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export function NotFoundPage() {
  useDocumentMeta({ title: 'Page not found | Marriage Biodata' });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-display text-4xl font-semibold text-charcoal">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you are looking for does not exist or has been moved.
      </p>

      <Link
        to="/"
        className="mt-2 inline-flex h-11 items-center rounded-full bg-charcoal px-6 text-sm font-medium text-ivory shadow-card transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      >
        Back to biodata
      </Link>
    </main>
  );
}

export default NotFoundPage;
