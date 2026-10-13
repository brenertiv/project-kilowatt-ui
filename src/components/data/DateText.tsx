import type { DateRange } from '../../api/types';
import { formatDateRange, formatDateValue, formatRelative, noValue } from './dateFormat';

/** A calendar date or timestamp as the API sends it, with the raw value available to assistive tech and on hover. */
export function DateText({ value, time }: { value: string | null | undefined; time?: boolean }) {
  if (!value) return <>{noValue}</>;
  return (
    <time dateTime={value} title={value}>
      {formatDateValue(value, { time })}
    </time>
  );
}

/** "3 days ago", with the absolute time on hover. */
export function RelativeTime({ value, now }: { value: string | null | undefined; now?: Date }) {
  if (!value) return <>{noValue}</>;
  return (
    <time dateTime={value} title={formatDateValue(value)}>
      {formatRelative(value, now)}
    </time>
  );
}

/** The API's `{ lower, upper, bounds }` range as one phrase. */
export function DateRangeText({ range }: { range: DateRange<string> | null | undefined }) {
  return <>{formatDateRange(range)}</>;
}
