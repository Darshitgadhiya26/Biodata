/**
 * POST /api/admin/logout — clears the session cookie.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearSessionCookie } from '../_lib/auth.js';
import { applySecurityHeaders, json, rejectMethod } from '../_lib/http.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  applySecurityHeaders(res);
  if (rejectMethod(req, res, 'POST')) return;

  clearSessionCookie(res);
  json(res, 200, { authenticated: false });
}
