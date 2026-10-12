import { describe, expect, it } from 'vitest';
import { chartSeriesIds, defaultDarkColors, defaultTheme, resolveTheme } from '../tokens';
import {
  assignSeriesColors,
  categoricalPalette,
  divergingRamp,
  hexToOklch,
  luminance,
  oklchToHex,
  rampIndex,
  sequentialRamp,
} from './color';

const dark = resolveTheme(defaultTheme, defaultDarkColors, 'dark');

describe('chart color', () => {
  it('round-trips hex through OKLCH within a channel step', () => {
    for (const hex of ['#2a78d6', '#eb6834', '#008300', '#f9fafc', '#0d212a']) {
      const back = oklchToHex(hexToOklch(hex));
      const [r1, g1, b1] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
      const [r2, g2, b2] = [1, 3, 5].map((i) => Number.parseInt(back.slice(i, i + 2), 16));
      expect(Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)).toBeLessThanOrEqual(3);
    }
  });

  it('exposes eight categorical slots in token order for both schemes', () => {
    expect(categoricalPalette(defaultTheme)).toEqual(chartSeriesIds.map((id) => defaultTheme[id]));
    expect(categoricalPalette(dark)).toEqual(chartSeriesIds.map((id) => defaultDarkColors[id]));
    expect(new Set(categoricalPalette(defaultTheme)).size).toBe(8);
  });

  it('keeps a color with its series id when the series list is filtered', () => {
    const full = assignSeriesColors(['hvac', 'lighting', 'plug'], defaultTheme);
    const filtered = assignSeriesColors(['hvac', 'plug'], defaultTheme);
    expect(filtered.hvac).toBe(full.hvac);
    expect(filtered.plug).toBe(defaultTheme.chart2);
  });

  it('refuses a ninth series instead of cycling hues', () => {
    const ids = Array.from({ length: 9 }, (_, index) => `s${index}`);
    expect(() => assignSeriesColors(ids, defaultTheme)).toThrow(/Fold the tail/);
  });

  it('builds a one-hue sequential ramp with monotone lightness that flips in dark mode', () => {
    const light = sequentialRamp(defaultTheme.chart1, 7, 'light').map((hex) => hexToOklch(hex));
    const darkRamp = sequentialRamp(dark.chart1, 7, 'dark').map((hex) => hexToOklch(hex));
    for (let index = 1; index < light.length; index += 1) {
      expect(light[index].l).toBeLessThan(light[index - 1].l - 0.05);
      expect(darkRamp[index].l).toBeGreaterThan(darkRamp[index - 1].l + 0.05);
    }
    const hues = light.map((step) => step.h);
    expect(Math.max(...hues) - Math.min(...hues)).toBeLessThan(10);
  });

  it('builds a diverging ramp with a neutral midpoint and equal arms', () => {
    const ramp = divergingRamp(defaultTheme.negative, defaultTheme.positive, defaultTheme.track, 3);
    expect(ramp).toHaveLength(7);
    expect(ramp[3]).toBe(defaultTheme.track);
    expect(luminance(ramp[0])).toBeLessThan(luminance(ramp[2]));
    expect(luminance(ramp[6])).toBeLessThan(luminance(ramp[4]));
  });

  it('maps values onto ramp steps inclusively at both ends', () => {
    expect(rampIndex(0, 0, 100, 5)).toBe(0);
    expect(rampIndex(100, 0, 100, 5)).toBe(4);
    expect(rampIndex(50, 0, 100, 5)).toBe(2);
    expect(rampIndex(5, 5, 5, 5)).toBe(0);
  });
});
