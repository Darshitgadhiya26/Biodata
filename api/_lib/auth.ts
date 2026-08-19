/**
 * Admin session handling.
 *
 * There is no database and no auth provider, so a session is a short-lived
 * HMAC-signed cookie:
 *
 *   value  = <expiry-ms>.<hex signature>
 *   key    = SHA-256(ADMIN_PASSWORD + a fixed context string)
 *
 * The signing key is derived from ADMIN_PASSWORD, which lives only in the
 * Vercel environment — so a cookie cannot be forged without it, and changing
 * the password invalidates every existing session. The cookie is HttpOnly, so
 * client-side JavaScript (including anything injected into the page) can never
 * read it.
 */
import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireEnv } from './http';

export const SESSION_COOKIE = 'biodata_admin';

/** Eight hours is long enough for an editing session, short enough to expire. */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const KEY_CONTEXT = 'biodata-admin-session-v1';

function signingKey(): Buffer {
  return createHash('sha256').update(`${requireEnv('ADMIN_PASSWORD')}::${KEY_CONTEXT}`).digest();
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('hex');
}

/** Constant-time comparison that tolerates different lengths. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) {
    // Still burn a comparison so the timing does not leak the length.
    timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

/** Verifies a submitted password against ADMIN_PASSWORD. */
export function isValidPassword(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || candidate.length === 0 || candidate.length > 512) return false;
  return safeEqual(candidate, requireEnv('ADMIN_PASSWORD'));
}

function createToken(now = Date.now()): string {
  const expiresAt = String(now + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

function verifyToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!/^\d+$/.test(expiresAt)) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;

  return Number(expiresAt) > now;
}

/** Reads a cookie from the request (Vercel parses them, with a raw fallback). */
function readCookie(req: VercelRequest, name: string): string | undefined {
  const parsed = req.cookies?.[name];
  if (typeof parsed === 'string' && parsed.length > 0) return parsed;

  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function cookieAttributes(maxAgeSeconds: number): string {
  // `Secure` is dropped on localhost so `vercel dev` / `npm run dev` still work.
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${maxAgeSeconds}`;
}

export function setSessionCookie(res: VercelResponse): void {
  const token = createToken();
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; ${cookieAttributes(SESSION_TTL_MS / 1000)}`);
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${cookieAttributes(0)}`);
}

/** True when the request carries a valid, unexpired admin session. */
export function isAuthenticated(req: VercelRequest): boolean {
  try {
    return verifyToken(readCookie(req, SESSION_COOKIE));
  } catch {
    // ADMIN_PASSWORD missing — nobody is authenticated.
    return false;
  }
}

/** How long a session lasts, in seconds, for the client to display. */
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

/**
 * Best-effort brute-force damping, keyed by client IP.
 *
 * Serverless instances are ephemeral and not shared, so this cannot be a hard
 * guarantee — it is a speed bump on top of a high-entropy password, not the
 * security boundary.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw?.split(',')[0] ?? req.socket?.remoteAddress ?? 'unknown').trim();
}

export function isRateLimited(ip: string, now = Date.now()): boolean {
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) return false;
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(ip: string, now = Date.now()): void {
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

/** Random 150–400 ms pause so a wrong password cannot be timed. */
export function jitterDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, randomInt(150, 400)));
}
