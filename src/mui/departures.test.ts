import { describe, expect, it } from 'vitest';
import { defaultDarkColors, defaultTheme, resolveTheme, type ColorScheme } from '../tokens';
import { departures } from './departures';
import { createKilowattTheme, createSchemeTheme, themeOptions } from './theme';
import { departureChanges, diffThemes, stockTheme } from './themeDiff';

const schemes: ColorScheme[] = ['light', 'dark'];
const valuesFor = (scheme: ColorScheme) => resolveTheme(defaultTheme, defaultDarkColors, scheme);

describe('departures', () => {
  it.each(schemes)('account for every way the %s theme differs from stock MUI', (scheme) => {
    const values = valuesFor(scheme);
    const claimed = new Set(departures.flatMap((departure) => departureChanges(departure, values, scheme).map((change) => change.path)));
    const unlisted = diffThemes(stockTheme(scheme), createSchemeTheme(values, scheme)).filter((change) => !claimed.has(change.path));
    expect(unlisted, 'theme values that differ from MUI without a departure in src/mui/departures.ts').toEqual([]);
  });

  it('each change something, or describe a convention outside the theme', () => {
    for (const departure of departures) {
      const changes = schemes.flatMap((scheme) => departureChanges(departure, valuesFor(scheme), scheme));
      expect(changes.length > 0 || Boolean(departure.convention), `${departure.id} departs from nothing`).toBe(true);
    }
  });

  it('have unique ids and a reason', () => {
    expect(new Set(departures.map((departure) => departure.id)).size).toBe(departures.length);
    for (const departure of departures) expect(departure.why.trim(), departure.id).not.toBe('');
  });
});

describe('createSchemeTheme', () => {
  it('maps the brand and surface tokens onto the palette in each scheme', () => {
    for (const scheme of schemes) {
      const values = valuesFor(scheme);
      const theme = createSchemeTheme(values, scheme);
      expect(theme.palette.mode).toBe(scheme);
      expect(theme.palette.primary.main.toLowerCase()).toBe(values.primaryMain.toLowerCase());
      expect(theme.palette.background.default.toLowerCase()).toBe(values.backgroundDefault.toLowerCase());
      expect(theme.palette.text.primary.toLowerCase()).toBe(values.textPrimary.toLowerCase());
    }
  });

  it('keeps MUI defaults where no departure is listed', () => {
    const theme = createSchemeTheme(defaultTheme, 'light');
    const stock = stockTheme('light');
    expect(theme.spacing(2)).toBe('16px');
    expect(theme.shape.borderRadius).toBe(stock.shape.borderRadius);
    expect(theme.shadows).toEqual(stock.shadows);
    expect(theme.transitions.duration).toEqual(stock.transitions.duration);
  });

  it('applies the type departures', () => {
    const theme = createSchemeTheme(defaultTheme, 'light');
    // Roboto through MUI's own stack: changing the string would also drop MUI's letter spacing.
    expect(theme.typography.fontFamily).toBe(stockTheme('light').typography.fontFamily);
    expect(theme.typography.h1.fontWeight).toBe(400);
    expect(theme.typography.button.textTransform).toBe('none');
  });

  it('makes cards flat and outlined', () => {
    expect(createSchemeTheme(defaultTheme, 'light').components?.MuiCard?.defaultProps?.variant).toBe('outlined');
  });
});

describe('createKilowattTheme', () => {
  it('uses CSS theme variables with light and dark color schemes from the tokens', () => {
    const theme = createKilowattTheme();
    // A CSS-variables theme carries each scheme's palette; MUI's Theme type leaves that out.
    const colorSchemes = (theme as unknown as { colorSchemes: Record<ColorScheme, { palette: typeof theme.palette }> }).colorSchemes;
    expect(theme.vars?.palette.primary.main).toMatch(/^var\(--mui-palette-primary-main/);
    for (const scheme of schemes) {
      expect(colorSchemes[scheme].palette.primary.main.toLowerCase()).toBe(valuesFor(scheme).primaryMain.toLowerCase());
      expect(colorSchemes[scheme].palette.background.default.toLowerCase()).toBe(valuesFor(scheme).backgroundDefault.toLowerCase());
    }
  });

  it('only varies the palette between schemes', () => {
    const { palette: lightPalette, ...light } = themeOptions(valuesFor('light'), 'light');
    const { palette: darkPalette, ...dark } = themeOptions(valuesFor('dark'), 'dark');
    expect(lightPalette).toBeDefined();
    expect(darkPalette).toBeDefined();
    expect(dark).toEqual(light);
  });
});
