import { createTheme, type Theme } from '@mui/material/styles';
import { departures, type ColorScheme, type Departure } from './departures';
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

/**
 * What each departure changes, applied in order: a departure is charged with what
 * changes when it is added on top of the ones before it. Paths that only appear
 * when two departures combine (a palette key turned into a CSS variable) go to the
 * later one, so every difference from stock MUI belongs to exactly one departure.
 */
export function attributedChanges(scheme: ColorScheme): Map<string, ThemeChange[]> {
  const out = new Map<string, ThemeChange[]>();
  let options: Record<string, unknown> = { palette: { mode: scheme } };
  let before = stockTheme(scheme);
  for (const departure of departures) {
    if (!departure.options) {
      out.set(departure.id, []);
      continue;
    }
    options = mergeOptions(options, departure.options(scheme) as Record<string, unknown>);
    const after = createTheme(options);
    out.set(departure.id, diffThemes(before, after));
    before = after;
  }
  return out;
}

const cache = new Map<ColorScheme, Map<string, ThemeChange[]>>();

/** What one departure changes, against stock MUI plus the departures listed before it. */
export function departureChanges(departure: Departure, scheme: ColorScheme): ThemeChange[] {
  if (!cache.has(scheme)) cache.set(scheme, attributedChanges(scheme));
  return cache.get(scheme)!.get(departure.id) ?? [];
}
