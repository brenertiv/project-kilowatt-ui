import { createTheme, type Theme } from '@mui/material/styles';
import type { ColorScheme, ThemeValues } from '../tokens';
import type { Departure } from './departures';
import { mergeOptions } from './theme';

/** One theme value that differs from stock MUI: where, MUI's value, Kilowatt's. */
export type ThemeChange = { path: string; muiDefault: string; kilowatt: string };

const show = (value: unknown) => (value === undefined ? '(unset)' : String(value));

/** Every primitive value in a theme, keyed by its dotted path. Functions are skipped. */
function leaves(value: unknown, path = '', out = new Map<string, unknown>()): Map<string, unknown> {
  if (typeof value === 'function') return out;
  if (value === null || typeof value !== 'object') {
    out.set(path, value);
    return out;
  }
  for (const [key, child] of Object.entries(value)) leaves(child, path ? `${path}.${key}` : key, out);
  return out;
}

/**
 * A theme's values, plus a probe for the one setting MUI keeps only as a function:
 * spacing. (Breakpoint, transition and type helpers are derived from values that
 * are compared directly.)
 */
function values(theme: Theme): Map<string, unknown> {
  return leaves(theme).set('spacing(1)', theme.spacing(1));
}

export function diffThemes(base: Theme, other: Theme): ThemeChange[] {
  const before = values(base);
  const after = values(other);
  const paths = new Set([...before.keys(), ...after.keys()]);
  return [...paths]
    .filter((path) => before.get(path) !== after.get(path))
    .sort()
    .map((path) => ({ path, muiDefault: show(before.get(path)), kilowatt: show(after.get(path)) }));
}

export const stockTheme = (scheme: ColorScheme) => createTheme({ palette: { mode: scheme } });

/** What one departure changes on its own, against stock MUI in the same scheme. */
export function departureChanges(departure: Departure, values: ThemeValues, scheme: ColorScheme): ThemeChange[] {
  if (!departure.options) return [];
  const options = mergeOptions({ palette: { mode: scheme } }, departure.options(values, scheme) as Record<string, unknown>);
  return diffThemes(stockTheme(scheme), createTheme(options));
}
