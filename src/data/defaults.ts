import type { BiodataEditableFields } from '@/types';

/**
 * The original biodata, exactly as it appears in the source PDF.
 *
 * This mirrors `supabase/seed.sql` and backs the admin's "Reset to default"
 * action. It is *not* a data source for the UI — every rendered value comes
 * from Supabase. Nothing here is invented; fields the PDF does not contain are
 * absent.
 */
export const DEFAULT_BIODATA: BiodataEditableFields = {
  name: 'Darshit Gadhiya',
  date_of_birth: '2001-11-26',
  caste: 'Leuva Patel',
  height: '5 feet 6 inches',
  weight: '75 Kg',
  blood_group: 'B+',

  father_name: 'Dilipbhai Manjibhai Gadhiya',
  father_occupation: 'Agriculture (27 Vigha)',
  mother_name: 'Kanchanben',

  maternal_address: 'At. Bandharda\nTa. Gir Gadhada\nDist. Gir Somnath',

  degree: 'B.Tech in Computer',
  college: 'Darshan University Rajkot',

  job_title: 'Software Engineer',
  company: 'Technomark Solutions',
  work_location: 'Ahemedabad',

  phone: '7069306559',
  address: 'Kanakiya\nTa. Gir Gadhada\nDist. Gir Somnath',
};

export const DEFAULT_MATERNAL_RELATIVES = ['Jaysukhbhai Nanubhai Borad', 'Rasikbhai Nanubhai Borad'];

export const DEFAULT_HOBBIES = ['Movies', 'Cricket'];

/** Photo shipped with the app, used until an admin uploads one to Storage. */
export const DEFAULT_PROFILE_PHOTO_URL = '/profile-photo.jpg';
