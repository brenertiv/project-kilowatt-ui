import { describe, expect, it } from 'vitest';
import { cardSpans } from './cardGrid';

/** The rows a run of spans makes, as the number of cards in each. */
const rows = (spans: number[]) => {
  const out: number[] = [];
  let used = 12;
  for (const s of spans) {
    if (used + s > 12) {
      out.push(0);
      used = 0;
    }
    out[out.length - 1] += 1;
    used += s;
  }
  return out;
};

describe('cardSpans', () => {
  it('lays figures in thirds and rebalances so none sits alone', () => {
    expect(cardSpans('figure', 3, 3)).toEqual([4, 4, 4]);
    expect(rows(cardSpans('figure', 4, 3))).toEqual([2, 2]);
    expect(rows(cardSpans('figure', 7, 3))).toEqual([3, 2, 2]);
    expect(rows(cardSpans('figure', 10, 3))).toEqual([3, 3, 2, 2]);
  });

  it('stacks figures that cannot pair evenly rather than leave one alone', () => {
    expect(cardSpans('figure', 3, 2)).toEqual([12, 12, 12]);
    expect(cardSpans('figure', 4, 2)).toEqual([6, 6, 6, 6]);
  });

  it('pairs charts and ends an odd count on a chart across the row', () => {
    expect(cardSpans('chart', 2, 2)).toEqual([6, 6]);
    expect(cardSpans('chart', 3, 2)).toEqual([6, 6, 12]);
    expect(cardSpans('chart', 5, 2)).toEqual([6, 6, 6, 6, 12]);
  });

  it('never leaves a row short of twelve columns', () => {
    for (const kind of ['chart', 'figure', 'collection'] as const)
      for (let perRow = 1; perRow <= 3; perRow++)
        for (let count = 1; count <= 12; count++) {
          const spans = cardSpans(kind, count, perRow);
          let used = 0;
          for (const s of spans) used = (used + s) % 12;
          expect(used, `${kind} ${count} at ${perRow}`).toBe(0);
          expect(spans.every((s) => s !== 3), 'quarters only in the feature row').toBe(true);
        }
  });
});
