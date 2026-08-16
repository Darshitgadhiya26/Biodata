import type { BiodataRow, HobbyRow, MaternalRelativeRow } from './database';

/** A marriage biodata profile as the UI consumes it. */
export type Biodata = BiodataRow;

/** A single hobby / interest entry. */
export type Hobby = HobbyRow;

/** A single maternal-side relative. */
export type MaternalRelative = MaternalRelativeRow;

/** The signed-in administrator (a Supabase Auth user). */
export interface AdminUser {
  id: string;
  email: string | null;
  lastSignInAt: string | null;
}

/** Everything the public page and the live preview need to render. */
export interface BiodataBundle {
  biodata: Biodata;
  hobbies: Hobby[];
  maternalRelatives: MaternalRelative[];
}

/** Fields an admin may edit. Server-managed columns are deliberately absent. */
export type BiodataEditableFields = Pick<
  Biodata,
  | 'name'
  | 'date_of_birth'
  | 'caste'
  | 'height'
  | 'weight'
  | 'blood_group'
  | 'father_name'
  | 'father_occupation'
  | 'mother_name'
  | 'maternal_address'
  | 'degree'
  | 'college'
  | 'job_title'
  | 'company'
  | 'work_location'
  | 'phone'
  | 'address'
>;

export type BiodataUpdate = Partial<BiodataEditableFields> & {
  profile_photo_url?: string | null;
  profile_photo_path?: string | null;
  is_published?: boolean;
};

/** A draft ordered item used by the hobbies / maternal editors. */
export interface OrderedItemInput {
  name: string;
  display_order: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

/** Normalised error surfaced by the service layer. */
export class BiodataError extends Error {
  readonly cause?: unknown;
  readonly code?: string;

  constructor(message: string, options?: { cause?: unknown; code?: string }) {
    super(message);
    this.name = 'BiodataError';
    this.cause = options?.cause;
    this.code = options?.code;
  }
}
