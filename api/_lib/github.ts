/**
 * A very small GitHub Contents API client.
 *
 * Only three operations are needed to run this site: read a file, write a file
 * and read the commit that last touched a file. GITHUB_TOKEN is read from the
 * environment here and never leaves the server.
 */
import { requireEnv } from './http.js';

const API_ROOT = 'https://api.github.com';

export const BIODATA_PATH = 'data/biodata.json';
export const IMAGE_DIR = 'public/images';

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export function readRepoConfig(): RepoConfig {
  return {
    owner: requireEnv('GITHUB_OWNER'),
    repo: requireEnv('GITHUB_REPO'),
    branch: (process.env.GITHUB_BRANCH ?? '').trim() || 'main',
    token: requireEnv('GITHUB_TOKEN'),
  };
}

export class GitHubError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = 'github_error') {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.code = code;
  }
}

interface ContentsResponse {
  content?: string;
  encoding?: string;
  sha: string;
  html_url?: string | null;
  path: string;
}

interface CommitResponse {
  content: { sha: string; path: string; html_url?: string | null };
  commit: { sha: string; html_url?: string | null; committer?: { date?: string } };
}

async function request<T>(
  config: RepoConfig,
  path: string,
  init: { method: 'GET' | 'PUT'; body?: unknown } = { method: 'GET' },
): Promise<{ status: number; data: T | null }> {
  const response = await fetch(`${API_ROOT}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'marriage-biodata-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  if (response.status === 404) return { status: 404, data: null };

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message =
      (parsed as { message?: string } | null)?.message ?? `GitHub responded with ${response.status}.`;

    if (response.status === 401 || response.status === 403) {
      throw new GitHubError(
        `GitHub rejected the request (${message}). Check that GITHUB_TOKEN is valid and has "Contents: Read and write" permission on ${config.owner}/${config.repo}.`,
        502,
        'github_auth_failed',
      );
    }
    if (response.status === 409 || response.status === 422) {
      throw new GitHubError(message, 409, 'sha_conflict');
    }
    throw new GitHubError(`GitHub error: ${message}`, 502, 'github_error');
  }

  return { status: response.status, data: parsed as T };
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

export interface FileContents {
  /** UTF-8 decoded file body. */
  text: string;
  sha: string;
  htmlUrl: string | null;
}

/** Reads a text file from the configured branch. Returns null when absent. */
export async function readFile(config: RepoConfig, path: string): Promise<FileContents | null> {
  const { data } = await request<ContentsResponse>(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(config.branch)}`,
  );

  if (!data) return null;

  if (data.encoding !== 'base64' || typeof data.content !== 'string') {
    throw new GitHubError(`${path} could not be decoded — it may be too large or binary.`, 502);
  }

  return {
    text: Buffer.from(data.content, 'base64').toString('utf8'),
    sha: data.sha,
    htmlUrl: data.html_url ?? null,
  };
}

/** The blob SHA of a file, or null when it does not exist yet. */
export async function readFileSha(config: RepoConfig, path: string): Promise<string | null> {
  const { data } = await request<ContentsResponse>(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(config.branch)}`,
  );
  return data?.sha ?? null;
}

export interface CommitResult {
  sha: string;
  commitUrl: string | null;
  committedAt: string | null;
}

/**
 * Creates or updates a file.
 *
 * `expectedSha` is what makes publishing safe: GitHub rejects the write when
 * the blob has moved on, which surfaces to the admin as "the biodata was
 * changed elsewhere" instead of silently overwriting someone else's edit.
 */
export async function writeFile(
  config: RepoConfig,
  options: { path: string; contentBase64: string; message: string; expectedSha?: string | null },
): Promise<CommitResult> {
  const body: Record<string, unknown> = {
    message: options.message,
    content: options.contentBase64,
    branch: config.branch,
  };
  if (options.expectedSha) body.sha = options.expectedSha;

  const { data } = await request<CommitResponse>(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodePath(options.path)}`,
    { method: 'PUT', body },
  );

  if (!data) throw new GitHubError('GitHub did not return a commit.', 502);

  return {
    sha: data.content.sha,
    commitUrl: data.commit.html_url ?? null,
    committedAt: data.commit.committer?.date ?? null,
  };
}

/** ISO timestamp of the most recent commit touching `path`. */
export async function readLastCommitDate(config: RepoConfig, path: string): Promise<string | null> {
  try {
    const { data } = await request<Array<{ commit?: { committer?: { date?: string } } }>>(
      config,
      `/repos/${config.owner}/${config.repo}/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(
        config.branch,
      )}&per_page=1`,
    );
    return data?.[0]?.commit?.committer?.date ?? null;
  } catch {
    // A missing "last updated" stamp must never block the editor.
    return null;
  }
}
