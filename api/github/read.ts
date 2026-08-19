/**
 * GET /api/github/read
 *
 * Returns the live `data/biodata.json` from GitHub together with its blob SHA.
 * The editor loads this rather than the copy bundled into the deployment, so
 * an admin always edits the newest committed data — even before Vercel has
 * finished rebuilding the public site.
 *
 * Admin-only: the biodata itself is public, but the SHA and repository details
 * are part of the publishing mechanism and stay behind the session cookie.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthenticated } from '../_lib/auth.js';
import { applySecurityHeaders, describeError, fail, json, rejectMethod } from '../_lib/http.js';
import { BIODATA_PATH, GitHubError, readFile, readLastCommitDate, readRepoConfig } from '../_lib/github.js';
import { validateBiodata } from '../_lib/biodata-schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);
  if (rejectMethod(req, res, 'GET')) return;

  if (!isAuthenticated(req)) {
    fail(res, 401, 'unauthenticated', 'Please sign in to the admin dashboard first.');
    return;
  }

  try {
    const config = readRepoConfig();
    const file = await readFile(config, BIODATA_PATH);

    if (!file) {
      fail(
        res,
        404,
        'file_not_found',
        `${BIODATA_PATH} does not exist on the ${config.branch} branch of ${config.owner}/${config.repo}.`,
      );
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(file.text);
    } catch {
      fail(res, 422, 'invalid_json', `${BIODATA_PATH} in GitHub is not valid JSON. Please fix it in the repository.`);
      return;
    }

    const result = validateBiodata(parsed);
    if (!result.success || !result.data) {
      fail(
        res,
        422,
        'invalid_biodata',
        `${BIODATA_PATH} in GitHub does not match the expected structure.`,
        result.issues,
      );
      return;
    }

    const lastCommitAt = await readLastCommitDate(config, BIODATA_PATH);

    json(res, 200, {
      data: result.data,
      sha: file.sha,
      branch: config.branch,
      repo: `${config.owner}/${config.repo}`,
      lastCommitAt,
      htmlUrl: file.htmlUrl,
    });
  } catch (error) {
    if (error instanceof GitHubError) {
      fail(res, error.status, error.code, error.message);
      return;
    }
    const { status, code, message } = describeError(error);
    fail(res, status, code, message);
  }
}
