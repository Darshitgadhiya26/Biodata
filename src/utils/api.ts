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
  error?: string;
  code?: string;
  issues?: FieldIssue[];
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
    const body = (payload ?? {}) as ErrorPayload;
    throw new ApiError(body.error ?? `Request failed with status ${response.status}.`, {
      status: response.status,
      code: body.code,
      issues: body.issues,
    });
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
