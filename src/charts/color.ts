import { chartSeriesIds, type ColorScheme, type ThemeValues } from '../tokens';

/**
 * Color math for charts. Everything here resolves to plain hex so amCharts can
 * consume it; the inputs are always theme tokens, never literals.
 */

export type Oklch = { l: number; c: number; h: number };

function srgbToLinear(channel: number) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number) {
  const c = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

export function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const raw = match[1].length === 3 ? [...match[1]].map((ch) => ch + ch).join('') : match[1];
  return [Number.parseInt(raw.slice(0, 2), 16), Number.parseInt(raw.slice(2, 4), 16), Number.parseInt(raw.slice(4, 6), 16)];
}

export function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

export function hexToOklch(hex: string): Oklch {
  const rgb = parseHex(hex) ?? [0, 0, 0];
  const [r, g, b] = rgb.map(srgbToLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(a, bb);
  const h = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

export function oklchToHex({ l, c, h }: Oklch): string {
  const a = c * Math.cos((h * Math.PI) / 180);
  const bb = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * bb) ** 3;
  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const b = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
  return toHex([linearToSrgb(r), linearToSrgb(g), linearToSrgb(b)]);
}

/** Relative luminance per WCAG. */
export function luminance(hex: string) {
  const [r, g, b] = (parseHex(hex) ?? [0, 0, 0]).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ink color that clears contrast on a fill: white on dark fills, the text token on light ones. */
export function inkOn(fillHex: string, lightInk: string, darkInk: string) {
  return luminance(fillHex) > 0.4 ? darkInk : lightInk;
}

/** The categorical slots in fixed order from the theme. */
export function categoricalPalette(values: ThemeValues): string[] {
  return chartSeriesIds.map((id) => values[id]);
}

/**
 * Stable series → color assignment. Colors follow the entity: ids keep their slot
 * across filters, and a ninth id throws rather than cycling.
 */
export function assignSeriesColors(ids: readonly string[], values: ThemeValues): Record<string, string> {
  const palette = categoricalPalette(values);
  if (ids.length > palette.length) {
    throw new Error(`Chart has ${ids.length} series; the categorical palette carries ${palette.length}. Fold the tail into "Other" or facet.`);
  }
  return Object.fromEntries(ids.map((id, index) => [id, palette[index]]));
}

/** Lightness band the sequential ramp spans, per scheme. The light end recedes toward the surface. */
const sequentialBand: Record<ColorScheme, [number, number]> = {
  light: [0.9, 0.38],
  dark: [0.32, 0.82],
};

/**
 * One-hue sequential ramp from a base slot: hue and chroma held, lightness stepped
 * monotonically. Flips its anchor in dark mode so "more" always reads darker on light
 * and brighter on dark.
 */
export function sequentialRamp(baseHex: string, steps: number, scheme: ColorScheme = 'light'): string[] {
  const base = hexToOklch(baseHex);
  const [from, to] = sequentialBand[scheme];
  return Array.from({ length: steps }, (_, index) => {
    const t = steps === 1 ? 1 : index / (steps - 1);
    const l = from + (to - from) * t;
    const chroma = base.c * (0.35 + 0.65 * t);
    return oklchToHex({ l, c: chroma, h: base.h });
  });
}

/**
 * Diverging ramp: two hues with a neutral midpoint, equal steps per arm.
 * `steps` is the count per arm, so the result has `2 * steps + 1` entries.
 */
export function divergingRamp(
  negativeHex: string,
  positiveHex: string,
  midpointHex: string,
  steps: number,
  scheme: ColorScheme = 'light',
): string[] {
  const negative = sequentialRamp(negativeHex, steps + 1, scheme).slice(1).reverse();
  const positive = sequentialRamp(positiveHex, steps + 1, scheme).slice(1);
  return [...negative, midpointHex, ...positive];
}

/** Picks the ramp step for a value in [min, max]. */
export function rampIndex(value: number, min: number, max: number, steps: number) {
  if (max <= min) return 0;
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return Math.min(steps - 1, Math.floor(t * steps));
}

/** Hex with alpha for area washes: the series hue at ~10% opacity. */
export function withAlpha(hex: string, alpha: number) {
  const [r, g, b] = parseHex(hex) ?? [0, 0, 0];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
