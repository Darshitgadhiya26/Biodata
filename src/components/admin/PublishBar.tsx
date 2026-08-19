import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Eye, GitCommit, RefreshCw, Save, Undo2, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/types';
import { useDraft } from '@/hooks/useDraft';
import { useToast } from '@/hooks/useToast';
import { errorMessage } from '@/utils/api';
import { humanizePath } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

/**
 * The bar that turns a draft into a commit.
 *
 * It is also where the deployment model is explained honestly: publishing
 * writes to GitHub and Vercel then rebuilds, so the public site updates a
 * minute or so later — not instantly.
 */
export function PublishBar() {
  const { draft, isDirty, isValid, issues, isPublishing, hasConflict, publish, cancel, reload, saveDraftLocally } =
    useDraft();
  const toast = useToast();
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [published, setPublished] = useState<{ commitUrl: string | null } | null>(null);

  if (!draft) return null;

  const handlePublish = async () => {
    setConfirmOpen(false);
    setPublished(null);

    try {
      const result = await publish();
      setPublished(result);
      toast.success('Changes published successfully.', 'Vercel is deploying the updated website.');
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        toast.error('The biodata was changed elsewhere.', 'Reload the latest version before publishing.');
      } else if (error instanceof ApiError && error.issues.length > 0) {
        toast.error('That biodata is not valid.', `${humanizePath(error.issues[0].path)}: ${error.issues[0].message}`);
      } else {
        toast.error('Publishing failed.', errorMessage(error));
      }
    }
  };

  const handleSaveLocally = () => {
    if (saveDraftLocally()) {
      toast.success('Draft saved in this browser.', 'It is not published yet — GitHub still has the old version.');
    } else {
      toast.error('Could not save the draft locally.', 'Your browser may be blocking storage.');
    }
  };

  const blockingIssue = issues[0];

  return (
    <>
      <div
        data-admin-chrome
        className="sticky bottom-0 z-40 border-t border-line bg-ivory/90 px-4 py-3 backdrop-blur-xl sm:px-6"
      >
        {/* ---- Version conflict ---- */}
        <AnimatePresence>
          {hasConflict && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="mb-3 flex flex-col gap-3 rounded-2xl border border-danger/40 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex items-start gap-2.5 text-sm text-charcoal">
                <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span>
                  <strong className="font-semibold">The biodata was changed elsewhere.</strong> Please reload the
                  latest version before publishing.
                </span>
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void reload()}
                leadingIcon={<RefreshCw className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                Reload latest
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Validation ---- */}
        <AnimatePresence>
          {!isValid && blockingIssue && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="mb-3 flex items-start gap-2.5 rounded-2xl border border-danger/40 bg-danger/5 p-3.5 text-sm text-charcoal"
            >
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <span>
                <strong className="font-semibold">{humanizePath(blockingIssue.path)}</strong> — {blockingIssue.message}
                {issues.length > 1 && (
                  <span className="text-muted">
                    {' '}
                    (and {issues.length - 1} other {issues.length === 2 ? 'field' : 'fields'})
                  </span>
                )}
              </span>
            </motion.p>
          )}
        </AnimatePresence>

        {/* ---- Publish confirmation ---- */}
        <AnimatePresence>
          {published && !isDirty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="status"
              className="mb-3 flex items-start gap-2.5 rounded-2xl border border-success/40 bg-success/5 p-3.5 text-sm text-charcoal"
            >
              <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>
                <strong className="font-semibold">Changes published successfully.</strong> Vercel is deploying the
                updated website — the public page will show the new details once the build finishes, usually within a
                minute.
                {published.commitUrl && (
                  <>
                    {' '}
                    <a
                      href={published.commitUrl}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Actions ---- */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {isDirty ? (
              <>
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-gold align-middle" />
                Unpublished draft — nothing is committed until you publish.
              </>
            ) : (
              'No unpublished changes.'
            )}
          </p>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmCancelOpen(true)}
              disabled={!isDirty || isPublishing}
              leadingIcon={<Undo2 className="h-3.5 w-3.5" />}
            >
              Cancel
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveLocally}
              disabled={!isDirty || isPublishing}
              leadingIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save Draft Locally
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/preview')}
              leadingIcon={<Eye className="h-3.5 w-3.5" />}
            >
              Preview
            </Button>

            <Button
              variant="gold"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={!isDirty || !isValid || hasConflict}
              isLoading={isPublishing}
              loadingText="Publishing…"
              leadingIcon={<UploadCloud className="h-3.5 w-3.5" />}
            >
              Publish Changes
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Publish these changes?"
        description={
          'This commits data/biodata.json to your GitHub repository and triggers a new Vercel deployment. ' +
          'The public website updates once that build finishes — usually within a minute, not instantly.'
        }
        confirmLabel="Publish Changes"
        cancelLabel="Not yet"
        isBusy={isPublishing}
        onConfirm={() => void handlePublish()}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={confirmCancelOpen}
        title="Discard your draft?"
        description="Every unpublished edit will be replaced by the version currently in GitHub. This cannot be undone."
        confirmLabel="Discard draft"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          cancel();
          setConfirmCancelOpen(false);
          setPublished(null);
          toast.notify('Draft discarded.', { description: 'The editor is back to the published version.' });
        }}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </>
  );
}
