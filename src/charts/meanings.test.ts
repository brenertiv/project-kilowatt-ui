// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { actionStatuses, actionTypes, utilityBillTypes } from '../fixtures/data';
import { meaningColor, scoreBands, utilitySlots, workOrderStatusIntents, workOrderTypeSlots } from './meanings';

const series = 6;

describe.each([
  ['utilitySlots', utilitySlots],
  ['workOrderTypeSlots', workOrderTypeSlots],
])('%s', (_name, slots) => {
  it('gives each meaning its own series slot', () => {
    const taken = Object.values(slots);
    expect(new Set(taken).size).toBe(taken.length);
    for (const slot of taken) expect(slot).toBeGreaterThanOrEqual(0);
    for (const slot of taken) expect(slot).toBeLessThan(series);
  });
});

describe('meanings', () => {
  it('cover every utility type and work-order status the API serves', () => {
    for (const { name } of utilityBillTypes) expect(utilitySlots, name).toHaveProperty([name]);
    for (const { name } of actionStatuses) expect(workOrderStatusIntents, name).toHaveProperty([name]);
    // Survey, the seventh, is drawn neutral: the palette has six hues.
    expect(actionTypes.filter(({ name }) => !(name in workOrderTypeSlots)).map(({ name }) => name)).toEqual(['Survey']);
  });

  it('draw a meaning without a slot as neutral', () => {
    expect(meaningColor(utilitySlots, 'Natural Gas')).toEqual({ slot: 5 });
    expect(meaningColor(utilitySlots, 'Gas natural')).toEqual({ neutral: true });
  });

  it('read scores in bands that cover 0 to 100 without a gap, best first', () => {
    expect(scoreBands[0].to).toBe(100);
    expect(scoreBands[scoreBands.length - 1].from).toBe(0);
    for (let i = 1; i < scoreBands.length; i++) expect(scoreBands[i].to).toBe(scoreBands[i - 1].from);
  });
});
