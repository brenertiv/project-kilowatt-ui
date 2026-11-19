import { describe, expect, it } from 'vitest';
import { hasNoValue, rowAtDate } from './missingPeriod';

describe('hasNoValue', () => {
  it('is true when every series field is absent, null or not a number', () => {
    expect(hasNoValue({ month: 'Mar' }, ['use'])).toBe(true);
    expect(hasNoValue({ month: 'Mar', use: null, cost: Number.NaN }, ['use', 'cost'])).toBe(true);
  });
  it('is false when any series has a value, zero included', () => {
    expect(hasNoValue({ month: 'Mar', use: 0 }, ['use'])).toBe(false);
    expect(hasNoValue({ month: 'Mar', cost: 12 }, ['use', 'cost'])).toBe(false);
  });
});

describe('rowAtDate', () => {
  const day = 86_400_000;
  const rows: Record<string, number>[] = [{ date: 0, use: 4 }, { date: 30 * day }, { date: 61 * day, use: 6 }];
  it('finds the row whose interval holds the timestamp', () => {
    expect(rowAtDate(rows, 'date', 45 * day, 30 * day)).toBe(rows[1]);
    expect(rowAtDate(rows, 'date', 61 * day, 30 * day)).toBe(rows[2]);
  });
  it('finds none before the first row or past the last interval', () => {
    expect(rowAtDate(rows, 'date', -day, 30 * day)).toBeUndefined();
    expect(rowAtDate(rows, 'date', 120 * day, 30 * day)).toBeUndefined();
  });
});
