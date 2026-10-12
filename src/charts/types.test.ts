import { describe, expect, it } from 'vitest';
import { downsample, toRows, xValues, type ChartData } from './types';

const data: ChartData = {
  series: [
    { id: 'a', label: 'A', points: [{ x: 'Mon', y: 1 }, { x: 'Tue', y: 2 }] },
    { id: 'b', label: 'B', points: [{ x: 'Tue', y: 3 }, { x: 'Wed', y: null }] },
  ],
};

describe('chart data adapters', () => {
  it('unions x values in first-seen order', () => {
    expect(xValues(data)).toEqual(['Mon', 'Tue', 'Wed']);
  });

  it('pivots series into rows keyed by x with one field per series', () => {
    expect(toRows(data)).toEqual([
      { x: 'Mon', a: 1 },
      { x: 'Tue', a: 2, b: 3 },
      { x: 'Wed', b: null },
    ]);
  });

  it('downsamples long series while keeping the last point', () => {
    const long = { id: 'l', label: 'L', points: Array.from({ length: 1000 }, (_, i) => ({ x: i, y: i })) };
    const short = downsample(long, 100);
    expect(short.points.length).toBeLessThanOrEqual(101);
    expect(short.points.at(-1)?.x).toBe(999);
    expect(downsample(data.series[0], 10)).toBe(data.series[0]);
  });
});
