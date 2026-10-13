import { format, formatDistanceStrict, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { DateRange } from '../../api/types';
import { OPERATIONS_TZ } from '../../lib/dates';

/**
 * Text for the API's dates. Calendar dates (`2026-10-13`) never shift time
 * zone; timestamps render in the operations zone the way the app's other
 * dates do. Ranges follow the API's `{ lower, upper, bounds }` shape.
 */

const calendarPattern = /^\d{4}-\d{2}-\d{2}$/;

export const noValue = '—';

export function isCalendarDate(value: string): boolean {
  return calendarPattern.test(value);
}

export function formatDateValue(value: string | null | undefined, options: { time?: boolean } = {}): string {
  if (!value) return noValue;
  if (isCalendarDate(value)) return format(parseISO(value), 'MMM d, yyyy');
  return formatInTimeZone(value, OPERATIONS_TZ, options.time === false ? 'MMM d, yyyy' : 'MMM d, yyyy HH:mm zzz');
}

/** `Nov 13 – Nov 26, 2025`, `From Nov 13, 2025`, `Until Nov 26, 2025`, or the no-value dash. */
export function formatDateRange(range: DateRange<string> | null | undefined): string {
  if (!range || (!range.lower && !range.upper)) return noValue;
  const { lower, upper } = range;
  if (lower && !upper) return `From ${formatDateValue(lower)}`;
  if (!lower && upper) return `Until ${formatDateValue(upper)}`;
  const start = parseISO(lower!);
  const end = parseISO(upper!);
  if (isCalendarDate(lower!) && isCalendarDate(upper!)) {
    if (start.getFullYear() === end.getFullYear()) return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
  }
  return `${formatInTimeZone(lower!, OPERATIONS_TZ, 'MMM d, yyyy HH:mm')} – ${formatInTimeZone(upper!, OPERATIONS_TZ, 'MMM d, yyyy HH:mm zzz')}`;
}

/** `3 days ago`, `in 2 hours`. */
export function formatRelative(value: string, now: Date = new Date()): string {
  return formatDistanceStrict(parseISO(value), now, { addSuffix: true });
}

/** Days until a calendar date, negative when it has passed. */
export function daysUntil(isoDate: string, now: Date = new Date()): number {
  const target = parseISO(isoDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
