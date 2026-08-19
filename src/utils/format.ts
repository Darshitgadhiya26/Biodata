/**
 * Presentation helpers.
 *
 * Nothing here invents data — a missing value stays missing so the UI can
 * decide how to render the gap. Dates arrive as `DD-MM-YYYY`, the format
 * printed on the original biodata and stored in `data/biodata.json`.
 */
import { DATE_PATTERN } from './biodata-schema';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

interface ParsedDate {
  day: number;
  month: number;
  year: number;
}

/** Parses `26-11-2001` without any timezone involvement. */
export function parseDate(value: string | null | undefined): ParsedDate | null {
  if (!value) return null;

  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { day, month, year };
}

/** `26-11-2001` → `26 November 2001` */
export function formatDateLong(value: string | null | undefined): string {
  const parsed = parseDate(value);
  if (!parsed) return value ?? '';
  return `${parsed.day} ${MONTHS[parsed.month - 1]} ${parsed.year}`;
}

/** `26-11-2001` → `26 Nov 2001` — compact enough for the hero chips. */
export function formatDateMedium(value: string | null | undefined): string {
  const parsed = parseDate(value);
  if (!parsed) return value ?? '';
  return `${parsed.day} ${MONTHS[parsed.month - 1].slice(0, 3)} ${parsed.year}`;
}

/** Value for an `<input type="date">` (`YYYY-MM-DD`). */
export function toDateInputValue(value: string | null | undefined): string {
  const parsed = parseDate(value);
  if (!parsed) return '';
  return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
}

/** `YYYY-MM-DD` from a date input back to the stored `DD-MM-YYYY`. */
export function fromDateInputValue(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value.trim();
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/** Whole years between the date of birth and today. */
export function calculateAge(value: string | null | undefined, now: Date = new Date()): number | null {
  const parsed = parseDate(value);
  if (!parsed) return null;

  let age = now.getFullYear() - parsed.year;
  const beforeBirthday =
    now.getMonth() + 1 < parsed.month || (now.getMonth() + 1 === parsed.month && now.getDate() < parsed.day);
  if (beforeBirthday) age -= 1;

  return age >= 0 && age < 130 ? age : null;
}

/** `7069306559` → `70693 06559` (grouped for readability, digits untouched). */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return value;
}

/** `tel:` href — strips spaces but preserves a leading `+`. */
export function telHref(value: string | null | undefined): string {
  if (!value) return '';
  return `tel:${value.replace(/[^\d+]/g, '')}`;
}

/**
 * Splits an address into display lines. Both real newlines and the commas used
 * in the original biodata (`Kanakiya, Ta. Gir Gadhada, Dist. Gir Somnath`)
 * become separate lines, which is how the printed sheet reads.
 */
export function toLines(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Renders an address on one line, e.g. for meta descriptions. */
export function toInlineAddress(value: string | null | undefined): string {
  return toLines(value).join(', ');
}

/** `Darshit Gadhiya` → `DG`, used by the photo placeholder. */
export function initials(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Human-friendly absolute timestamp. */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Relative time such as "3 minutes ago"; falls back to an absolute stamp. */
export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const divisions: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34524, 'week'],
    [12, 'month'],
  ];

  let duration = seconds / 60;
  let unit: Intl.RelativeTimeFormatUnit = 'minute';

  for (const [amount, nextUnit] of divisions) {
    if (Math.abs(duration) < amount) break;
    duration /= amount;
    unit = nextUnit;
  }

  if (unit === 'month' && Math.abs(duration) >= 12) return formatTimestamp(value);
  return formatter.format(-Math.round(duration), unit);
}

/** Formats a byte count for upload feedback. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Turns `personal.dateOfBirth` into `Personal › Date of birth` for errors. */
export function humanizePath(path: string): string {
  return path
    .split('.')
    .map((segment) =>
      /^\d+$/.test(segment)
        ? `#${Number(segment) + 1}`
        : segment
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (character) => character.toUpperCase())
            .trim(),
    )
    .join(' › ');
}
