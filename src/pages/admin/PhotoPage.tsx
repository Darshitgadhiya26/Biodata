import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Save, Trash2, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminBundle } from '@/layouts/AdminLayout';
import { useUpdateBiodata } from '@/hooks/useBiodata';
import { useToast } from '@/hooks/useToast';
import { errorMessage } from '@/services/errors';
import { deleteProfilePhotoQuietly, uploadProfilePhoto } from '@/services/storageService';
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ImageValidationError,
  processImageForUpload,
  type ProcessedImage,
} from '@/utils/image';
import { formatBytes } from '@/utils/format';
import { DEFAULT_PROFILE_PHOTO_URL } from '@/data/defaults';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProfilePhoto } from '@/components/public/ProfilePhoto';

/**
 * Profile photo management: preview before upload, real upload progress,
 * replace, and delete. Images are compressed in the browser first; only the
 * resulting public Storage URL is written to Postgres — never the bytes.
 */
export function PhotoPage() {
  const { biodata } = useAdminBundle();
  const toast = useToast();
  const updateBiodata = useUpdateBiodata();

  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Object URLs must be released or the tab leaks memory on repeated picks.
  useEffect(() => {
    return () => {
      if (selected) URL.revokeObjectURL(selected.previewUrl);
    };
  }, [selected]);

  const clearSelection = () => {
    if (selected) URL.revokeObjectURL(selected.previewUrl);
    setSelected(null);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const processed = await processImageForUpload(file);
      if (selected) URL.revokeObjectURL(selected.previewUrl);
      setSelected(processed);
    } catch (error) {
      const message =
        error instanceof ImageValidationError ? error.message : errorMessage(error, 'Could not read that image.');
      toast.error('That image cannot be used', message);
      if (inputRef.current) inputRef.current.value = '';
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;

    setIsUploading(true);
    setProgress(0);
    const previousPath = biodata.profile_photo_path;

    try {
      const uploaded = await uploadProfilePhoto(selected.file, setProgress);

      await updateBiodata.mutateAsync({
        id: biodata.id,
        patch: { profile_photo_url: uploaded.publicUrl, profile_photo_path: uploaded.path },
      });

      // Only remove the old object once the new URL is safely persisted.
      await deleteProfilePhotoQuietly(previousPath);

      clearSelection();
      toast.success('Changes saved successfully', 'The new photo is live on the public website.');
    } catch (error) {
      toast.error('Unable to save changes. Please try again.', errorMessage(error));
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const previousPath = biodata.profile_photo_path;

    try {
      await updateBiodata.mutateAsync({
        id: biodata.id,
        // Fall back to the photo bundled with the app rather than leaving a gap.
        patch: { profile_photo_url: DEFAULT_PROFILE_PHOTO_URL, profile_photo_path: null },
      });
      await deleteProfilePhotoQuietly(previousPath);

      setConfirmDelete(false);
      toast.success('Photo removed', 'The original bundled photo is shown again.');
    } catch (error) {
      toast.error('Unable to delete the photo. Please try again.', errorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const isBusy = isUploading || isProcessing || isDeleting;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">Profile Photo</h1>
        <p className="mt-1.5 text-sm text-muted">
          JPEG, PNG or WEBP up to 5 MB. Large images are resized and compressed automatically before upload.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ---- Current ---- */}
        <section className="rounded-3xl border border-line bg-surface-raised p-6 text-center shadow-card">
          <h2 className="text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">
            Current Profile Photo
          </h2>

          <div className="mt-6 flex justify-center">
            <ProfilePhoto src={biodata.profile_photo_url} name={biodata.name} size="md" still />
          </div>

          <p className="mt-6 break-all text-[0.7rem] text-subtle">
            {biodata.profile_photo_url ?? 'No photo set'}
          </p>

          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            leadingIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setConfirmDelete(true)}
            disabled={isBusy || !biodata.profile_photo_path}
          >
            Delete uploaded photo
          </Button>

          {!biodata.profile_photo_path && (
            <p className="mt-2 text-[0.7rem] text-subtle">Currently using the photo bundled with the site.</p>
          )}
        </section>

        {/* ---- Upload ---- */}
        <section className="rounded-3xl border border-line bg-surface-raised p-6 shadow-card">
          <h2 className="text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">Upload New Photo</h2>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_EXTENSIONS}
            className="sr-only"
            id="photo-input"
            onChange={(event) => void handleFile(event.target.files?.[0])}
            disabled={isBusy}
          />

          {selected ? (
            <div className="mt-5">
              <div className="flex justify-center">
                <ProfilePhoto src={selected.previewUrl} name="New photo preview" size="md" still />
              </div>

              <dl className="mt-5 space-y-1 text-center text-xs text-muted">
                <div>
                  <dt className="sr-only">Dimensions</dt>
                  <dd>
                    {selected.width} × {selected.height} px
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Size</dt>
                  <dd>
                    {formatBytes(selected.bytes)}
                    {selected.bytes < selected.originalBytes && (
                      <span className="text-success">
                        {' '}
                        (compressed from {formatBytes(selected.originalBytes)})
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              {progress !== null && (
                <div className="mt-5">
                  <div
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Upload progress"
                    className="h-2 w-full overflow-hidden rounded-full bg-line"
                  >
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-gold-soft to-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                  <p className="mt-1.5 text-center text-xs text-muted">Uploading… {progress}%</p>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="gold"
                  fullWidth
                  leadingIcon={<Save className="h-4 w-4" />}
                  onClick={() => void handleSave()}
                  isLoading={isUploading}
                  loadingText="Uploading…"
                >
                  Save Photo
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  leadingIcon={<X className="h-4 w-4" />}
                  onClick={clearSelection}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="photo-input"
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                void handleFile(event.dataTransfer.files?.[0]);
              }}
              className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                dragActive ? 'border-gold bg-gold/5' : 'border-line hover:border-gold/60 hover:bg-gold/[0.03]'
              }`}
            >
              <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold"
              >
                {isProcessing ? <ImageIcon className="h-5 w-5 animate-pulse" /> : <Upload className="h-5 w-5" />}
              </span>

              <span className="text-sm font-medium text-charcoal">
                {isProcessing ? 'Preparing image…' : 'Choose or drop an image'}
              </span>
              <span className="text-xs text-subtle">JPEG, PNG or WEBP · up to 5 MB</span>
            </label>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        destructive
        title="Delete the uploaded photo?"
        description="The biodata will fall back to the photo bundled with the site. You can upload a new one at any time."
        confirmLabel="Delete photo"
        isBusy={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export default PhotoPage;
