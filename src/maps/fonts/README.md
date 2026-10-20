# Map fonts

Roboto Regular and Roboto Medium as MapLibre glyph files (signed-distance-field PBFs, one per
256-character range), so basemap labels are set in the theme's font (the `basemap-label-font`
departure in `src/maps/departures.ts`). CARTO's own font server has no Roboto.

- Source: the OpenMapTiles fonts v2.0 release (github.com/openmaptiles/fonts), built from Google's Roboto.
- License: Roboto is under the Apache License 2.0.
- Served by Storybook at `/map-fonts/` (`.storybook/main.ts`). An app that rebuilds Kilowatt's maps
  hosts this folder too and passes its URL to `basemapStyle`.
