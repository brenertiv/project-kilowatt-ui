import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { decomposeColor, rgbToHex } from '@mui/material/styles';
import { createSchemeTheme } from '../mui/theme';
import type { ColorScheme } from '../mui/departures';
import { mapDepartures, type BasemapFeature, type BasemapThemeContext, type MapDeparture } from './departures';

/**
 * Kilowatt's map theme (Rules → Maps, Foundations → CARTO departures). MapLibre draws the basemap
 * from a style it doesn't share with the MUI theme, so this turns one scheme's palette into CARTO's
 * style: every change comes from a `theme` entry in `./departures`. Data drawn over the basemap
 * with deck.gl takes its colors from `mapColors`.
 */

const themes = { light: createSchemeTheme('light'), dark: createSchemeTheme('dark') };

/** CARTO's basemap style for each scheme: Positron in light, Dark Matter in dark. */
export const basemapStyleUrl: Record<ColorScheme, string> = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

/**
 * Where Kilowatt's map fonts are served, relative to the page: Storybook serves `src/maps/fonts` at
 * `/map-fonts/` (`.storybook/main.ts`). An app that rebuilds the maps hosts the same folder and
 * passes its own glyphs URL to `basemapStyle`.
 */
export const mapFontsPath = 'map-fonts/';

/** The MapLibre glyphs URL for Kilowatt's map fonts, absolute, from the page's base URL. */
export function mapGlyphsUrl(base = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI): string {
  // `{fontstack}` and `{range}` are added after the URL is resolved, so they aren't percent-encoded.
  return `${new URL(mapFontsPath, base).href}{fontstack}/{range}.pbf`;
}

/** A palette color as a solid hex: a translucent one (text.secondary) is blended over the land, since MapLibre would blend it over whatever is drawn below. */
function solid(color: string, surface: string): string {
  const fg = decomposeColor(color).values;
  const bg = decomposeColor(surface).values;
  const alpha = fg[3] ?? 1;
  return rgbToHex(`rgb(${[0, 1, 2].map((i) => Math.round(fg[i] * alpha + bg[i] * (1 - alpha))).join(', ')})`);
}

/** What a CARTO basemap layer draws, from its type, source layer and id, or `undefined` for a layer Kilowatt leaves as CARTO draws it. */
export function basemapFeature(layer: LayerSpecification): BasemapFeature | undefined {
  if (layer.type === 'background') return 'land';
  if (layer.type === 'symbol') return 'label';
  const source = 'source-layer' in layer ? layer['source-layer'] : undefined;
  // CARTO's `carto.streets` v2 tiles (since 2026-10-26) name their source layers `landuse`, `water`, `roads`,
  // `boundaries`, `buildings`, `places` and `pois`; the OpenMapTiles names before them (`transportation`, `boundary`,
  // `building`) are matched too. Land use (parks, land cover, residential areas) is its own feature, apart from the land.
  switch (source) {
    case 'landcover':
    case 'park':
      return 'landuse';
    case 'landuse':
      // CARTO draws path areas from the landuse layer; they're thin lines, drawn like casings.
      return /_path/.test(layer.id) ? 'roadCasing' : 'landuse';
    case 'water':
    case 'waterway':
      return 'water';
    case 'building':
    case 'buildings':
      return 'building';
    case 'boundary':
    case 'boundaries':
      return 'boundary';
    case 'aeroway':
      return 'road';
    case 'transportation':
    case 'roads':
      // Casings edge a road's fill; rail and paths are thin lines, drawn like casings.
      return /_case|rail(?!_dash)|_path$/.test(layer.id) ? 'roadCasing' : 'road';
    default:
      return undefined;
  }
}

/**
 * CARTO's basemap style for one color scheme with Kilowatt's theme applied, built from the `theme`
 * entries in `./departures`. Returns a copy; the style passed in is left as it is.
 *
 * @param style - CARTO's style for the scheme, as fetched from `basemapStyleUrl[scheme]`.
 * @param scheme - The active color scheme, `light` or `dark`.
 * @param options - `glyphs`: where the map fonts are served (default `mapGlyphsUrl()`); `departures`: the departures to apply (default all of them; tests pass fewer).
 */
