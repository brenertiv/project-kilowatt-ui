import { describe, expect, it } from 'vitest';
import { portfolio } from '../fixtures/data';
import { countOf, latestMonthSpend } from './shared';

describe('page helpers', () => {
  it('counts a page and flags when there is more', () => {
    expect(countOf(undefined)).toEqual({ value: null, more: false });
    expect(countOf({ next: '/api/x/?cursor=1', previous: null, results: [1, 2] })).toEqual({ value: 2, more: true });
  });

  it('sums the latest billing month', () => {
    const { value, month } = latestMonthSpend(portfolio.utilityBills);
    expect(month).toMatch(/^\d{4}-\d{2}$/);
    expect(value).toBeGreaterThan(0);
    expect(latestMonthSpend([])).toEqual({ value: null, month: null });
  });
});
