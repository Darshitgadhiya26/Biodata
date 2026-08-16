import { useState } from 'react';
import { Download, Eye, EyeOff, Link2, RotateCcw, Share2 } from 'lucide-react';
import { useAdminBundle } from '@/layouts/AdminLayout';
import { useResetBiodata, useSetPublished } from '@/hooks/useBiodata';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/hooks/useTheme';
import { getPublicBiodataUrl } from '@/lib/env';
import { errorMessage } from '@/services/errors';
import { copyLink, shareBiodata } from '@/utils/share';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QrCode, generateQrPng } from '@/components/ui/QrCode';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function SettingsPage() {
  const { biodata } = useAdminBundle();
  const { user } = useAuth();
  const toast = useToast();
  const { mode } = useTheme();

  const resetBiodata = useResetBiodata();
  const setPublished = useSetPublished();

  const [confirmReset, setConfirmReset] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const publicUrl = getPublicBiodataUrl();

  const handleReset = async () => {
    try {
      await resetBiodata.mutateAsync(biodata.id);
      setConfirmReset(false);
      toast.success('Biodata reset', 'All details were restored to the original information.');
    } catch (error) {
      toast.error('Unable to reset the biodata. Please try again.', errorMessage(error));
    }
  };

  const handleTogglePublished = async () => {
    try {
      await setPublished.mutateAsync({ id: biodata.id, isPublished: !biodata.is_published });
      toast.success(
        biodata.is_published ? 'Biodata hidden from visitors' : 'Biodata published',
        biodata.is_published
          ? 'The public page now shows an empty state.'
          : 'Anyone with the link can view it again.',
      );
    } catch (error) {
      toast.error('Unable to change visibility. Please try again.', errorMessage(error));
    }
  };

  const handleDownloadQr = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await generateQrPng(publicUrl, 1024);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${biodata.name.replace(/\s+/g, '-').toLowerCase()}-biodata-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('QR code downloaded');
    } catch (error) {
      toast.error('Unable to generate the QR code.', errorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const result = await shareBiodata({ name: biodata.name, url: publicUrl });
    if (result === 'copied') toast.success('Link copied!', publicUrl);
    else if (result === 'unavailable') toast.error('Unable to share', 'Please copy the link manually.');
  };

  const handleCopy = async () => {
    const copied = await copyLink(publicUrl);
    if (copied) toast.success('Link copied!', publicUrl);
    else toast.error('Unable to copy the link.');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">Settings</h1>
        <p className="mt-1.5 text-sm text-muted">Account, appearance, sharing and data.</p>
      </header>

      {/* ---- Account ---- */}
      <section className="rounded-3xl border border-line bg-surface-raised p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-charcoal">Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-muted">Signed in as</dt>
            <dd className="font-medium text-charcoal">{user?.email ?? '—'}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-muted">Authentication</dt>
            <dd className="font-medium text-charcoal">Supabase Auth</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-subtle">
          Passwords are managed by Supabase. To change yours, use Authentication → Users in the Supabase
          dashboard.
        </p>
      </section>

      {/* ---- Appearance ---- */}
      <section className="rounded-3xl border border-line bg-surface-raised p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-charcoal">Appearance</h2>
        <p className="mt-1 text-sm text-muted">
          Applies to this browser only. Currently: <span className="font-medium text-charcoal">{mode}</span>.
        </p>
        <ThemeToggle className="mt-4" />
      </section>

      {/* ---- Sharing & QR ---- */}
      <section className="rounded-3xl border border-line bg-surface-raised p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-charcoal">Share &amp; QR code</h2>
        <p className="mt-1 break-all text-xs text-subtle">{publicUrl}</p>

        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
          <QrCode
            value={publicUrl}
            size={160}
            label={`QR code linking to the marriage biodata of ${biodata.name}`}
            className="mx-auto sm:mx-0"
          />

          <div className="flex-1 space-y-2">
            <p className="text-center text-sm font-medium text-charcoal sm:text-left">Scan to view biodata</p>

            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button size="sm" variant="secondary" leadingIcon={<Share2 className="h-3.5 w-3.5" />} onClick={() => void handleShare()}>
                Share
              </Button>
              <Button size="sm" variant="secondary" leadingIcon={<Link2 className="h-3.5 w-3.5" />} onClick={() => void handleCopy()}>
                Copy Link
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leadingIcon={<Download className="h-3.5 w-3.5" />}
                onClick={() => void handleDownloadQr()}
                isLoading={isDownloading}
                loadingText="Preparing…"
              >
                Download QR
              </Button>
            </div>

            <p className="text-center text-[0.7rem] leading-relaxed text-subtle sm:text-left">
              Set <code>VITE_SITE_URL</code> in Vercel so this always points at your production address.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Visibility ---- */}
      <section className="rounded-3xl border border-line bg-surface-raised p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-charcoal">Visibility</h2>
        <p className="mt-1 text-sm text-muted">
          {biodata.is_published
            ? 'The biodata is visible to anyone with the link.'
            : 'The biodata is hidden. Visitors see an empty state.'}
        </p>

        <Button
          variant="secondary"
          className="mt-4"
          leadingIcon={biodata.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          onClick={() => void handleTogglePublished()}
          isLoading={setPublished.isPending}
          loadingText="Updating…"
        >
          {biodata.is_published ? 'Hide from visitors' : 'Publish biodata'}
        </Button>
      </section>

      {/* ---- Danger zone ---- */}
      <section className="rounded-3xl border border-danger/30 bg-danger/[0.03] p-6">
        <h2 className="font-display text-lg font-semibold text-charcoal">Reset to Default</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Restores every field, all hobbies and all maternal relatives to the original biodata information. Your
          uploaded profile photo is kept.
        </p>

        <Button
          variant="danger"
          className="mt-4"
          leadingIcon={<RotateCcw className="h-4 w-4" />}
          onClick={() => setConfirmReset(true)}
        >
          Reset to Default
        </Button>
      </section>

      <ConfirmDialog
        open={confirmReset}
        destructive
        title="Reset all biodata to the original information?"
        description="Every edit you have made to the details, hobbies and maternal relatives will be replaced. This cannot be undone."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        isBusy={resetBiodata.isPending}
        onConfirm={() => void handleReset()}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

export default SettingsPage;
