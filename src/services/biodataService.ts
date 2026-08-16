import { assertSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Biodata, BiodataUpdate } from '@/types';
import { BiodataError } from '@/types';
import { DEFAULT_BIODATA, DEFAULT_PROFILE_PHOTO_URL } from '@/data/defaults';
import { toBiodataError } from './errors';

const TABLE = 'biodata';

/**
 * Reads the biodata profile.
 *
 * Anonymous callers only ever see published rows — that filter is enforced by
 * RLS, not by this query. Returns `null` when the database has not been seeded.
 */
export async function getBiodata(): Promise<Biodata | null> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw toBiodataError(error, 'Unable to load biodata. Please try again.');
  return data;
}

/** Applies a partial update and returns the saved row. */
export async function updateBiodata(id: string, patch: BiodataUpdate): Promise<Biodata> {
  assertSupabaseConfigured();

  if (!id) throw new BiodataError('Cannot save: the biodata profile has not been created yet.');

  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', id).select('*').single();

  if (error) throw toBiodataError(error, 'Unable to save changes. Please try again.');
  if (!data) throw new BiodataError('Unable to save changes. Please try again.');

  return data;
}

/**
 * Creates the profile from the original PDF values.
 * Used only when an admin opens a project whose database has not been seeded.
 */
export async function createBiodataFromDefaults(): Promise<Biodata> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...DEFAULT_BIODATA, profile_photo_url: DEFAULT_PROFILE_PHOTO_URL, is_published: true })
    .select('*')
    .single();

  if (error) throw toBiodataError(error, 'Unable to create the biodata profile.');
  return data;
}

/**
 * Restores every editable field to the original PDF values.
 * The profile photo is intentionally left alone — resetting text should not
 * silently delete an uploaded photograph.
 */
export async function resetBiodataToDefaults(id: string): Promise<Biodata> {
  return updateBiodata(id, { ...DEFAULT_BIODATA });
}

/** Toggles whether anonymous visitors can see the profile. */
export async function setPublished(id: string, isPublished: boolean): Promise<Biodata> {
  return updateBiodata(id, { is_published: isPublished });
}
