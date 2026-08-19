/**
 * Client for the Vercel serverless endpoints.
 *
 * The browser never talks to GitHub directly and never holds a token: every
 * call here goes to this deployment's own `/api/*` routes, which carry the
 * secrets. Authentication travels as an HttpOnly cookie, so nothing in this
 * file (or anywhere else in the bundle) can read the session either.
 */
import { ApiError, type Biodata, type BiodataFile, type FieldIssue, type PublishResult } from '@/types';

interface ErrorPayload {
  /**
   * Our own routes send a string. Vercel's platform errors (a crashed
   * function, a timeout) send an object like
   * `{ error: { code, message } }` instead — which is why this is `unknown`
   * and gets narrowed below rather than trusted.
   */
  error?: unknown;
  code?: string;
  issues?: FieldIssue[];
}

/**
 * Pulls a human-readable message out of an error body of unknown shape.
 * Never returns an object, so `[object Object]` can never reach the UI.
 */
function extractMessage(payload: unknown, status: number): { message: string; code?: string } {
  const fallback = `The server returned an unexpected error (HTTP ${status}).`;

  if (typeof payload !== 'object' || payload === null) return { message: fallback };

  const body = payload as ErrorPayload;
  const { error } = body;

  if (typeof error === 'string' && error.trim()) {
    return { message: error, code: body.code };
  }

  // Vercel's shape: { error: { code, message } }
  if (typeof error === 'object' && error !== null) {
    const nested = error as { message?: unknown; code?: unknown };
    const message = typeof nested.message === 'string' && nested.message.trim() ? nested.message : fallback;
    const code = typeof nested.code === 'string' ? nested.code : body.code;
    return { message, code };
  }

  return { message: fallback, code: body.code };
}

/** True when the body is one of our own `{ error, code }` responses. */
function isOwnError(payload: unknown): boolean {
  return typeof payload === 'object' && payload !== null && typeof (payload as ErrorPayload).error === 'string';
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      // Send and accept the session cookie.
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('Could not reach the server. Please check your connection and try again.', {
      code: 'network_error',
    });
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const { message, code } = extractMessage(payload, response.status);
    const issues = (payload as ErrorPayload | null)?.issues;

    // A 500 from one of our own routes is already explanatory; a 500 with no
    // usable body means the function itself failed to start, which the admin
    // can only fix by looking at the deployment.
    const detail =
      code === 'FUNCTION_INVOCATION_FAILED' || (response.status >= 500 && !isOwnError(payload))
        ? `${message.replace(/[\s.]+$/, '')}. The /api routes may not have deployed correctly — check the Vercel deployment logs.`
        : message;

    throw new ApiError(detail, { status: response.status, code, issues });
  }

  return payload as T;
}

export interface SessionInfo {
  authenticated: boolean;
  /** False when required environment variables are missing on the server. */
  configured: boolean;
  /** Names (never values) of the missing variables. */
  missing: string[];
  branch: string;
}

export function getSession(): Promise<SessionInfo> {
  return call<SessionInfo>('/api/admin/session');
}

export function login(password: string): Promise<{ authenticated: true }> {
  return call('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
}

export function logout(): Promise<{ authenticated: false }> {
  return call('/api/admin/logout', { method: 'POST' });
}

/** Reads the live file from GitHub, with the SHA needed to publish safely. */
export function readBiodataFile(): Promise<BiodataFile> {
  return call<BiodataFile>('/api/github/read');
}

/** Commits the biodata. `sha` must be the one that was read. */
export function publishBiodata(data: Biodata, sha: string): Promise<PublishResult> {
  return call<PublishResult>('/api/github/update', {
    method: 'POST',
    body: JSON.stringify({ data, sha }),
  });
}

export interface UploadedImage {
  /** Public path to store in `profilePhoto`, e.g. `/images/profile.jpg`. */
  profilePhoto: string;
  repoPath: string;
  bytes: number;
  contentType: string;
  commitUrl: string | null;
}

/** Commits an image to `public/images/` and returns its public path. */
export function uploadProfileImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new ApiError('That file could not be read.', { code: 'file_read_error' }));

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      // Strip the `data:<type>;base64,` prefix — the API wants raw base64.
      const dataBase64 = result.slice(result.indexOf(',') + 1);

      call<UploadedImage>('/api/github/upload-image', {
        method: 'POST',
        body: JSON.stringify({ contentType: file.type, dataBase64 }),
      }).then(resolve, reject);
    };

    reader.readAsDataURL(file);
  });
}

/** Turns any thrown value into something worth showing a person. */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
