/**
 * Types for the palette keys Kilowatt adds to MUI's, through MUI's documented
 * module augmentation. The values are set in `departures.ts`.
 */

/** Surfaces by elevation: level0 is the page (darkest), level4 the highest surface (lightest). */
type SurfaceLevels = { level0: string; level1: string; level2: string; level3: string; level4: string };

/** Borders by contrast against the surfaces: level0 is the faintest, level2 the strongest, in both schemes. */
export type BorderLevels = { level0: string; level1: string; level2: string };

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TypeBackground extends SurfaceLevels {}
  interface Palette {
    border: BorderLevels;
  }
  interface PaletteOptions {
    border?: Partial<BorderLevels>;
  }
}
