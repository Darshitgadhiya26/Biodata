/**
 * Environment access.
 *
 * Only `VITE_*` values exist in the browser bundle, and all three below are
 * intentionally public: the Supabase anon key is safe to ship because Row Level
 * Security — not secrecy — is what protects the data. The service_role key must
 * never appear here.
 */

const read = (value: string | undefined): string => (value ?? '').trim();

export const SUPABASE_URL = read(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY = read(import.meta.env.VITE_SUPABASE_ANON_KEY);

/** True when both Supabase variables are present and look plausible. */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

/**
 * Canonical public origin, used for the QR code, canonical URL and share sheet.
 * Falls back to the current origin so local development and preview deploys
 * never bake in a wrong (or localhost) address.
 */
export function getSiteUrl(): string {
  const configured = read(import.meta.env.VITE_SITE_URL);
  if (configured) return configured.replace(/\/+$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** Absolute URL of the public biodata page. */
export function getPublicBiodataUrl(): string {
  const base = getSiteUrl();
  return base ? `${base}/` : '/';
}
