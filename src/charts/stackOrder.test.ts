// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSchemeTheme } from '../mui/theme';
import { stackOrder } from './stackOrder';

const dark = '#102030';
const middle = '#508090';
const light = '#d0d8e0';

describe('the order of a stack', () => {
  it('runs a column darkest at the bottom to lightest at the top, reversed in dark', () => {
    expect(stackOrder([middle, light, dark], 'light')).toEqual([2, 0, 1]);
    expect(stackOrder([middle, light, dark], 'dark')).toEqual([1, 0, 2]);
  });

  it('runs a bar lightest at the left to darkest at the right, reversed in dark', () => {
    expect(stackOrder([middle, light, dark], 'light', true)).toEqual([1, 0, 2]);
    expect(stackOrder([middle, light, dark], 'dark', true)).toEqual([2, 0, 1]);
  });

  it('keeps parts of one color in the order they are given', () => {
    expect(stackOrder([middle, dark, middle], 'light')).toEqual([1, 0, 2]);
    expect(stackOrder([middle, dark, middle], 'dark')).toEqual([0, 2, 1]);
  });

  it('spans every series color and the neutral, across ramps', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const { chart } = createSchemeTheme(scheme).palette;
      const colors = [...chart.series, chart.neutral];
      const order = stackOrder(colors, scheme);
      expect([...order].sort()).toEqual(colors.map((_, i) => i));
      // Slot 4 is light's darkest series color and slot 3 is dark's lightest: each sits at the bottom of a column.
      expect(order[0]).toBe(scheme === 'light' ? 4 : 3);
    }
  });
});
