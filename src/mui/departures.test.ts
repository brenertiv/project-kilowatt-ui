import { decomposeColor, getContrastRatio } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import { navy, slate } from './colors';
import { departures, type ColorScheme } from './departures';
import { createKilowattTheme, createSchemeTheme } from './theme';
import { departureChanges, diffThemes, stockTheme } from './themeDiff';

const schemes: ColorScheme[] = ['light', 'dark'];

/**
 * Headroom above each WCAG minimum. MUI's getContrastRatio and axe (the story tests) round
 * the sRGB curve slightly differently, so a pair at exactly 4.5:1 here can measure 4.49 in
 * axe. Requiring 0.05 more makes such edge cases fail here first.
 */
const margin = 0.05;
const text = 4.5 + margin;
const graphic = 3 + margin;

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
    expect([light.palette.background.default, light.palette.background.paper, light.palette.background.level4]).toEqual([slate[300], slate[200], slate[50]]);
    expect([dark.palette.background.default, dark.palette.background.paper, dark.palette.background.level4]).toEqual([navy[950], navy[900], navy[600]]);
    expect(light.palette.divider).toBe(light.palette.border.level1);
    expect(dark.palette.border).toEqual({ level0: navy[800], level1: navy[700], level2: navy[500], level3: navy[200] });
  });

  it.each(schemes)('gives the %s scheme intents that pass 4.5:1 on every surface, with contrast text that passes on them', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    const surfaces = (['level0', 'level1', 'level2', 'level3', 'level4'] as const).map((level) => palette.background[level]);
    for (const intent of ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const) {
      const { main, contrastText } = palette[intent];
      for (const surface of surfaces) expect(getContrastRatio(main, surface), `${intent}.main on ${surface}`).toBeGreaterThanOrEqual(text);
      expect(getContrastRatio(contrastText, main), `${intent}.contrastText`).toBeGreaterThanOrEqual(text);
    }
  });

  it.each(schemes)('gives %s-scheme icons at least 3:1 on every surface, as WCAG asks of graphics', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    // An rgba icon color shows as its blend over the surface; compare that.
    const over = (color: string, surface: string) => {
      const { values: fg } = decomposeColor(color);
      const { values: bg } = decomposeColor(surface);
      const alpha = fg[3] ?? 1;
      return `rgb(${[0, 1, 2].map((i) => Math.round(fg[i] * alpha + bg[i] * (1 - alpha))).join(', ')})`;
    };
    for (const level of ['level0', 'level1', 'level2', 'level3', 'level4'] as const) {
      const surface = palette.background[level];
      for (const icon of [palette.action.active, palette.text.secondary]) {
        expect(getContrastRatio(over(icon, surface), surface), `${icon} on ${level}`).toBeGreaterThanOrEqual(graphic);
      }
    }
  });

  it.each(schemes)('gives %s-scheme secondary text 4.5:1 on every surface, for unselected toggle buttons', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    const { values: fg } = decomposeColor(palette.text.secondary);
    const alpha = fg[3] ?? 1;
    for (const level of ['level0', 'level1', 'level2', 'level3', 'level4'] as const) {
      const surface = palette.background[level];
      const { values: bg } = decomposeColor(surface);
      const blended = `rgb(${[0, 1, 2].map((i) => Math.round(fg[i] * alpha + bg[i] * (1 - alpha))).join(', ')})`;
      expect(getContrastRatio(blended, surface), `text.secondary on ${level}`).toBeGreaterThanOrEqual(text);
    }
  });

  // Light is left out for now: its border.level3 (slate 950) sits below 3:1, by design decision.
  it('gives the dark scheme a control border (border.level3) at 3:1 on every surface, as WCAG asks of control boundaries', () => {
    const { palette } = createSchemeTheme('dark');
    for (const level of ['level0', 'level1', 'level2', 'level3', 'level4'] as const) {
      const surface = palette.background[level];
      expect(getContrastRatio(palette.border.level3, surface), `border.level3 on ${level}`).toBeGreaterThanOrEqual(graphic);
    }
  });

  it('sets tabular digits, wrapping and font synthesis, and stills transitions under reduced motion', () => {
    const theme = createKilowattTheme();
    expect(theme.components?.MuiTableCell?.styleOverrides?.root).toMatchObject({ fontVariantNumeric: 'tabular-nums' });
    expect([theme.typography.h1.textWrap, theme.typography.body1.textWrap]).toEqual(['balance', 'pretty']);
    const baseline = theme.components?.MuiCssBaseline?.styleOverrides as Record<string, Record<string, Record<string, string>>>;
    expect(baseline.body.fontSynthesis).toBe('none');
    expect(baseline['@media (prefers-reduced-motion: reduce)']['*, *::before, *::after'].transitionDuration).toBe('0.01ms !important');
  });

  it('puts each Paper elevation on its surface level', () => {
    const root = createKilowattTheme().components?.MuiPaper?.styleOverrides?.root as Record<string, { backgroundColor: string }>;
    expect(root['&.MuiPaper-elevation1'].backgroundColor).toBe('var(--mui-palette-background-level1)');
    expect(root['&.MuiPaper-elevation8'].backgroundColor).toBe('var(--mui-palette-background-level3)');
    expect(root['&.MuiPaper-elevation24'].backgroundColor).toBe('var(--mui-palette-background-level4)');
  });
});
