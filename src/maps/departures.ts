import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { Theme } from '@mui/material/styles';

/**
 * Every way Kilowatt's maps depart from stock CARTO, and nothing else.
 *
 * Stock is CARTO's basemap styles for MapLibre GL, Positron in the light scheme and Dark Matter
 * in the dark, with deck.gl's defaults for the data drawn on top. `theme` entries change the
 * basemap style: `basemapTheme` (`src/maps/theme.ts`) is built from them and sets nothing of its
 * own, so this list and the running basemap cannot disagree. `convention` entries are what each
 * reference map does in its own code, and `departures.test.ts` checks each map they name.
 * Foundations → CARTO departures in Storybook is generated from this file.
 *
 * To depart from CARTO, add an entry here with the reason. Anything not listed is CARTO's
 * default, on purpose. This file loads in Node (the docs build reads it), so it imports MapLibre
 * only as types.
 */

/** Kilowatt's reference maps, by component name. */
export type MapName = 'SiteMap';

const all: MapName[] = ['SiteMap'];

/**
 * What a basemap layer draws, from its source layer and id. CARTO's two styles share their
 * layers, so one mapping covers both; a layer that maps to none is left as CARTO draws it.
 */
// `landuse` (parks, land cover, residential areas) is told apart from the bare land.
export type BasemapFeature = 'land' | 'landuse' | 'water' | 'building' | 'road' | 'roadCasing' | 'boundary' | 'label';

/** What a theme entry's `apply` works with, for one color scheme. */
export type BasemapThemeContext = {
  /** CARTO's style for the scheme, copied. Entries change its layers in place. */
  style: StyleSpecification;
  /** The basemap's layers that draw one feature. */
  layers: (feature: BasemapFeature) => LayerSpecification[];
  /** Sets one paint property on a layer, leaving it alone where CARTO draws it transparent. */
  paint: (layer: LayerSpecification, property: string, value: unknown) => void;
  /** The MUI theme for the active color scheme: the palette and type the map takes its values from. */
  mui: Theme;
  /** A palette color as a solid hex, blended over the land when it's translucent. */
  color: (value: string) => string;
  /** The land (`map.land`), a step past the page. */
  land: string;
  /** Where Kilowatt's map fonts are served, as a MapLibre glyphs URL with `{fontstack}` and `{range}`. */
  glyphs: string;
};

export type MapDeparture = {
  id: string;
  /** `theme`: applied to every basemap through `basemapTheme`. `convention`: each map it names does it in its own code. */
  kind: 'theme' | 'convention';
  title: string;
  /** Why Kilowatt differs from CARTO here, in one or two sentences. */
  why: string;
  /** The reference maps whose look or use this changes. Each one's page lists it under "CARTO departures". */
  maps: MapName[];
  /** For a theme entry: the basemap layers it changes. */
  apply?: (context: BasemapThemeContext) => void;
  /** For a convention: what CARTO or MapLibre does, what Kilowatt does instead, and where. */
  convention?: { cartoDefault: string; kilowatt: string; where: string };
  /** For a convention: a pattern every map it names matches in its source, so a map that drops it fails `departures.test.ts`. */
  check?: RegExp;
};

/**
 * The Roboto faces basemap labels are set in (the `basemap-label-font` departure), as glyph files in
 * `src/maps/fonts`: Medium where CARTO sets a label in a medium or bold face (places, water bodies),
 * Regular everywhere else. Both are theme weights (`fontWeightRegular`, `fontWeightMedium`).
 */
export const mapFonts = { regular: 'Roboto Regular', medium: 'Roboto Medium' } as const;

/** The paint properties that color each kind of layer. */
const colorProperties: Record<string, string[]> = {
  background: ['background-color'],
  fill: ['fill-color', 'fill-outline-color'],
  line: ['line-color'],
};

/** Sets every color property a layer has to one color. */
function fillWith({ paint }: BasemapThemeContext, layer: LayerSpecification, value: string) {
  for (const property of colorProperties[layer.type] ?? []) paint(layer, property, value);
}

