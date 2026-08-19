import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, GitCommit, ImageUp, UploadCloud } from 'lucide-react';
import { useDraft, useDraftData } from '@/hooks/useDraft';
import { useToast } from '@/hooks/useToast';
import { errorMessage, uploadProfileImage } from '@/utils/api';
import { formatBytes } from '@/utils/format';
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ImageValidationError,
  processImageForUpload,
  type ProcessedImage,
} from '@/utils/image';
import { EditorPanel } from '@/components/admin/EditorPanel';
import { Button } from '@/components/ui/Button';
import { ProfilePhoto } from '@/components/public/ProfilePhoto';

/**
 * Commits a new portrait to `public/images/` and points `profilePhoto` at it.
 *
 * The image is resized in the browser first, then sent to
 * `/api/github/upload-image`, which is the only thing that ever touches the
 * repository. Images are never embedded in biodata.json — only the path is.
 */
export function PhotoPage() {
  const { update, saved } = useDraft();
  const biodata = useDraftData();
  const toast = useToast();

  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<ProcessedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [committed, setCommitted] = useState<{ path: string; commitUrl: string | null } | null>(null);

  // Object URLs must be released or they leak for the life of the tab.
  useEffect(() => {
    return () => {
      if (selected) URL.revokeObjectURL(selected.previewUrl);
    };
  }, [selected]);

  const handleChoose = async (file: File | undefined) => {
    if (!file) return;
    setCommitted(null);

    try {
      const processed = await processImageForUpload(file);
      setSelected((previous) => {
        if (previous) URL.revokeObjectURL(previous.previewUrl);
        return processed;
      });
    } catch (error) {
      if (error instanceof ImageValidationError) {
        toast.error('That image cannot be used.', error.message);
      } else {
        toast.error('That image could not be read.', errorMessage(error));
      }
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handlePublishPhoto = async () => {
    if (!selected) return;
    setIsUploading(true);

    try {
      const result = await uploadProfileImage(selected.file);

      // Point the draft at the committed file. When the path is unchanged the
      // JSON needs no edit at all — the new image is already live-on-rebuild.
      update((current) => ({ ...current, profilePhoto: result.profilePhoto }));
      setCommitted({ path: result.profilePhoto, commitUrl: result.commitUrl });

      URL.revokeObjectURL(selected.previewUrl);
      setSelected(null);
      if (inputRef.current) inputRef.current.value = '';

      toast.success('Photo committed to GitHub.', 'Vercel is deploying the updated website.');
    } catch (error) {
      toast.error('The photo could not be published.', errorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const pathChanged = committed !== null && saved?.profilePhoto !== committed.path;

  return (
    <EditorPanel
      title="Profile Photo"
      description="The portrait at the top of the biodata."
      footnote="Committed to public/images/ in the repository. Only its path is stored in data/biodata.json — never the image itself."
    >
      <div className="space-y-7">
        {/* ---- Current ---- */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-charcoal">Current photo</h2>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center">
            <ProfilePhoto src={biodata.profilePhoto} name={biodata.personal.name} size="sm" still />
            <div className="min-w-0 text-center sm:text-left">
              <p className="break-all font-mono text-xs text-muted">{biodata.profilePhoto}</p>
              <p className="mt-1 text-xs text-subtle">Served from the repository's public folder.</p>
            </div>
          </div>
        </div>

        {/* ---- Choose ---- */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-charcoal">Upload a new photo</h2>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-5 py-8 text-center transition-colors hover:border-gold/60">
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/10 text-gold">
              <ImageUp className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-charcoal">Choose File</span>
            <span className="text-xs text-subtle">JPG, JPEG, PNG or WEBP · resized automatically before upload</span>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_EXTENSIONS}
              className="sr-only"
              onChange={(event) => void handleChoose(event.target.files?.[0])}
            />
          </label>
        </div>

        {/* ---- Preview + publish ---- */}
        {selected && (
          <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
              <Camera aria-hidden className="h-4 w-4 text-gold" />
              Preview
            </h2>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ProfilePhoto src={selected.previewUrl} name={biodata.personal.name} size="sm" still />

              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm text-charcoal">
                  {selected.width} × {selected.height} px · {formatBytes(selected.bytes)}
                </p>
                {selected.bytes < selected.originalBytes && (
                  <p className="mt-1 text-xs text-muted">
                    Compressed from {formatBytes(selected.originalBytes)} before upload.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="gold"
                onClick={() => void handlePublishPhoto()}
                isLoading={isUploading}
                loadingText="Publishing…"
                leadingIcon={<UploadCloud className="h-4 w-4" />}
              >
                Publish Photo
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  URL.revokeObjectURL(selected.previewUrl);
                  setSelected(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted">
              Publishing the photo commits the image to GitHub straight away and starts a Vercel deployment.
            </p>
          </div>
        )}

        {/* ---- Result ---- */}
        {committed && (
          <div role="status" className="rounded-2xl border border-success/40 bg-success/5 p-4 text-sm text-charcoal">
            <p className="flex items-start gap-2.5">
              <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>
                <strong className="font-semibold">Photo published to {committed.path}.</strong>{' '}
                {pathChanged
                  ? 'The image format changed, so the path in biodata.json changed too — use “Publish Changes” below to save it.'
                  : 'Vercel is deploying the updated website.'}
                {committed.commitUrl && (
                  <>
                    {' '}
                    <a
                      href={committed.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-gold underline-offset-4 hover:underline"
                    >
                      <GitCommit aria-hidden className="h-3.5 w-3.5" />
                      View the commit
                    </a>
                  </>
                )}
              </span>
            </p>
          </div>
        )}
      </div>
    </EditorPanel>
  );
}

export default PhotoPage;
