import { formatInTimeZone } from 'date-fns-tz';

export const OPERATIONS_TZ = 'America/New_York';

export function formatOperationsTime(iso: string) {
  return formatInTimeZone(iso, OPERATIONS_TZ, 'MMM d, HH:mm zzz');
}
