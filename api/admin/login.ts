/**
 * POST /api/admin/login  { password }
 *
 * Compares the password against ADMIN_PASSWORD (server-side only) and, on
 * success, sets the HttpOnly session cookie. The password itself is never
 * stored anywhere and never echoed back.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  clearAttempts,
  clientIp,
  isRateLimited,
  isValidPassword,
  jitterDelay,
  recordFailedAttempt,
  setSessionCookie,
  SESSION_TTL_SECONDS,
} from '../_lib/auth';
import { applySecurityHeaders, describeError, fail, json, readJsonBody, rejectMethod } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applySecurityHeaders(res);
  if (rejectMethod(req, res, 'POST')) return;

  const ip = clientIp(req);

  if (isRateLimited(ip)) {
    fail(res, 429, 'too_many_attempts', 'Too many failed attempts. Please wait a few minutes and try again.');
    return;
  }

  const body = readJsonBody(req);
  const password = body?.password;

  try {
    await jitterDelay();

    if (!isValidPassword(password)) {
      recordFailedAttempt(ip);
      fail(res, 401, 'invalid_password', 'That password is not correct.');
      return;
    }

    clearAttempts(ip);
    setSessionCookie(res);
    json(res, 200, { authenticated: true, expiresIn: SESSION_TTL_SECONDS });
  } catch (error) {
    const { status, code, message } = describeError(error);
    fail(res, status, code, message);
  }
}
