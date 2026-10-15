import type { DateRange } from '../../api/types';
import { formatDateRange, formatDateValue, formatRelative, noValue } from './dateFormat';

export type DateTextProps = {
  /** A calendar date (`YYYY-MM-DD`) or a timestamp with an offset, exactly as the API sends it. Empty shows the no-value dash. */
  value: string | null | undefined;
  /** For timestamps, `false` drops the time of day and shows the date only. Calendar dates never show a time. Defaults to showing the time. */
  time?: boolean;
};

/**
 * A calendar date or timestamp as the API sends it, with the raw value available to assistive tech and on hover.
 * Calendar dates never shift time zone; timestamps render in the operations zone. Use it for every absolute date;
 * use `RelativeTime` for recency and `DateRangeText` for `{ lower, upper }` ranges. In a table, use `DateCell`.
 *
 * @summary An API date or timestamp formatted in the operations zone, inside a `<time>` element.
 * @import import { DateText } from 'src/components/data';
 */
export function DateText({ value, time }: DateTextProps) {
  if (!value) return <>{noValue}</>;
  return (
    <time dateTime={value} title={value}>
      {formatDateValue(value, { time })}
    </time>
  );
}

export type RelativeTimeProps = {
  /** A timestamp or calendar date as the API sends it. Empty shows the no-value dash. */
  value: string | null | undefined;
  /** The moment to measure from. Defaults to the current time; pass a fixed date in stories and tests so the text is stable. */
  now?: Date;
};

/**
 * "3 days ago", with the absolute time on hover. Use it for recency, such as when an alert was last evaluated.
 * For a due date or anything the reader plans around, use `DateText`.
 *
 * @summary A relative time phrase ("3 days ago") with the absolute date on hover.
 * @import import { RelativeTime } from 'src/components/data';
 */
export function RelativeTime({ value, now }: RelativeTimeProps) {
  if (!value) return <>{noValue}</>;
  return (
    <time dateTime={value} title={formatDateValue(value)}>
      {formatRelative(value, now)}
    </time>
  );
}

export type DateRangeTextProps = {
  /** The API's `{ lower, upper, bounds }` range. An open end reads "From …" or "Until …"; no range, or no ends, shows the no-value dash. */
  range: DateRange<string> | null | undefined;
};

/**
 * The API's `{ lower, upper, bounds }` range as one phrase, such as a work order's schedule or an alert's period.
 * Use it instead of two `DateText`s joined by hand.
 *
 * @summary An API date range as one phrase, with open ends as "From" or "Until".
 * @import import { DateRangeText } from 'src/components/data';
 */
export function DateRangeText({ range }: DateRangeTextProps) {
  return <>{formatDateRange(range)}</>;
}
