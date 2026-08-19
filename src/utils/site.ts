/**
 * Where this website lives.
 *
 * Derived from the browser at runtime rather than baked in, so the QR code and
 * the share sheet always point at whatever domain the visitor is actually on —
 * the Vercel production URL in production, a preview URL on a preview
 * deployment. Nothing is hardcoded, and `localhost` can only appear while
 * genuinely developing locally.
 */
export function getSiteUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin.replace(/\/+$/, '');
}

/** Absolute URL of the public biodata page. */
export function getPublicBiodataUrl(): string {
  const origin = getSiteUrl();
  return origin ? `${origin}/` : '/';
}

/** True while running against a local dev server. */
export function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(window.location.hostname);
}

/** Absolute URL for an asset served from `public/`. */
export function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const origin = getSiteUrl();
  return origin ? `${origin}${path.startsWith('/') ? path : `/${path}`}` : path;
}