export function basemapTheme(
  style: StyleSpecification,
  scheme: ColorScheme,
  { glyphs = mapGlyphsUrl(), departures = mapDepartures }: { glyphs?: string; departures?: MapDeparture[] } = {},
): StyleSpecification {
  const mui = themes[scheme];
  // The land is the map's own role, a step past the page, not the card surface.
  const land = mui.palette.map.land;
  const copy = structuredClone(style);
  const context: BasemapThemeContext = {
    style: copy,
    layers: (feature) => copy.layers.filter((layer) => basemapFeature(layer) === feature),
    paint: (layer, property, value) => {
      const paint = ((layer as { paint?: Record<string, unknown> }).paint ??= {});
      // A property CARTO doesn't set, or sets transparent (a water shadow, house numbers), stays as it is.
      if (property in paint && paint[property] !== 'transparent') paint[property] = value;
    },
    mui,
    color: (value) => solid(value, land),
    land,
    glyphs,
  };
  // The theme is the departures' changes and nothing else (Foundations → CARTO departures).
  for (const departure of departures) departure.apply?.(context);
  return copy;
}

const styles = new Map<string, Promise<StyleSpecification>>();

/**
 * Fetches CARTO's basemap style for one color scheme and applies Kilowatt's theme, once per scheme.
 * Pass the result to MapLibre's `style` option, or to `setStyle` when the scheme changes.
 *
 * @param scheme - The active color scheme, `light` or `dark`.
 * @param glyphs - Where the map fonts are served, as a MapLibre glyphs URL. Default `mapGlyphsUrl()`, Storybook's `/map-fonts/`.
 */
export function basemapStyle(scheme: ColorScheme, glyphs = mapGlyphsUrl()): Promise<StyleSpecification> {
  const key = `${scheme} ${glyphs}`;
  let style = styles.get(key);
  if (!style) {
    style = fetch(basemapStyleUrl[scheme])
      .then((response) => {
        if (!response.ok) throw new Error(`CARTO basemap style: ${response.status}`);
        return response.json() as Promise<StyleSpecification>;
      })
      .then((carto) => basemapTheme(carto, scheme, { glyphs }));
    // A failed fetch isn't kept, so the next map tries again.
    style.catch(() => styles.delete(key));
    styles.set(key, style);
  }
  return style;
}

/** A color as deck.gl takes it: red, green, blue and alpha, 0 to 255. */
export type RGBAColor = [number, number, number, number];

/**
 * The palette's data colors for one scheme as deck.gl colors (Rules → Charts, the `map-data-colors`
 * departure), for `getFillColor`, `getLineColor` and the `colors` of CARTO's styling helpers.
 * Translucent palette colors are blended over the land, so a layer's own `opacity` stays the only
 * transparency.
 */
export function mapColors(scheme: ColorScheme) {
  const { palette } = themes[scheme];
  // The land is the map's own role (`basemapTheme`).
  const land = palette.map.land;
  const rgba = (value: string): RGBAColor => {
    const [r, g, b] = decomposeColor(solid(value, land)).values;
    return [r, g, b, 255];
  };
  return {
    series: palette.chart.series.map(rgba),
    neutral: rgba(palette.chart.neutral),
    sequential: palette.chart.sequential.map(rgba),
    /** Deviation from a midpoint: below and above. */
    below: rgba(palette.error.main),
    above: rgba(palette.success.main),
    /** Status, as everywhere else. */
    info: rgba(palette.info.main),
    warning: rgba(palette.warning.main),
    error: rgba(palette.error.main),
    success: rgba(palette.success.main),
    /** The land, for a marker's outline that sets it apart from what's below. */
    land: rgba(land),
  };
}
