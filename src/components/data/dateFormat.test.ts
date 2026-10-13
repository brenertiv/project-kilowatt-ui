import { describe, expect, it } from 'vitest';
import { daysUntil, formatDateRange, formatDateValue, formatRelative } from './dateFormat';

describe('formatDateValue', () => {
  it('formats calendar dates without a time-zone shift and timestamps in the operations zone', () => {
    expect(formatDateValue('2026-10-13')).toBe('Oct 13, 2026');
    expect(formatDateValue('2026-10-13T07:13:49.425673-04:00')).toBe('Oct 13, 2026 07:13 EDT');
    expect(formatDateValue(null)).toBe('—');
  });
});

describe('formatDateRange', () => {
  it('collapses the year for same-year calendar ranges and handles open ends', () => {
    expect(formatDateRange({ lower: '2025-11-13', upper: '2025-11-26', bounds: '[)' })).toBe('Nov 13 – Nov 26, 2025');
    expect(formatDateRange({ lower: '2025-12-20', upper: '2026-01-05', bounds: '[)' })).toBe(
      'Dec 20, 2025 – Jan 5, 2026',
    );
    expect(formatDateRange({ lower: '2025-11-13', upper: null, bounds: '[)' })).toBe('From Nov 13, 2025');
    expect(formatDateRange({ lower: null, upper: '2025-11-26', bounds: '[)' })).toBe('Until Nov 26, 2025');
    expect(formatDateRange(null)).toBe('—');
  });

  it('keeps times for timestamp ranges', () => {
    expect(
      formatDateRange({ lower: '2020-01-28T19:00:00-05:00', upper: '2020-01-29T19:00:00-05:00', bounds: '[)' }),
    ).toBe('Jan 28, 2020 19:00 – Jan 29, 2020 19:00 EST');
  });
});

describe('relative time', () => {
  const now = new Date('2026-10-13T12:00:00-04:00');
  it('phrases distance from now and counts days to a date', () => {
    expect(formatRelative('2026-10-10T12:00:00-04:00', now)).toBe('3 days ago');
    expect(daysUntil('2026-10-20', now)).toBe(7);
    expect(daysUntil('2026-10-06', now)).toBe(-7);
  });
});
