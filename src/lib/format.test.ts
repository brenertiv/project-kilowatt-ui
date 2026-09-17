import { describe, expect, it } from 'vitest';
import { formatCount, formatKilowatts, formatPercent } from './format';

describe('number formatters', () => {
  it('formats integer counts with grouping', () => {
    expect(formatCount(12853)).toBe('12,853');
  });

  it('formats percents to one decimal place', () => {
    expect(formatPercent(0.056)).toBe('5.6%');
  });

  it('formats kilowatts with a unit suffix', () => {
    expect(formatKilowatts(412)).toBe('412 kW');
  });
});
