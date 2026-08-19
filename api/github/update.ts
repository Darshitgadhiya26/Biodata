/**
 * POST /api/github/update  { data, sha }
 *
 * Commits `data/biodata.json`. The order of operations is what keeps the
 * repository trustworthy:
 *
 *   1. verify the admin session
 *   2. validate the incoming biodata against the shared Zod schema
 *   3. compare the caller's SHA against the SHA GitHub currently holds
 *   4. commit — which is what triggers Vercel's automatic redeploy
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthenticated } from '../_lib/auth.js';
import { applySecurityHeaders, describeError, fail, json, readJsonBody, rejectMethod } from '../_lib/http.js';
import { BIODATA_PATH, GitHubError, readFileSha, readRepoConfig, writeFile } from '../_lib/github.js';
import { serializeBiodata, validateBiodata } from '../_lib/biodata-schema.js';

const CONFLICT_MESSAGE =
  'The biodata was changed elsewhere. Please reload the latest version before publishing.';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);
  if (rejectMethod(req, res, 'POST')) return;

  if (!isAuthenticated(req)) {
    fail(res, 401, 'unauthenticated', 'Please sign in to the admin dashboard first.');
    return;
  }

  const body = readJsonBody(req);
  if (!body) {
    fail(res, 400, 'invalid_body', 'Expected a JSON body containing "data" and "sha".');
    return;
  }

  const expectedSha = typeof body.sha === 'string' ? body.sha : '';
  if (!expectedSha) {
    fail(res, 400, 'missing_sha', 'A file SHA is required so an older version cannot overwrite a newer one.');
    return;
  }

  const validation = validateBiodata(body.data);
  if (!validation.success || !validation.data) {
    fail(res, 422, 'validation_failed', 'The biodata is not valid, so nothing was published.', validation.issues);
    return;
  }

  try {
    const config = readRepoConfig();

    // ---- Version safety -------------------------------------------------
    // Re-read the SHA immediately before writing. GitHub enforces this too,
    // but checking first turns a 409 into a precise, friendly message.
    const currentSha = await readFileSha(config, BIODATA_PATH);
    if (currentSha && currentSha !== expectedSha) {
      fail(res, 409, 'sha_conflict', CONFLICT_MESSAGE);
      return;
    }

    const contents = serializeBiodata(validation.data);
    const commit = await writeFile(config, {
      path: BIODATA_PATH,
      contentBase64: Buffer.from(contents, 'utf8').toString('base64'),
      message: `Update biodata for ${validation.data.personal.name}`,
      expectedSha: currentSha,
    });

    json(res, 200, {
      published: true,
      sha: commit.sha,
      commitUrl: commit.commitUrl,
      committedAt: commit.committedAt,
      branch: config.branch,
    });
  } catch (error) {
    if (error instanceof GitHubError) {
      fail(res, error.status, error.code, error.code === 'sha_conflict' ? CONFLICT_MESSAGE : error.message);
      return;
    }
    const { status, code, message } = describeError(error);
    fail(res, status, code, message);
  }
}
