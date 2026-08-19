/**
 * The contract for `data/biodata.json`.
 *
 * This module is imported by BOTH the browser bundle and the Vercel serverless
 * functions, which is deliberate: the editor validates before it asks to
 * publish, and `/api/github/update` validates again before it commits. A
 * malformed file can therefore never reach the repository, whoever calls the
 * endpoint.
 *
 * It must stay dependency-free apart from Zod so it can run on Node without a
 * bundler alias.
 */
import { z } from 'zod';

/** Trimmed, required text. */
const text = (label: string, max = 160) =>
  z
    .string({ required_error: `${label} is required.`, invalid_type_error: `${label} must be text.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

/** Trimmed text that may legitimately be blank. */
const optionalText = (label: string, max = 160) =>
  z
    .string({ invalid_type_error: `${label} must be text.` })
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .default('');

/** `26-11-2001` — the format printed on the original biodata. */
export const DATE_PATTERN = /^(\d{2})-(\d{2})-(\d{4})$/;

const dateOfBirth = z
  .string({ required_error: 'Date of birth is required.' })
  .trim()
  .regex(DATE_PATTERN, 'Date of birth must be in DD-MM-YYYY format, e.g. 26-11-2001.')
  .refine((value) => {
    const match = DATE_PATTERN.exec(value);
    if (!match) return false;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;

    // Day must exist in that month (handles leap years).
    const daysInMonth = new Date(year, month, 0).getDate();
    return day >= 1 && day <= daysInMonth;
  }, 'That date does not exist. Please check the day, month and year.');

/** Digits, spaces, dashes and an optional leading `+`. */
const phone = z
  .string({ required_error: 'Phone number is required.' })
  .trim()
  .min(1, 'Phone number is required.')
  .max(20, 'Phone number must be 20 characters or fewer.')
  .regex(/^\+?[\d\s-]+$/, 'Phone number may contain digits, spaces, dashes and a leading +.')
  .refine((value) => value.replace(/\D/g, '').length >= 7, 'Phone number looks too short.');

/**
 * A repository-relative public path such as `/images/profile.jpg`.
 * Absolute URLs are rejected on purpose: the photo lives in this repo.
 */
const profilePhoto = z
  .string({ required_error: 'Profile photo path is required.' })
  .trim()
  .min(1, 'Profile photo path is required.')
  .regex(
    /^\/images\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i,
    'Profile photo must be a path like /images/profile.jpg inside the repository.',
  );

const listItem = (label: string) =>
  z
    .string({ invalid_type_error: `${label} must be text.` })
    .trim()
    .min(1, `${label} cannot be empty.`)
    .max(120, `${label} must be 120 characters or fewer.`);

export const THEME_MODES = ['light', 'dark', 'system'] as const;
export const ACCENTS = ['champagne', 'rose', 'emerald', 'sapphire'] as const;

export const personalSchema = z.object({
  name: text('Name', 80),
  dateOfBirth,
  caste: text('Caste', 80),
  height: text('Height', 40),
  weight: text('Weight', 40),
  bloodGroup: text('Blood group', 10),
});

export const familySchema = z.object({
  fatherName: text("Father's name", 100),
  fatherOccupation: text("Father's occupation", 120),
  motherName: text("Mother's name", 100),
});

export const maternalSchema = z.object({
  relatives: z
    .array(listItem('Maternal relative'))
    .max(12, 'Please list at most 12 maternal relatives.')
    .default([]),
  address: optionalText('Maternal address', 240),
});

export const educationSchema = z.object({
  degree: text('Degree', 120),
  college: text('College', 140),
});

export const careerSchema = z.object({
  job: text('Job title', 120),
  company: text('Company', 120),
  workLocation: text('Work location', 120),
});

export const contactSchema = z.object({
  phone,
  address: text('Address', 240),
});

export const themeSchema = z.object({
  mode: z.enum(THEME_MODES, { errorMap: () => ({ message: 'Theme mode must be light, dark or system.' }) }),
  accent: z.enum(ACCENTS, { errorMap: () => ({ message: 'Accent must be champagne, rose, emerald or sapphire.' }) }),
  animations: z.boolean({ invalid_type_error: 'Animations must be true or false.' }),
});

/** The whole of `data/biodata.json`. */
export const biodataSchema = z
  .object({
    personal: personalSchema,
    family: familySchema,
    maternal: maternalSchema,
    education: educationSchema,
    career: careerSchema,
    hobbies: z.array(listItem('Hobby')).max(20, 'Please list at most 20 hobbies.').default([]),
    contact: contactSchema,
    profilePhoto,
    theme: themeSchema,
  })
  .strict('Unknown field in biodata.json — remove it before publishing.');

export type Biodata = z.infer<typeof biodataSchema>;
export type ThemeMode = Biodata['theme']['mode'];
export type Accent = Biodata['theme']['accent'];

/** A dotted field path (`personal.name`) paired with its message. */
export interface FieldIssue {
  path: string;
  message: string;
}

/** Flattens a Zod error into `personal.name → Name is required.` pairs. */
export function toFieldIssues(error: z.ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

export interface ValidationResult {
  success: boolean;
  data?: Biodata;
  issues: FieldIssue[];
}

/** Validates an unknown value against the schema without throwing. */
export function validateBiodata(value: unknown): ValidationResult {
  const result = biodataSchema.safeParse(value);
  if (result.success) return { success: true, data: result.data, issues: [] };
  return { success: false, issues: toFieldIssues(result.error) };
}

/**
 * Serialises biodata exactly the way it should be stored: 2-space indented,
 * key order fixed by the schema, with a trailing newline. Stable formatting
 * keeps GitHub diffs readable and avoids no-op commits.
 */
export function serializeBiodata(biodata: Biodata): string {
  const ordered: Biodata = {
    personal: {
      name: biodata.personal.name,
      dateOfBirth: biodata.personal.dateOfBirth,
      caste: biodata.personal.caste,
      height: biodata.personal.height,
      weight: biodata.personal.weight,
      bloodGroup: biodata.personal.bloodGroup,
    },
    family: {
      fatherName: biodata.family.fatherName,
      fatherOccupation: biodata.family.fatherOccupation,
      motherName: biodata.family.motherName,
    },
    maternal: {
      relatives: [...biodata.maternal.relatives],
      address: biodata.maternal.address,
    },
    education: {
      degree: biodata.education.degree,
      college: biodata.education.college,
    },
    career: {
      job: biodata.career.job,
      company: biodata.career.company,
      workLocation: biodata.career.workLocation,
    },
    hobbies: [...biodata.hobbies],
    contact: {
      phone: biodata.contact.phone,
      address: biodata.contact.address,
    },
    profilePhoto: biodata.profilePhoto,
    theme: {
      mode: biodata.theme.mode,
      accent: biodata.theme.accent,
      animations: biodata.theme.animations,
    },
  };

  return `${JSON.stringify(ordered, null, 2)}\n`;
}
