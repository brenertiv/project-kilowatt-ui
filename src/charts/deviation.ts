import { decomposeColor, getContrastRatio, rgbToHex, type Palette } from '@mui/material/styles';

/**
 * Colors for a value read against a midpoint or a range (Rules → Charts).
 *
 * A heatmap or table cell is an overlay: one end color over the surface at an opacity of its value,
 * continuous, full from the cap and fading to the surface at no change (`heatEnd`, `heatColors`). A
 * deviation, where one direction is worse, takes `error` on the worse side and `chart.neutral` on the
 * better; a comparison where neither side is worse takes `chart.diverging`; a magnitude takes
 * `chart.sequential[3]` against the range.
 *
 * A map's deviation keeps four steps of strength (`deviationSteps`, `deviationStep`), since CARTO bins a
 * choropleth; its midpoint is `action.hover`. Charts take these from `chartColors`, maps from `mapColors`.
 */

/** Each step's strength over the surface, from the midpoint outward, for a map's deviation. */
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
 * A map's deviation colors over one surface, as solid hex: the worse and better steps from the midpoint
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
 * A value's step on a map's deviation scale: 1 to 4 by its distance from 0 against `cap`, or 0 for no change,
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

/** The contrast text holds over a cell, as everywhere else (Rules → Accessibility). */
const textContrast = 4.5;

/**
 * One end of a continuous scale over one surface, and where its text flips: the last opacity at which
 * `text.primary` still holds 4.5:1 over the blend, and the first at which the contrast text does.
 */
export type HeatEnd = { color: string; surface: string; primaryTo: number; contrastFrom: number };

/**
 * One end of a continuous scale (an end color drawn over a surface at an opacity of its value), with
 * where its text flips from `text.primary` to the contrast text, found in hundredths.
 *
 * @param color - The end color, at full strength: `error.main`, `chart.neutral`, a `chart.diverging` end or `chart.sequential[3]`.
 * @param surface - What the cells sit on: the card surface (`background.level3`).
 * @param primary - `text.primary`.
 * @param contrast - The text where `text.primary` no longer passes: `chart.diverging.contrastText`.
 */
export function heatEnd(color: string, surface: string, primary: string, contrast: string): HeatEnd {
  let primaryTo = 0;
  let contrastFrom = 1;
  let found = false;
  for (let i = 0; i <= 100; i++) {
    const blend = over(color, surface, i / 100);
    if (getContrastRatio(primary, blend) >= textContrast) primaryTo = i / 100;
    if (!found && getContrastRatio(contrast, blend) >= textContrast) {
      contrastFrom = i / 100;
      found = true;
    }
  }
  return { color, surface, primaryTo, contrastFrom };
}

/**
 * A cell's colors at a strength: its opacity, its fill as a solid hex (for a canvas), and which text it
 * takes. Text stays `text.primary` while it holds 4.5:1; past that it takes the contrast text, and a
 * strength in the narrow band where neither passes moves up to the first opacity where the contrast text does.
 *
 * @param end - The scale's end, from `heatEnd`.
 * @param strength - The value's distance from the midpoint over the cap, or its place in the range, from 0 to 1; clamped.
 */
export function heatColors(end: HeatEnd, strength: number): { opacity: number; fill: string; text: 'primary' | 'contrast' } {
  let opacity = Math.min(1, Math.max(0, Number.isFinite(strength) ? strength : 0));
  const flipped = opacity > end.primaryTo;
  if (flipped && opacity < end.contrastFrom) opacity = end.contrastFrom;
  return { opacity, fill: over(end.color, end.surface, opacity), text: flipped ? 'contrast' : 'primary' };
}
