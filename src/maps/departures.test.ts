// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { getContrastRatio } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import { createSchemeTheme } from '../mui/theme';
import type { ColorScheme } from '../mui/departures';
import { cartoStyle } from './cartoStyle.fixture';
import { mapDepartures, mapFonts } from './departures';
import { basemapFeature, basemapTheme, mapColors, mapGlyphsUrl } from './theme';

const source = (file: string) => readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
const schemes: ColorScheme[] = ['light', 'dark'];

/** Every color a style's layers paint, by layer id and property. */
function paintedColors(style: ReturnType<typeof basemapTheme>) {
  return style.layers.flatMap((layer) =>
    Object.entries((layer as { paint?: Record<string, unknown> }).paint ?? {})
      .filter(([property]) => property.endsWith('-color'))
      .map(([property, value]) => ({ layer: layer.id, property, value })),
  );
}

describe('map departures', () => {
  it('have unique ids and a reason', () => {
    const ids = mapDepartures.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const departure of mapDepartures) expect(departure.why.length, departure.id).toBeGreaterThan(40);
  });

  it('change the basemap when they are theme entries, and describe a convention otherwise', () => {
    for (const departure of mapDepartures) {
      if (departure.kind === 'theme') {
        expect(departure.apply, `${departure.id} has no apply`).toBeDefined();
        expect(departure.convention, departure.id).toBeUndefined();
        const all = JSON.stringify(basemapTheme(cartoStyle, 'light'));
        const without = JSON.stringify(
          basemapTheme(cartoStyle, 'light', { departures: mapDepartures.filter((entry) => entry !== departure) }),
        );
        expect(without, `${departure.id} changes nothing`).not.toBe(all);
      } else {
        expect(departure.apply, departure.id).toBeUndefined();
        expect(departure.convention, `${departure.id} has no convention`).toBeDefined();
        expect(departure.check, `${departure.id} has no check`).toBeDefined();
      }
    }
  });

  it('are the only changes the basemap theme makes', () => {
    // basemapTheme is built from the theme entries; a paint set directly in theme.ts would skip the list and its docs.
    expect(source('./theme.ts')).not.toMatch(/\.paint\[|setPaintProperty/);
    expect(source('./theme.ts')).toMatch(/for \(const departure of departures\) departure\.apply\?\.\(context\)/);
  });

  it.each(
    mapDepartures
      .filter(({ kind }) => kind === 'convention')
      .flatMap(({ id, maps, check }) => maps.map((map: string) => ({ id, map, check }))),
  )('$map follows $id', ({ map, check }) => {
    expect(source(`./${map}.tsx`)).toMatch(check!);
  });
});

describe('basemap theme', () => {
  it("knows what every one of CARTO's layers draws", () => {
    const unknown = cartoStyle.layers.filter((layer) => basemapFeature(layer) === undefined).map(({ id }) => id);
    expect(unknown).toEqual([]);
  });

  it('leaves the style passed in as it is', () => {
    const before = JSON.stringify(cartoStyle);
    basemapTheme(cartoStyle, 'dark');
    expect(JSON.stringify(cartoStyle)).toBe(before);
  });

  it.each(schemes)('is a valid MapLibre style in %s', (scheme) => {
    expect(validateStyleMin(basemapTheme(cartoStyle, scheme))).toEqual([]);
  });

  it.each(schemes)('paints only palette colors in %s', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    const style = basemapTheme(cartoStyle, scheme);
    const textColor = paintedColors(style).find(({ property }) => property === 'text-color')!.value;
    const allowed = new Set([
      palette.background.level1,
      palette.background.level2,
      palette.map.water,
      palette.border.level0,
      palette.border.level1,
      textColor,
      'transparent',
    ]);
    const stray = paintedColors(style).filter(({ value }) => typeof value !== 'string' || !allowed.has(value));
    expect(stray).toEqual([]);
  });

  it.each(schemes)('sets labels at 4.5:1 on the land and water in %s', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    const style = basemapTheme(cartoStyle, scheme);
    const colors = paintedColors(style).filter(
      ({ property }) => property === 'text-color' || property === 'icon-color',
    );
    for (const { layer, value } of colors.filter(({ value }) => value !== 'transparent')) {
      for (const surface of [palette.background.level1, palette.map.water]) {
        expect(getContrastRatio(value as string, surface), `${layer} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("sets every label in Roboto, upright, from Kilowatt's own glyphs", () => {
    const style = basemapTheme(cartoStyle, 'light', {
      glyphs: 'https://example.com/map-fonts/{fontstack}/{range}.pbf',
    });
    expect(style.glyphs).toBe('https://example.com/map-fonts/{fontstack}/{range}.pbf');
    const stacks = style.layers.flatMap((layer) => (layer.type === 'symbol' ? [layer.layout?.['text-font']] : []));
    expect(stacks.length).toBeGreaterThan(0);
    for (const stack of stacks) expect(Object.values(mapFonts).map((font) => [font])).toContainEqual(stack);
    // CARTO's medium and bold faces become Roboto Medium, so place names keep their weight.
    expect(stacks).toContainEqual([mapFonts.medium]);
    expect(stacks).toContainEqual([mapFonts.regular]);
  });

  it.each(Object.values(mapFonts))('serves %s for every character range', (font) => {
    const dir = fileURLToPath(new URL(`./fonts/${font}/`, import.meta.url));
    expect(existsSync(dir), dir).toBe(true);
    // MapLibre asks for a range whenever a label has a character in it, so all 256 must exist.
    const ranges = Array.from({ length: 256 }, (_, i) => `${i * 256}-${i * 256 + 255}.pbf`);
    expect(new Set(readdirSync(dir))).toEqual(new Set(ranges));
  });

  it('resolves the glyphs URL without encoding its placeholders', () => {
    expect(mapGlyphsUrl('https://kilowatt-ui.vercel.app/iframe.html')).toBe(
      'https://kilowatt-ui.vercel.app/map-fonts/{fontstack}/{range}.pbf',
    );
  });
});

describe('map data colors', () => {
  it.each(schemes)('reach 3:1 on the land, water and buildings in %s', (scheme) => {
    const { palette } = createSchemeTheme(scheme);
    const { series, neutral } = mapColors(scheme);
    const css = ([r, g, b]: number[]) => `rgb(${r}, ${g}, ${b})`;
    for (const color of [...series, neutral]) {
      for (const surface of [palette.background.level1, palette.background.level2, palette.map.water]) {
        expect(getContrastRatio(css(color), surface), `${css(color)} on ${surface}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('are opaque, so a layer’s own opacity is its only transparency', () => {
    for (const scheme of schemes) {
      const colors = mapColors(scheme);
      for (const color of [...colors.series, ...colors.sequential, colors.neutral]) expect(color[3]).toBe(255);
    }
  });
});
