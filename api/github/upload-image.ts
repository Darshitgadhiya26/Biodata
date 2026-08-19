/**
 * POST /api/github/upload-image  { contentType, dataBase64 }
 *
 * Commits a profile photograph to `public/images/` in the repository. Images
 * are never stored inside biodata.json — the JSON only ever holds the path.
 *
 * The committed filename is `profile.<ext>`, derived from the image's real
 * format, so switching from JPEG to PNG changes the path and the caller is
 * expected to write that new path into `profilePhoto`.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthenticated } from '../_lib/auth.js';
import { applySecurityHeaders, describeError, fail, json, readJsonBody, rejectMethod } from '../_lib/http.js';
import { GitHubError, IMAGE_DIR, readFileSha, readRepoConfig, writeFile } from '../_lib/github.js';

/** Kept well under Vercel's 4.5 MB request limit once base64 inflation is counted. */
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
};

/**
 * Confirms the bytes really are the image type they claim to be, so an
 * arbitrary file cannot be committed under an image extension.
 */
function detectImageType(bytes: Buffer): keyof typeof EXTENSIONS | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((byte, index) => bytes[index] === byte)) return 'image/png';

  // WEBP: "RIFF" .... "WEBP"
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);
  if (rejectMethod(req, res, 'POST')) return;

  if (!isAuthenticated(req)) {
    fail(res, 401, 'unauthenticated', 'Please sign in to the admin dashboard first.');
    return;
  }

  const body = readJsonBody(req);
  const dataBase64 = typeof body?.dataBase64 === 'string' ? body.dataBase64 : '';

  if (!dataBase64) {
    fail(res, 400, 'invalid_body', 'Expected a JSON body containing a base64-encoded "dataBase64" field.');
    return;
  }

  // Reject before decoding: base64 is ~4/3 the size of the bytes it carries.
  if (dataBase64.length > MAX_IMAGE_BYTES * 1.4) {
    fail(res, 413, 'image_too_large', 'That image is too large. Please use one under 3 MB.');
    return;
  }

  const bytes = Buffer.from(dataBase64, 'base64');

  if (bytes.length === 0) {
    fail(res, 400, 'invalid_image', 'That image could not be decoded.');
    return;
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    fail(res, 413, 'image_too_large', 'That image is too large. Please use one under 3 MB.');
    return;
  }

  const detected = detectImageType(bytes);
  if (!detected) {
    fail(res, 415, 'unsupported_image', 'Only JPG, JPEG, PNG and WEBP images are supported.');
    return;
  }

  const declared = typeof body?.contentType === 'string' ? body.contentType : '';
  if (declared && declared !== detected) {
    fail(res, 415, 'unsupported_image', `That file is a ${LABELS[detected]} image, but it was sent as ${declared}.`);
    return;
  }

  const path = `${IMAGE_DIR}/profile.${EXTENSIONS[detected]}`;

  try {
    const config = readRepoConfig();
    // Replacing an existing photo needs its SHA; a first upload has none.
    const existingSha = await readFileSha(config, path);

    const commit = await writeFile(config, {
      path,
      contentBase64: bytes.toString('base64'),
      message: 'Update biodata profile photo',
      expectedSha: existingSha,
    });

    json(res, 200, {
      uploaded: true,
      // Path as the website serves it: `public/` is the web root.
      profilePhoto: `/${path.replace(/^public\//, '')}`,
      repoPath: path,
      bytes: bytes.length,
      contentType: detected,
      commitUrl: commit.commitUrl,
      committedAt: commit.committedAt,
      branch: config.branch,
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
