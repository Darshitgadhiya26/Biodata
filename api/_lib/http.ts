/**
 * Tiny request/response helpers shared by every endpoint.
 *
 * Files and folders under `api/` whose name starts with `_` are not routed by
 * Vercel, so this module is private to the functions.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface ErrorBody {
  error: string;
  code: string;
  issues?: Array<{ path: string; message: string }>;
}

/** Sends JSON with caching disabled — none of these responses are cacheable. */
export function json(res: VercelResponse, status: number, body: unknown): void {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).send(JSON.stringify(body));
}

export function fail(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  issues?: ErrorBody['issues'],
): void {
  const body: ErrorBody = { error: message, code };
  if (issues && issues.length > 0) body.issues = issues;
  json(res, status, body);
}

/**
 * Rejects anything that is not the expected verb.
 * Returns `true` when the request was handled (and the caller should stop).
 */
export function rejectMethod(req: VercelRequest, res: VercelResponse, allowed: string): boolean {
  if (req.method === allowed) return false;

  res.setHeader('Allow', allowed);
  fail(res, 405, 'method_not_allowed', `This endpoint only accepts ${allowed} requests.`);
  return true;
}

/**
 * Parses the JSON body defensively.
 *
 * Vercel usually hands us a parsed object, but a string or a raw Buffer
 * arrives when the content type is missing or unrecognised — for instance if a
 * proxy strips the header. All three are handled so a valid request is never
 * rejected on a technicality.
 */
export function readJsonBody(req: VercelRequest): Record<string, unknown> | null {
  const { body } = req;

  if (body === undefined || body === null || body === '') return null;

  const asObject = (value: unknown): Record<string, unknown> | null =>
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;

  const parse = (text: string): Record<string, unknown> | null => {
    try {
      return asObject(JSON.parse(text));
    } catch {
      return null;
    }
  };

  if (typeof body === 'string') return parse(body);
  if (Buffer.isBuffer(body)) return parse(body.toString('utf8'));

  return asObject(body);
}

/** Reads a required server-side environment variable. */
export function requireEnv(name: string): string {
  const value = (process.env[name] ?? '').trim();
  if (!value) {
    throw new MissingConfigError(name);
  }
  return value;
}

export class MissingConfigError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(
      `Server configuration is incomplete: the ${variable} environment variable is not set. ` +
        'Add it in Vercel → Settings → Environment Variables and redeploy.',
    );
    this.name = 'MissingConfigError';
    this.variable = variable;
  }
}

/** Converts a thrown value into a `{ status, code, message }` triple. */
export function describeError(error: unknown): { status: number; code: string; message: string } {
  if (error instanceof MissingConfigError) {
    return { status: 500, code: 'missing_configuration', message: error.message };
  }
  if (error instanceof Error) {
    return { status: 500, code: 'server_error', message: error.message };
  }
  return { status: 500, code: 'server_error', message: 'Something went wrong.' };
}

/** Baseline hardening applied to every response. */
export function applySecurityHeaders(res: VercelResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
}
