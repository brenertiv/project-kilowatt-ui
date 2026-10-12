import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const OPERATIONS_TZ = 'America/New_York';

export function formatOperationsTime(iso: string) {
  return formatInTimeZone(iso, OPERATIONS_TZ, 'MMM d, HH:mm zzz');
}

/** Formats a calendar date (`yyyy-MM-dd`) with no time-zone shift. */
export function formatCalendarDate(isoDate: string) {
  return format(parseISO(isoDate), 'MMM d, yyyy');
}
