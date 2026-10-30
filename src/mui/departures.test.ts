import { alpha, decomposeColor, getContrastRatio, type CssVarsPalette } from '@mui/material/styles';
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

/** The dotted path of every value in theme options. An array is one value, because merging replaces it whole. */
function valuePaths(value: unknown, path = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [path];
  return Object.entries(value).flatMap(([key, child]) => valuePaths(child, path ? `${path}.${key}` : key));
}

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

  it('differ between schemes only in the palette, the one part the theme keeps per scheme', () => {
    for (const { id, options } of departures) {
      if (!options) continue;
      expect(
        { ...options('dark'), palette: undefined },
        `${id} varies outside the palette, which createKilowattTheme drops for dark. Scope dark-only CSS with '*:where(.dark) &'`,
      ).toEqual({ ...options('light'), palette: undefined });
    }
  });

  it.each(schemes)('set each %s theme value once, so their order never decides the theme', (scheme) => {
    const setBy = new Map<string, string>();
    const overlaps: string[] = [];
    for (const { id, options } of departures) {
      if (!options) continue;
      for (const path of valuePaths(options(scheme))) {
        if (setBy.has(path)) overlaps.push(`${path}: ${setBy.get(path)} and ${id}`);
        setBy.set(path, id);
      }
    }
    expect(overlaps, 'theme values set by two departures; merge them into one entry').toEqual([]);
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
    expect(dark.palette.border).toEqual({ level0: navy[600], level1: navy[500], level2: navy[400], level3: navy[200] });
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

  it.each(schemes)('gives %s-scheme secondary text 4.5:1 on selected rows and filled fields, hovered too, on every surface', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    const { action, primary } = palette;
    // MUI sets FilledInput on every scheme's palette but types it on CssVarsPalette only.
    const { FilledInput } = palette as typeof palette & Pick<CssVarsPalette, 'FilledInput'>;
    // MUI tints a selected list row with primary at selectedOpacity (plus hoverOpacity on hover), and a filled field with FilledInput's bg.
    const tints = {
      selected: alpha(primary.main, action.selectedOpacity),
      'selected hover': alpha(primary.main, action.selectedOpacity + action.hoverOpacity),
      filled: FilledInput.bg,
      'filled hover': FilledInput.hoverBg,
    };
    for (const level of ['level0', 'level1', 'level2', 'level3', 'level4'] as const) {
      const surface = palette.background[level];
      for (const [name, tint] of Object.entries(tints)) {
        const { values: fg } = decomposeColor(tint);
        const { values: bg } = decomposeColor(surface);
        const a = fg[3] ?? 1;
        const blended = `rgb(${[0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a))).join(', ')})`;
        expect(getContrastRatio(palette.text.secondary, blended), `text.secondary on ${name} over ${level}`).toBeGreaterThanOrEqual(text);
      }
    }
  });

  it.each(schemes)('gives the %s-scheme focus color 4.5:1 on every surface, as a focused input label', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    for (const level of ['level0', 'level1', 'level2', 'level3', 'level4'] as const) {
      expect(getContrastRatio(palette.control.focus, palette.background[level]), `control.focus on ${level}`).toBeGreaterThanOrEqual(text);
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

  it('draws table rows in `divider`, sticks headers to the card surface, and leaves the last row unlined', () => {
    const { MuiTable, MuiTableCell } = createKilowattTheme().components ?? {};
    expect(MuiTableCell?.styleOverrides?.root).toMatchObject({ borderBottomColor: 'var(--mui-palette-divider)' });
    expect(MuiTableCell?.styleOverrides?.stickyHeader).toMatchObject({ backgroundColor: 'var(--mui-palette-background-level2)' });
    expect(Object.values(MuiTable?.styleOverrides?.root as Record<string, unknown>)).toContainEqual({ borderBottom: 0 });
  });

  it('puts each Paper elevation on its surface level', () => {
    const root = createKilowattTheme().components?.MuiPaper?.styleOverrides?.root as Record<string, { backgroundColor: string }>;
    expect(root['&.MuiPaper-elevation1'].backgroundColor).toBe('var(--mui-palette-background-level1)');
    expect(root['&.MuiPaper-elevation8'].backgroundColor).toBe('var(--mui-palette-background-level3)');
    expect(root['&.MuiPaper-elevation24'].backgroundColor).toBe('var(--mui-palette-background-level4)');
  });
});

/**
 * How far apart two colors look, as the smallest OKLab distance under normal vision and
 * simulated protanopia, deuteranopia and tritanopia (Machado et al. 2009, full severity).
 */
const cvd = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
function oklab(hex: string, matrix: number[][]) {
  const linear = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = matrix.map((row) => Math.min(1, Math.max(0, row[0] * linear[0] + row[1] * linear[1] + row[2] * linear[2])));
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const apart = (a: string, b: string) =>
  Math.min(...Object.values(cvd).map((matrix) => Math.hypot(...oklab(a, matrix).map((value, i) => value - oklab(b, matrix)[i]))));

/** The smallest separation two chart colors keep under every simulation; Rules → Charts. */
const minSeparation = 0.05;

describe('chart palette', () => {
  it.each(schemes)('gives the %s scheme six series colors and a neutral at 3:1 on every surface', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    const { series, neutral } = palette.chart;
    expect(series).toHaveLength(6);
    for (const level of ['level0', 'level1', 'level2', 'level3', 'level4'] as const) {
      for (const color of [...series, neutral]) {
        expect(getContrastRatio(color, palette.background[level]), `${color} on ${level}`).toBeGreaterThanOrEqual(graphic);
      }
    }
  });

  it.each(schemes)('keeps every pair of %s-scheme series colors, and the neutral, apart under color-vision deficiencies', (scheme) => {
    const { series, neutral } = createSchemeTheme(scheme).palette.chart;
    const colors = [...series, neutral];
    colors.forEach((a, i) =>
      colors.slice(i + 1).forEach((b) => expect(apart(a, b), `${a} and ${b}`).toBeGreaterThanOrEqual(minSeparation)),
    );
  });

  it.each(schemes)('runs the %s-scheme sequential ramp from the surface outward, ending at 3:1', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    const surface = palette.background.level1;
    const contrasts = palette.chart.sequential.map((color) => getContrastRatio(color, surface));
    contrasts.slice(1).forEach((contrast, i) => expect(contrast, `step ${i + 1}`).toBeGreaterThan(contrasts[i]));
    expect(contrasts.at(-1)).toBeGreaterThanOrEqual(graphic);
  });
});
