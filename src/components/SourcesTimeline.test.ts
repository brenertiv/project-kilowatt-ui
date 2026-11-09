// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { gapsOf, spansOf } from './SourcesTimeline';

const months = (pattern: string) => [...pattern].map((c) => c === 'x');

describe('spansOf', () => {
  it('joins consecutive months into runs', () => {
    expect(spansOf(months('xx.xxx..x'))).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 6 },
      { start: 8, end: 9 },
    ]);
  });
});

describe('gapsOf', () => {
  it('hatches the holes between runs, not the months before the first', () => {
    expect(gapsOf(months('..xx.xxxxx'))).toEqual([{ start: 4, end: 5 }]);
  });

  it('allows a silence at the end up to the billing lag', () => {
    expect(gapsOf(months('xxxxxxxxxx..'))).toEqual([]);
    expect(gapsOf(months('xxxxxxxxx...'))).toEqual([{ start: 9, end: 12 }]);
    expect(gapsOf(months('xxxxxxxxxx..'), 1)).toEqual([{ start: 10, end: 12 }]);
  });

  it('hatches the whole axis for a source that reported nothing', () => {
    expect(gapsOf(months('......'))).toEqual([{ start: 0, end: 6 }]);
    expect(gapsOf([])).toEqual([]);
  });
});
