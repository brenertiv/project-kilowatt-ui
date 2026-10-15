import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import type { ColorScheme, ThemeValues } from '../tokens';
import { departures } from './departures';

/**
 * The Material UI theme: stock MUI with Kilowatt's departures merged on top.
 * Nothing is set here directly. Every value that differs from MUI's default is
 * an entry in `departures.ts`, with its reason, so the list of differences is
 * the theme itself.
 */

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Merges theme option objects key by key; later values win. */
export function mergeOptions(target: Plain, source: Plain): Plain {
  const out: Plain = { ...target };
  for (const [key, value] of Object.entries(source)) {
    out[key] = isPlain(value) && isPlain(out[key]) ? mergeOptions(out[key] as Plain, value) : value;
  }
  return out;
}

export function themeOptions(values: ThemeValues, scheme: ColorScheme): ThemeOptions {
  return departures.reduce<Plain>(
    (options, departure) => (departure.options ? mergeOptions(options, departure.options(values, scheme) as Plain) : options),
    { palette: { mode: scheme } },
  ) as ThemeOptions;
}

export function createKilowattTheme(values: ThemeValues, scheme: ColorScheme): Theme {
  return createTheme(themeOptions(values, scheme));
}
