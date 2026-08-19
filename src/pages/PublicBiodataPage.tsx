import { useCallback } from 'react';
import type { Biodata } from '@/types';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useToast } from '@/hooks/useToast';
import { BIODATA_FILE } from '@/utils/biodata';
import { humanizePath, toInlineAddress } from '@/utils/format';
import { getPublicBiodataUrl, toAbsoluteUrl } from '@/utils/site';
import { shareBiodata } from '@/utils/share';
import { Navbar } from '@/components/public/Navbar';
import { BiodataView } from '@/components/public/BiodataView';
import { ShareSection } from '@/components/public/ShareSection';
import { Footer } from '@/components/public/Footer';

/**
 * The public marriage biodata.
 *
 * All values come from `data/biodata.json`, which is bundled at build time —
 * so there is no fetch, no spinner and no database between a visitor and the
 * content.
 */
export function PublicBiodataPage({ biodata }: { biodata: Biodata }) {
  const toast = useToast();
  const { personal, career, education } = biodata;

  useDocumentMeta({
    title: `${personal.name} | Marriage Biodata`,
    description: `Digital marriage biodata of ${personal.name} — ${[
      education.degree,
      career.job,
      toInlineAddress(biodata.contact.address),
    ]
      .filter(Boolean)
      .join(', ')}.`,
    image: toAbsoluteUrl('/og-image.jpg'),
    canonical: getPublicBiodataUrl(),
  });

  const handleShare = useCallback(async () => {
    const result = await shareBiodata({ name: personal.name });

    if (result === 'copied') {
      toast.success('Link copied!', getPublicBiodataUrl());
    } else if (result === 'unavailable') {
      toast.error('Unable to share.', 'Please copy the link from the address bar.');
    }
  }, [personal.name, toast]);

  return (
    <div className="min-h-dvh bg-ivory">
      <Navbar name={personal.name} onShare={() => void handleShare()} />

      <main id="main">
        <BiodataView biodata={biodata} />
        <ShareSection name={personal.name} onShare={() => void handleShare()} />
      </main>

      <Footer name={personal.name} />
    </div>
  );
}

/**
 * Shown when `data/biodata.json` has been hand-edited into a shape the schema
 * rejects. It names the offending fields rather than rendering a broken page.
 */
export function InvalidBiodataPage({ issues }: { issues: Array<{ path: string; message: string }> }) {
  useDocumentMeta({ title: 'Marriage Biodata' });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ivory px-5 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-surface-raised p-8 shadow-card">
        <h1 className="font-display text-2xl font-semibold text-charcoal">This biodata could not be displayed</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <code className="rounded bg-charcoal/5 px-1.5 py-0.5 text-xs">{BIODATA_FILE}</code> does not match the
          expected structure. Fix the fields below in the repository (or from the admin dashboard) and the site
          will rebuild.
        </p>

        <ul className="mt-5 space-y-2">
          {issues.map((issue) => (
            <li key={`${issue.path}-${issue.message}`} className="rounded-xl border border-danger/30 bg-danger/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wideish text-danger">
                {humanizePath(issue.path)}
              </p>
              <p className="mt-1 text-sm text-charcoal">{issue.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default PublicBiodataPage;
