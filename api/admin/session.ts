/**
 * GET /api/admin/session
 *
 * Tells the browser whether its cookie is still valid, so a returning admin
 * skips the password prompt and an expired one is bounced back to it. It also
 * reports whether the server is configured, which turns a mysterious failure at
 * publish time into a clear message at login time.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthenticated } from '../_lib/auth.js';
import { applySecurityHeaders, json, rejectMethod } from '../_lib/http.js';

const REQUIRED = ['ADMIN_PASSWORD', 'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'] as const;

export default function handler(req: VercelRequest, res: VercelResponse): void {
  applySecurityHeaders(res);
  if (rejectMethod(req, res, 'GET')) return;

  // Only variable *names* are reported — never their values.
  const missing = REQUIRED.filter((name) => !(process.env[name] ?? '').trim());

  json(res, 200, {
    authenticated: isAuthenticated(req),
    configured: missing.length === 0,
    missing,
    branch: (process.env.GITHUB_BRANCH ?? '').trim() || 'main',
  });
}
