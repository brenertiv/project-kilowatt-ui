import * as muiColors from '@mui/material/colors';
import { describe, expect, it } from 'vitest';
import * as ramps from './colors';
import { departures, type ColorScheme } from './departures';

/**
 * The three token tiers (docs/design-system-rules.md, "Token tiers"): primitives (ramps)
 * feed the semantic tier (the palette), and the component tier (theme.components)
 * reads only the semantic tier.
 */

const schemes: ColorScheme[] = ['light', 'dark'];
const isColor = (value: string) => /^#[0-9a-f]{3,8}$/i.test(value) || /^(rgb|hsl)a?\(/i.test(value);
const rawColor = /#[0-9a-f]{3,8}\b|\b(rgb|hsl)a?\(/i;

/** Every string leaf of an object, with its dotted path. */
function leaves(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
}

/** Tier 1: every step of our ramps and MUI's (`@mui/material/colors`). */
const primitives = new Set(
  [...Object.values(ramps), ...Object.values(muiColors)].flatMap((ramp) => Object.values(ramp as Record<string, string>)).map((hex) => hex.toLowerCase()),
);
/** MUI's own contrast-text values, which the palette may use as they are. */
const muiContrastText = new Set(['#fff', 'rgba(0, 0, 0, 0.87)']);

describe('token tiers', () => {
  it.each(schemes)('the %s palette takes every color it sets from a primitive ramp', (scheme) => {
    for (const departure of departures) {
      for (const [path, value] of leaves(departure.options?.(scheme).palette)) {
        if (!isColor(value) || muiContrastText.has(value)) continue;
        expect(primitives.has(value.toLowerCase()), `${departure.id}: palette.${path} = ${value} is not a ramp step`).toBe(true);
      }
    }
  });

  it.each(schemes)('component overrides in the %s theme use palette values, never raw colors', (scheme) => {
    for (const departure of departures) {
      for (const [path, value] of leaves(departure.options?.(scheme).components)) {
        expect(rawColor.test(value), `${departure.id}: components.${path} = ${value}; use var(--mui-palette-…)`).toBe(false);
      }
    }
  });
});