export const mapDepartures: MapDeparture[] = [
  {
    id: 'basemap-surfaces',
    kind: 'theme',
    title: 'Land, water and buildings from the surfaces',
    why: "CARTO's basemaps use their own warm grays. Kilowatt's land is `map.land`, a step of the surface ramp past the page, so the map sits recessed in its card, apart from every app surface; parks, land cover and residential areas take `background.level2`, a step lighter than the land, so towns and parks show as patches when zoomed out; buildings take `border.level2`, a step past the land the other way; and water is `map.water`, a step of the same ramp past the land.",
    maps: all,
    apply: (context) => {
      const { layers, mui, land } = context;
      for (const layer of layers('land')) fillWith(context, layer, land);
      // Land use a step lighter than the land, buildings a step past it, for structure without text.
      for (const layer of layers('landuse')) fillWith(context, layer, mui.palette.background.level2);
      for (const layer of layers('building')) fillWith(context, layer, mui.palette.border.level2);
      for (const layer of layers('water')) fillWith(context, layer, mui.palette.map.water);
    },
  },
  {
    id: 'basemap-roads',
    kind: 'theme',
    title: 'Roads from the surfaces and borders',
    why: 'CARTO draws roads, rail and runways in grays of its own. Kilowatt fills them with the highest surface (`background.level3`), the lightest tone on a light map, and edges them in `map.road`, a step past the water, so streets read as structure without competing with data. At low zoom CARTO draws only the casings of motorways and trunk roads, so `map.road` is what makes a zoomed-out map show its roads.',
    maps: all,
    apply: (context) => {
      for (const layer of context.layers('road')) fillWith(context, layer, context.mui.palette.background.level3);
      // Casings in the map's own road role, which reaches past the water.
      for (const layer of context.layers('roadCasing')) fillWith(context, layer, context.mui.palette.map.road);
    },
  },
  {
    id: 'basemap-boundaries',
    kind: 'theme',
    title: 'Boundaries in the divider',
    why: "CARTO draws county, state and country boundaries in tinted grays, half a pixel wide when zoomed out. Kilowatt draws them in `map.boundary`, the furthest step of the surface ramp from the land, keeping CARTO's dashes, and a pixel wide at the least, so state and country lines read on a zoomed-out map without a hue of their own.",
    maps: all,
    apply: (context) => {
      // The map's own boundary role, and no line thinner than a pixel.
      for (const layer of context.layers('boundary')) {
        fillWith(context, layer, context.mui.palette.map.boundary);
        const width = (layer as { paint?: Record<string, unknown> }).paint?.['line-width'];
        if (width && typeof width === 'object' && 'stops' in width && Array.isArray(width.stops)) {
          width.stops = (width.stops as [number, number][]).map(([zoom, px]) => [zoom, Math.max(1, px)]);
        }
      }
    },
  },
  {
    id: 'basemap-low-zoom',
    kind: 'theme',
    title: 'Structure when zoomed out',
    why: "CARTO's styles hold back most structure until the map is close: state boundaries draw only from zoom 6 (macroregions below it), motorway and trunk casings from zoom 5, land cover from zoom 7, and rivers at half a pixel. A map fitted to a portfolio sits at zoom 3 to 5, where that leaves labels and dots on bare land. Kilowatt draws state lines, the motorway and trunk network and land cover from zoom 3, and rivers a pixel wide at the least, so a zoomed-out map shows where things are without a label for each.",
    maps: all,
    apply: ({ style }) => {
      for (const layer of style.layers) {
        const paint = (layer as { paint?: Record<string, unknown> }).paint;
        if (layer.id === 'boundary_state' && layer.type === 'line') {
          // CARTO's filter draws states only from zoom 6 and macroregions below it; both at every zoom.
          layer.filter = ['any', ['==', ['get', 'kind_detail'], 4], ['==', ['get', 'kind'], 'macroregion']];
          layer.minzoom = 3;
        } else if (/_(mot|trunk)_case/.test(layer.id)) {
          layer.minzoom = Math.min(layer.minzoom ?? 3, 3);
        } else if (layer.id === 'landcover') {
          layer.minzoom = 3;
        } else if (layer.id === 'waterway' && paint) {
          const width = paint['line-width'];
          if (width && typeof width === 'object' && 'stops' in width && Array.isArray(width.stops)) {
            width.stops = (width.stops as [number, number][]).map(([zoom, px]) => [zoom, Math.max(1, px)]);
          }
        }
      }
    },
  },
  {
    id: 'basemap-labels',
    kind: 'theme',
    title: 'Labels in the secondary text color',
    why: 'CARTO sets place, road and water names in a dozen grays and tints. Kilowatt sets every label, and the dot beside a place name, in `text.secondary`, haloed in the land color, so labels pass 4.5:1 on the basemap and match the text around the map.',
    maps: all,
    apply: ({ layers, paint, mui, color, land }) => {
      for (const layer of layers('label')) {
        paint(layer, 'text-color', color(mui.palette.text.secondary));
        paint(layer, 'text-halo-color', land);
        paint(layer, 'icon-color', color(mui.palette.text.secondary));
      }
    },
  },
  {
    id: 'basemap-label-font',
    kind: 'theme',
    title: 'Labels in Roboto',
    why: "CARTO sets labels in Montserrat and Open Sans from its own font server, which has no Roboto, and sets water names in italics. Kilowatt serves Roboto's glyphs itself (`src/maps/fonts`) and sets every label in Roboto, Medium where CARTO uses a medium or bold face and Regular elsewhere, upright, so a map's labels match the type around it (`font-synthesis`: no italics). Chinese, Japanese and Korean names fall back to the viewer's system font, as MapLibre draws them locally.",
    maps: all,
    apply: ({ style, layers, glyphs }) => {
      style.glyphs = glyphs;
      for (const layer of layers('label')) {
        if (layer.type !== 'symbol' || !Array.isArray(layer.layout?.['text-font'])) continue;
        // CARTO's font stacks are plain lists of font names, the first its own face for the label.
        const [face] = layer.layout['text-font'] as string[];
        layer.layout['text-font'] = [/Medium|Bold/.test(face) ? mapFonts.medium : mapFonts.regular];
      }
    },
  },
  {
    id: 'map-card',
    kind: 'convention',
    title: 'In an outlined card, edge to edge',
    why: "MapLibre draws into whatever element it's given. Every Kilowatt map sits in an outlined `Card` under a title-only `CardHeader`, like a chart, and runs edge to edge below it, clipped to the card's corners, so the land meets the card surface with no frame inside the frame.",
    maps: all,
    convention: {
      cartoDefault: 'No container; the map fills its element',
      kilowatt:
        'An outlined `Card` with a title-only `CardHeader`; the map runs edge to edge below it, clipped by the card',
      where: 'Every map',
    },
    check: /position: 'absolute', inset: 0/,
  },
  {
    id: 'map-controls',
    kind: 'convention',
    title: 'Controls are MUI buttons',
    why: "MapLibre's zoom and compass controls are its own buttons, outside the theme. Kilowatt's maps put zoom in, zoom out and recenter in a column of `IconButton`s on an outlined `Paper` at the top right, each with an `Icon` and an `aria-label`, so they look, size and focus like every other control.",
    maps: all,
    convention: {
      cartoDefault: "MapLibre's `NavigationControl`",
      kilowatt: '`IconButton`s with `Icon` and an `aria-label`, calling `zoomIn`, `zoomOut` and `fitBounds`',
      where: 'Every map with controls',
    },
    check: /<IconButton\s+aria-label=/,
  },
  {
    id: 'map-scroll-zoom',
    kind: 'convention',
    title: 'Zoom with a modifier key',
    why: 'MapLibre zooms on every scroll-wheel turn, so a map in a page traps the scroll. Kilowatt maps turn on cooperative gestures: scrolling passes over the map, and zoom takes Ctrl or ⌘ with the wheel, or two fingers on touch.',
    maps: all,
    convention: {
      cartoDefault: 'Scroll-wheel zoom, one-finger pan',
      kilowatt: '`cooperativeGestures: true`',
      where: 'Every map',
    },
    check: /cooperativeGestures: true/,
  },
  {
    id: 'map-attribution',
    kind: 'convention',
    title: 'Compact attribution',
    why: "CARTO's terms and OpenStreetMap's license require their credit on the map, and MapLibre shows it in full across the bottom. Kilowatt keeps it, collapsed to MapLibre's compact info button so it doesn't sit on the data, on the card surface in the `caption` style and `text.secondary`.",
    maps: all,
    convention: {
      cartoDefault: "MapLibre's full `AttributionControl`",
      kilowatt: '`attributionControl: { compact: true }`, styled on the card surface; never removed',
      where: 'Every map',
    },
    check: /attributionControl: \{ compact: true \}/,
  },
  {
    id: 'map-data-colors',
    kind: 'convention',
    title: 'Data colors from the chart roles',
    why: "deck.gl's layers default to their own colors, and CARTO's styling helpers to CARTOColors schemes. Data on a Kilowatt map takes the chart roles, as RGBA arrays from `mapColors`: `series` for categories, `sequential` for magnitude, `success` and `error` for deviation, `neutral` for what isn't the focus (Rules → Charts).",
    maps: all,
    convention: {
      cartoDefault: "deck.gl's default colors; CARTOColors schemes in `colorBins` and `colorContinuous`",
      kilowatt:
        '`mapColors(scheme)` from `src/maps/theme`, passed to `getFillColor` and as `colors` to the styling helpers',
      where: 'Every data layer',
    },
    check: /mapColors\(/,
  },
  {
    id: 'map-tooltips',
    kind: 'convention',
    title: 'A full-value tooltip on every item',
    why: 'deck.gl shows no tooltip unless one is set up, and its default is unstyled text. Every item a pointer can rest on (a site, a region) has a tooltip on the menu surface with its name and exact value and unit, written with `Intl`, as chart tooltips are.',
    maps: all,
    convention: {
      cartoDefault: 'No tooltip; `getTooltip` renders plain text',
      kilowatt: 'An MUI `Tooltip` or `Popper` on the menu surface, from the hovered item',
      where: 'Every pickable layer',
    },
    check: /Tooltip|Popper/,
  },
  {
    id: 'map-text-alternative',
    kind: 'convention',
    title: 'Named by a summary, with a list',
    why: "MapLibre's canvas has no text a screen reader can read, and a map is hard to use by keyboard. Every Kilowatt map sits in a `figure` named by a one-line summary (`aria-label`), and what it shows is also available as a list or table.",
    maps: all,
    convention: {
      cartoDefault: 'A canvas with no accessible name',
      kilowatt: 'A `figure` with `aria-label={summary}`, and the same items as a list or table',
      where: 'Every map',
    },
    check: /aria-label=\{summary\}/,
  },
];
