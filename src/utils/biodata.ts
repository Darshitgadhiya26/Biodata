/**
 * The public website's data source.
 *
 * `data/biodata.json` is imported at build time, so the deployed site ships the
 * data inside its bundle: no runtime request, no loading spinner, no database.
 * Publishing from the admin dashboard commits a new JSON file, Vercel rebuilds,
 * and this import picks up the new values.
 *
 * It is validated on load rather than trusted, so a hand-edited file that has
 * drifted from the schema shows a clear error instead of a broken page.
 */
import rawBiodata from '../../data/biodata.json';
import { validateBiodata, type Biodata, type FieldIssue } from './biodata-schema';

export interface LoadedBiodata {
  data: Biodata | null;
  issues: FieldIssue[];
}

function load(): LoadedBiodata {
  const result = validateBiodata(rawBiodata);
  return { data: result.data ?? null, issues: result.issues };
}

/** Parsed once per page load — the file cannot change without a redeploy. */
export const loadedBiodata: LoadedBiodata = load();

/** Where the JSON lives, quoted in error messages and the README. */
export const BIODATA_FILE = 'data/biodata.json';
