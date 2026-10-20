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
  switch (source) {
    case 'landcover':
    case 'landuse':
    case 'park':
      return 'land';
    case 'water':
    case 'waterway':
      return 'water';
    case 'building':
      return 'building';
    case 'boundary':
      return 'boundary';
    case 'aeroway':
      return 'road';
    case 'transportation':
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
 * @param departures - The departures to apply. Default: all of them; tests pass fewer.
 */
export function basemapTheme(
  style: StyleSpecification,
  scheme: ColorScheme,
  departures: MapDeparture[] = mapDepartures,
): StyleSpecification {
  const mui = themes[scheme];
  const land = mui.palette.background.level1;
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
  };
  // The theme is the departures' changes and nothing else (Foundations → CARTO departures).
  for (const departure of departures) departure.apply?.(context);
  return copy;
}

const styles = new Map<ColorScheme, Promise<StyleSpecification>>();

/**
 * Fetches CARTO's basemap style for one color scheme and applies Kilowatt's theme, once per scheme.
 * Pass the result to MapLibre's `style` option, or to `setStyle` when the scheme changes.
 *
 * @param scheme - The active color scheme, `light` or `dark`.
 */
export function basemapStyle(scheme: ColorScheme): Promise<StyleSpecification> {
  let style = styles.get(scheme);
  if (!style) {
    style = fetch(basemapStyleUrl[scheme])
      .then((response) => {
        if (!response.ok) throw new Error(`CARTO basemap style: ${response.status}`);
        return response.json() as Promise<StyleSpecification>;
      })
      .then((carto) => basemapTheme(carto, scheme));
    // A failed fetch isn't kept, so the next map tries again.
    style.catch(() => styles.delete(scheme));
    styles.set(scheme, style);
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
  const land = palette.background.level1;
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
