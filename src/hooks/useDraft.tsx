import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, type Biodata, type FieldIssue } from '@/types';
import { publishBiodata, readBiodataFile } from '@/utils/api';
import { validateBiodata } from '@/utils/biodata-schema';

const LOCAL_DRAFT_KEY = 'biodata-admin-draft';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface PublishOutcome {
  commitUrl: string | null;
}

interface DraftValue {
  loadState: LoadState;
  loadError: string | null;

  /** The biodata as GitHub currently holds it. */
  saved: Biodata | null;
  /** The biodata being edited. The live preview renders this. */
  draft: Biodata | null;

  sha: string | null;
  repo: string | null;
  branch: string | null;
  lastCommitAt: string | null;
  fileUrl: string | null;

  isDirty: boolean;
  isPublishing: boolean;
  /** Set when GitHub moved on since this draft was loaded. */
  hasConflict: boolean;
  /** Schema errors in the current draft; publishing is blocked while non-empty. */
  issues: FieldIssue[];
  isValid: boolean;

  /** True when an unpublished draft was restored from this browser. */
  restoredLocally: boolean;

  /** Applies a change to the draft. */
  update: (mutate: (current: Biodata) => Biodata) => void;
  /** Discards the draft and returns to the saved data. */
  cancel: () => void;
  /** Re-reads the file from GitHub, discarding the draft. */
  reload: () => Promise<void>;
  /** Stores the draft in this browser so a refresh does not lose it. */
  saveDraftLocally: () => boolean;
  /** Commits the draft to GitHub. */
  publish: () => Promise<PublishOutcome>;
}

const DraftContext = createContext<DraftValue | null>(null);

/** Deep-equality via serialisation — the object is small and plain JSON. */
function isSame(a: Biodata | null, b: Biodata | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function readLocalDraft(): Biodata | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!raw) return null;
    const result = validateBiodata(JSON.parse(raw));
    return result.data ?? null;
  } catch {
    return null;
  }
}

function clearLocalDraft(): void {
  try {
    window.localStorage.removeItem(LOCAL_DRAFT_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * The editor's two states: **saved** (what GitHub holds) and **draft** (what is
 * being edited). Everything on screen reads the draft; only "Publish Changes"
 * turns a draft into a commit.
 *
 * localStorage is used strictly as a scratchpad for an unpublished draft, so a
 * refresh or a closed laptop does not lose typing. GitHub remains the source of
 * truth: the saved state is always re-read from the repository.
 */
export function DraftProvider({ children }: { children: ReactNode }) {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saved, setSaved] = useState<Biodata | null>(null);
  const [draft, setDraft] = useState<Biodata | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [lastCommitAt, setLastCommitAt] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [restoredLocally, setRestoredLocally] = useState(false);

  const load = useCallback(async (options: { keepDraft?: boolean } = {}) => {
    setLoadState((current) => (current === 'ready' ? current : 'loading'));
    setLoadError(null);

    try {
      const file = await readBiodataFile();

      setSaved(file.data);
      setSha(file.sha);
      setRepo(file.repo);
      setBranch(file.branch);
      setLastCommitAt(file.lastCommitAt);
      setFileUrl(file.htmlUrl);
      setHasConflict(false);
      setLoadState('ready');

      if (options.keepDraft) return;

      // A locally-stored draft only makes sense while it still differs from
      // what was published; otherwise it is stale and simply dropped.
      const local = readLocalDraft();
      if (local && !isSame(local, file.data)) {
        setDraft(local);
        setRestoredLocally(true);
      } else {
        clearLocalDraft();
        setDraft(file.data);
        setRestoredLocally(false);
      }
    } catch (error) {
      setLoadState('error');
      setLoadError(error instanceof ApiError ? error.message : 'Could not load the biodata from GitHub.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback((mutate: (current: Biodata) => Biodata) => {
    setDraft((current) => (current ? mutate(current) : current));
    setRestoredLocally(false);
  }, []);

  const cancel = useCallback(() => {
    setDraft(saved);
    clearLocalDraft();
    setRestoredLocally(false);
  }, [saved]);

  const reload = useCallback(async () => {
    clearLocalDraft();
    setRestoredLocally(false);
    await load();
  }, [load]);

  const saveDraftLocally = useCallback(() => {
    if (!draft) return false;
    try {
      window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
      return true;
    } catch {
      return false;
    }
  }, [draft]);

  const validation = useMemo(() => validateBiodata(draft ?? {}), [draft]);

  const publish = useCallback(async (): Promise<PublishOutcome> => {
    if (!draft || !sha) throw new ApiError('The biodata has not finished loading yet.');

    const checked = validateBiodata(draft);
    if (!checked.success || !checked.data) {
      throw new ApiError('Please fix the highlighted fields before publishing.', {
        code: 'validation_failed',
        issues: checked.issues,
      });
    }

    setIsPublishing(true);
    try {
      const result = await publishBiodata(checked.data, sha);

      setSaved(checked.data);
      setDraft(checked.data);
      setSha(result.sha);
      setLastCommitAt(result.committedAt);
      setHasConflict(false);
      setRestoredLocally(false);
      clearLocalDraft();

      return { commitUrl: result.commitUrl };
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) setHasConflict(true);
      throw error;
    } finally {
      setIsPublishing(false);
    }
  }, [draft, sha]);

  const isDirty = useMemo(() => Boolean(saved && draft) && !isSame(saved, draft), [saved, draft]);

  // A dirty draft is worth protecting from an accidental tab close.
  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const value = useMemo<DraftValue>(
    () => ({
      loadState,
      loadError,
      saved,
      draft,
      sha,
      repo,
      branch,
      lastCommitAt,
      fileUrl,
      isDirty,
      isPublishing,
      hasConflict,
      issues: validation.issues,
      isValid: validation.success,
      restoredLocally,
      update,
      cancel,
      reload,
      saveDraftLocally,
      publish,
    }),
    [
      loadState,
      loadError,
      saved,
      draft,
      sha,
      repo,
      branch,
      lastCommitAt,
      fileUrl,
      isDirty,
      isPublishing,
      hasConflict,
      validation.issues,
      validation.success,
      restoredLocally,
      update,
      cancel,
      reload,
      saveDraftLocally,
      publish,
    ],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftValue {
  const context = useContext(DraftContext);
  if (!context) throw new Error('useDraft must be used inside <DraftProvider>');
  return context;
}

/**
 * The draft, guaranteed non-null. Editor pages render only once the draft has
 * loaded, so this keeps them free of null checks on every field.
 */
export function useDraftData(): Biodata {
  const { draft } = useDraft();
  if (!draft) throw new Error('The draft is not ready yet.');
  return draft;
}

/**
 * A lookup from dotted path (`personal.name`) to the first schema message for
 * it, so an editor page can label exactly which field is invalid.
 */
export function useFieldErrors(): (path: string) => string | undefined {
  const { issues } = useDraft();

  return useMemo(() => {
    const map = new Map<string, string>();
    for (const issue of issues) {
      if (!map.has(issue.path)) map.set(issue.path, issue.message);
    }
    return (path: string) => map.get(path);
  }, [issues]);
}
