import { decomposeColor, rgbToHex, type Palette } from '@mui/material/styles';

/**
 * A deviation's colors (Rules → Charts → Deviation from a midpoint): a distance either side of a
 * midpoint where one direction is worse. The worse side takes `error`, the better side `chart.neutral`,
 * each in four steps of strength over the surface it's drawn on; no change takes `action.hover`. Only
 * the worse side signals, so the cells that need attention are the only ones in color. Charts and maps
 * take these from `chartColors` and `mapColors`; nothing else blends them.
 */

/** Each step's strength over the surface, from the midpoint outward. */
export const deviationStrengths = [0.25, 0.5, 0.75, 1] as const;

/** Which side of the midpoint is worse: `'above'` where less is better (energy, cost, emissions), `'below'` where more is (occupancy, coverage). */
export type WorseSide = 'above' | 'below';

/** A color over a surface at a strength, as a solid hex, since a canvas or a map can't blend through CSS. */
export function over(color: string, surface: string, strength = 1): string {
  const fg = decomposeColor(color).values;
  const bg = decomposeColor(surface).values;
  const alpha = (fg[3] ?? 1) * strength;
  return rgbToHex(`rgb(${[0, 1, 2].map((i) => Math.round(fg[i] * alpha + bg[i] * (1 - alpha))).join(', ')})`);
}

/**
 * A deviation's colors over one surface, as solid hex: the worse and better steps from the midpoint
 * outward, and the midpoint itself.
 *
 * @param palette - The scheme's palette.
 * @param surface - What the marks sit on: the card surface for a chart, the land for a map.
 */
export function deviationSteps(palette: Palette, surface: string) {
  return {
    worse: deviationStrengths.map((strength) => over(palette.error.main, surface, strength)),
    better: deviationStrengths.map((strength) => over(palette.chart.neutral, surface, strength)),
    /** No change: the range-band color. */
    midpoint: over(palette.action.hover, surface),
  };
}

/**
 * A value's step on a deviation scale: 1 to 4 by its distance from 0 against `cap`, or 0 for no change,
 * and whether it's on the worse side.
 *
 * @param value - The signed distance from the midpoint.
 * @param cap - The distance at which the color reaches full strength.
 * @param worse - Which side is worse. Default `'above'`.
 */
export function deviationStep(value: number, cap: number, worse: WorseSide = 'above'): { step: number; worse: boolean } {
  if (value === 0) return { step: 0, worse: false };
  const steps = deviationStrengths.length;
  return {
    step: Math.min(steps, Math.max(1, Math.ceil((Math.abs(value) / cap) * steps))),
    worse: worse === 'above' ? value > 0 : value < 0,
  };
}
