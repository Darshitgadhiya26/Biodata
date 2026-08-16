import type { PostgrestError } from '@supabase/supabase-js';
import { BiodataError } from '@/types';

/**
 * Turns a raw Postgres/PostgREST error into something we are willing to show a
 * human, without leaking schema internals.
 */
export function toBiodataError(error: PostgrestError | Error | null, fallback: string): BiodataError {
  if (!error) return new BiodataError(fallback);

  const code = 'code' in error ? String(error.code ?? '') : undefined;

  switch (code) {
    case '42501': // insufficient_privilege — an RLS policy rejected the write
      return new BiodataError('You are not allowed to make this change. Please sign in again.', {
        cause: error,
        code,
      });
    case '23505': // unique_violation
      return new BiodataError('That entry already exists.', { cause: error, code });
    case '23514': // check_violation
      return new BiodataError('Some values were rejected by the database. Please review the form.', {
        cause: error,
        code,
      });
    case '23503': // foreign_key_violation
      return new BiodataError('That record no longer exists. Refresh and try again.', { cause: error, code });
    case 'PGRST301':
      return new BiodataError('Your session has expired. Please sign in again.', { cause: error, code });
    default:
      break;
  }

  const message = error.message ?? '';
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return new BiodataError('Could not reach the server. Check your connection and try again.', {
      cause: error,
      code,
    });
  }

  return new BiodataError(fallback, { cause: error, code });
}

/** Extracts a displayable message from anything thrown. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof BiodataError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
