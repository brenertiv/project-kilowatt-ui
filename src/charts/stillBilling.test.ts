// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { isStillBilling, stillBillingCaption, stillBillingNote } from './stillBilling';

describe('the still-being-billed rule', () => {
  it('holds a month while fewer than nine in ten properties have a bill, and lets it go at nine in ten', () => {
    expect(isStillBilling(8, 10)).toBe(true);
    expect(isStillBilling(9, 10)).toBe(false);
    expect(isStillBilling(16, 18)).toBe(true);
    expect(isStillBilling(17, 18)).toBe(false);
    expect(isStillBilling(18, 18)).toBe(false);
  });

  it('has nothing to hold with no properties in scope', () => {
    expect(isStillBilling(0, 0)).toBe(false);
  });

  it('says how many properties are billed, in the tooltip and under the chart', () => {
    expect(stillBillingNote({ billed: 9, properties: 18 })).toBe('Still being billed: 9 of 18 properties');
    expect(stillBillingNote({ billed: 0, properties: 1 })).toBe('Still being billed: 0 of 1 property');
    expect(stillBillingCaption([], String)).toBeUndefined();
    expect(stillBillingCaption([{ month: 'Oct', billed: 9, properties: 18 }], String)).toBe('Still being billed: 9 of 18 properties');
    expect(
      stillBillingCaption(
        [
          { month: 'Sep', billed: 15, properties: 18 },
          { month: 'Oct', billed: 9, properties: 18 },
        ],
        String,
      ),
    ).toBe('Still being billed: Sep, 15 of 18 properties; Oct, 9 of 18 properties');
  });
});
