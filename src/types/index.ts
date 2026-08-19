/**
 * Shared UI types.
 *
 * The biodata shape itself is not redeclared here — it is inferred from the Zod
 * schema in `src/utils/biodata-schema.ts`, so the validator and the types can
 * never drift apart.
 */
export type {
  Accent,
  Biodata,
  FieldIssue,
  ThemeMode,
  ValidationResult,
} from '@/utils/biodata-schema';

/** What the theme toggle offers the visitor (a browser-local override). */
export type ThemePreference = 'light' | 'dark' | 'system';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

/** The `data/biodata.json` file as GitHub currently holds it. */
export interface BiodataFile {
  /** Parsed contents. */
  data: import('@/utils/biodata-schema').Biodata;
  /** Git blob SHA — required to publish without clobbering someone else. */
  sha: string;
  /** Branch the file was read from. */
  branch: string;
  /** `owner/repo`. */
  repo: string;
  /** ISO timestamp of the commit that last touched the file, when known. */
  lastCommitAt: string | null;
  /** Permalink to the file on github.com. */
  htmlUrl: string | null;
}

/** Result of a successful publish. */
export interface PublishResult {
  sha: string;
  commitUrl: string | null;
  committedAt: string | null;
}

/** Anything the API layer rejected, normalised for the UI. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues: import('@/utils/biodata-schema').FieldIssue[];

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      issues?: import('@/utils/biodata-schema').FieldIssue[];
    } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.code = options.code ?? 'unknown_error';
    this.issues = options.issues ?? [];
  }

  /** True when the file changed in GitHub since the editor loaded it. */
  get isConflict(): boolean {
    return this.code === 'sha_conflict' || this.status === 409;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}
