import { getContrastRatio } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import { navy, slate } from './colors';
import { departures, type ColorScheme } from './departures';
import { createKilowattTheme, createSchemeTheme } from './theme';
import { departureChanges, diffThemes, stockTheme } from './themeDiff';

const schemes: ColorScheme[] = ['light', 'dark'];

describe('departures', () => {
  it.each(schemes)('account for every way the %s theme differs from stock MUI', (scheme) => {
    const claimed = new Set(departures.flatMap((departure) => departureChanges(departure, scheme).map((change) => change.path)));
    const unlisted = diffThemes(stockTheme(scheme), createSchemeTheme(scheme)).filter((change) => !claimed.has(change.path));
    expect(unlisted, 'theme values that differ from MUI without a departure in src/mui/departures.ts').toEqual([]);
  });

  it('each change something, or describe a convention outside the theme', () => {
    for (const departure of departures) {
      const changes = schemes.flatMap((scheme) => departureChanges(departure, scheme));
      expect(changes.length > 0 || Boolean(departure.convention), `${departure.id} departs from nothing`).toBe(true);
    }
  });

  it('have unique ids and a reason', () => {
    expect(new Set(departures.map((departure) => departure.id)).size).toBe(departures.length);
    for (const departure of departures) expect(departure.why.trim(), departure.id).not.toBe('');
  });
});

describe('createKilowattTheme', () => {
  it('uses the surface and border levels in each scheme', () => {
    const theme = createKilowattTheme();
    // MUI's Theme type leaves out the per-scheme palettes it carries.
    const { light, dark } = (theme as unknown as { colorSchemes: Record<ColorScheme, { palette: typeof theme.palette }> }).colorSchemes;
    expect([light.palette.background.default, light.palette.background.paper, light.palette.background.level4]).toEqual([slate[400], slate[300], slate[50]]);
    expect([dark.palette.background.default, dark.palette.background.paper, dark.palette.background.level4]).toEqual([navy[900], navy[800], navy[650]]);
    expect(light.palette.divider).toBe(light.palette.border.level1);
    expect(dark.palette.border).toEqual({ level0: navy[600], level1: navy[500], level2: navy[400] });
  });

  it.each(schemes)('gives the %s scheme intents that pass 4.5:1 on every surface, with contrast text that passes on them', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    const surfaces = (['level0', 'level1', 'level2', 'level3', 'level4'] as const).map((level) => palette.background[level]);
    for (const intent of ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const) {
      const { main, contrastText } = palette[intent];
      for (const surface of surfaces) expect(getContrastRatio(main, surface), `${intent}.main on ${surface}`).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(contrastText, main), `${intent}.contrastText`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('puts each Paper elevation on its surface level', () => {
    const root = createKilowattTheme().components?.MuiPaper?.styleOverrides?.root as Record<string, { backgroundColor: string }>;
    expect(root['&.MuiPaper-elevation1'].backgroundColor).toBe('var(--mui-palette-background-level1)');
    expect(root['&.MuiPaper-elevation8'].backgroundColor).toBe('var(--mui-palette-background-level3)');
    expect(root['&.MuiPaper-elevation24'].backgroundColor).toBe('var(--mui-palette-background-level4)');
  });
});
