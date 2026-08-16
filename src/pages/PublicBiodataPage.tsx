import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DatabaseZap } from 'lucide-react';
import { useBiodata } from '@/hooks/useBiodata';
import { useHobbies } from '@/hooks/useHobbies';
import { useMaternalRelatives } from '@/hooks/useMaternal';
import { useRealtimeBiodata } from '@/hooks/useRealtimeBiodata';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useToast } from '@/hooks/useToast';
import { getPublicBiodataUrl, getSiteUrl } from '@/lib/env';
import { SUPABASE_READY } from '@/lib/supabase';
import { errorMessage } from '@/services/errors';
import { shareBiodata } from '@/utils/share';
import { toInlineAddress } from '@/utils/format';
import { Navbar } from '@/components/public/Navbar';
import { BiodataView } from '@/components/public/BiodataView';
import { ShareSection } from '@/components/public/ShareSection';
import { Footer } from '@/components/public/Footer';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * The public marriage biodata.
 *
 * Requires no authentication and reads everything from Supabase on each load,
 * so an edit made in the dashboard is visible here on any device without a
 * rebuild or redeploy.
 */
export function PublicBiodataPage() {
  const toast = useToast();

  const biodataQuery = useBiodata();
  const biodata = biodataQuery.data ?? null;

  const hobbiesQuery = useHobbies(biodata?.id);
  const maternalQuery = useMaternalRelatives(biodata?.id);

  useRealtimeBiodata(biodata?.id);

  const name = biodata?.name ?? 'Marriage Biodata';
  const location = toInlineAddress(biodata?.address);

  useDocumentMeta({
    title: biodata ? `${name} | Marriage Biodata` : 'Marriage Biodata',
    description: biodata
      ? `Digital marriage biodata of ${name}.${location ? ` ${location}.` : ''}`
      : 'Digital marriage biodata.',
    image: biodata?.profile_photo_url
      ? biodata.profile_photo_url.startsWith('http')
        ? biodata.profile_photo_url
        : `${getSiteUrl()}${biodata.profile_photo_url}`
      : undefined,
    canonical: getPublicBiodataUrl(),
  });

  const handleShare = useCallback(async () => {
    const result = await shareBiodata({ name, url: getPublicBiodataUrl() });

    if (result === 'copied') toast.success('Link copied!', getPublicBiodataUrl());
    else if (result === 'unavailable') {
      toast.error('Unable to share', 'Please copy the address from your browser instead.');
    }
  }, [name, toast]);

  // ---- Configuration missing -------------------------------------------------
  if (!SUPABASE_READY) {
    return (
      <main className="min-h-dvh">
        <ErrorState
          title="This biodata is not connected yet."
          message="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the environment, then reload the page. See README.md for the full setup."
        />
      </main>
    );
  }

  // ---- Loading ---------------------------------------------------------------
  if (biodataQuery.isLoading) {
    return (
      <main className="min-h-dvh">
        <LoadingState message="Loading biodata…" />
      </main>
    );
  }

  // ---- Error -----------------------------------------------------------------
  if (biodataQuery.isError) {
    return (
      <main className="min-h-dvh">
        <ErrorState
          title="Unable to load biodata."
          message={errorMessage(biodataQuery.error, 'Please try again.')}
          onRetry={() => void biodataQuery.refetch()}
          isRetrying={biodataQuery.isFetching}
        />
      </main>
    );
  }

  // ---- Empty (database not seeded) -------------------------------------------
  if (!biodata) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <EmptyState
          className="max-w-md"
          title="No biodata published yet"
          message="Once the biodata is added from the admin dashboard, it will appear here."
          icon={<DatabaseZap className="h-5 w-5" />}
          action={
            <Link
              to="/admin"
              className="mt-2 inline-flex h-9 items-center rounded-full border border-line bg-surface-raised px-4 text-[0.8rem] font-medium text-charcoal transition-colors hover:border-gold/60 hover:bg-gold/5"
            >
              Open admin dashboard
            </Link>
          }
        />
      </main>
    );
  }

  // ---- Loaded ----------------------------------------------------------------
  return (
    <div className="min-h-dvh bg-ivory">
      <Navbar name={name} onShare={() => void handleShare()} />

      <main id="main-content">
        <BiodataView
          biodata={biodata}
          hobbies={hobbiesQuery.data ?? []}
          maternalRelatives={maternalQuery.data ?? []}
        />

        <ShareSection name={name} onShare={() => void handleShare()} />
      </main>

      <Footer name={name} updatedAt={biodata.updated_at} />
    </div>
  );
}

export default PublicBiodataPage;
