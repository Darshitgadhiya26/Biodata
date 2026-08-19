import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDraft, useDraftData } from '@/hooks/useDraft';
import { BiodataView } from '@/components/public/BiodataView';

/**
 * Full-width preview of the draft, exactly as a visitor would see it — the
 * mobile equivalent of the side-by-side preview pane, and a last look before
 * publishing.
 */
export function PreviewPage() {
  const { isDirty } = useDraft();
  const biodata = useDraftData();

  return (
    <div className="space-y-4">
      <div
        data-admin-chrome
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface-raised px-4 py-3"
      >
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-charcoal"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to the editor
        </Link>

        <p className="text-xs text-subtle">
          {isDirty
            ? 'Showing your unpublished draft — visitors still see the published version.'
            : 'Showing the published version.'}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-ivory">
        <BiodataView biodata={biodata} still />
      </div>
    </div>
  );
}

export default PreviewPage;
