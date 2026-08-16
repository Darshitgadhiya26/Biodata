import { z } from 'zod';

/**
 * Client-side validation. It exists to give the admin fast, clear feedback —
 * the authoritative constraints live in Postgres (CHECK constraints) and the
 * authoritative authorisation lives in RLS.
 */

/** Trims, and turns an empty string into `null` so blanks are not stored as ''. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .default(null);

const requiredText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const personalSchema = z.object({
  name: requiredText(120, 'Name'),
  date_of_birth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker (YYYY-MM-DD)')
    .refine((value) => {
      const time = new Date(`${value}T00:00:00`).getTime();
      return !Number.isNaN(time) && time <= Date.now();
    }, 'Date of birth cannot be in the future')
    .or(z.literal(''))
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .default(null),
  caste: optionalText(80, 'Caste'),
  height: optionalText(40, 'Height'),
  weight: optionalText(40, 'Weight'),
  blood_group: optionalText(10, 'Blood group'),
});

export const familySchema = z.object({
  father_name: optionalText(120, "Father's name"),
  father_occupation: optionalText(160, "Father's occupation"),
  mother_name: optionalText(120, "Mother's name"),
});

export const maternalSchema = z.object({
  maternal_address: optionalText(300, 'Maternal address'),
});

export const educationSchema = z.object({
  degree: optionalText(160, 'Degree'),
  college: optionalText(160, 'College'),
});

export const careerSchema = z.object({
  job_title: optionalText(120, 'Job title'),
  company: optionalText(120, 'Company'),
  work_location: optionalText(120, 'Work location'),
});

export const contactSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[\d+\-\s()]{6,20}$/, 'Enter a valid phone number')
    .or(z.literal(''))
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .default(null),
  address: optionalText(300, 'Address'),
});

/** Every editable biodata field in one schema, used by the full-form save. */
export const biodataSchema = personalSchema
  .merge(familySchema)
  .merge(maternalSchema)
  .merge(educationSchema)
  .merge(careerSchema)
  .merge(contactSchema);

export const orderedItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Keep it under 80 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type PersonalFormValues = z.input<typeof personalSchema>;
export type BiodataFormValues = z.input<typeof biodataSchema>;
export type BiodataFormOutput = z.output<typeof biodataSchema>;
export type OrderedItemFormValues = z.input<typeof orderedItemSchema>;
export type LoginFormValues = z.input<typeof loginSchema>;
