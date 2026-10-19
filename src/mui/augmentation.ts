/**
 * Types for the palette keys Kilowatt adds to MUI's, through MUI's documented
 * module augmentation. The values are set in `departures.ts`.
 */

/** Surfaces by elevation: level0 is the page (darkest), level4 the highest surface (lightest). */
type SurfaceLevels = { level0: string; level1: string; level2: string; level3: string; level4: string };

/**
 * Borders by contrast against the surfaces, in both schemes: level0 is the faintest; level3,
 * the strongest, for outlines on interactive elements (3:1 in dark; below it in light for now);
 * MUI's controls take their outline from `control` instead.
 */
export type BorderLevels = { level0: string; level1: string; level2: string; level3: string };

/** Control outlines (inputs, selects, outlined buttons, toggle buttons), by state, from the Figma button-border tokens. */
export type ControlColors = { border: string; hover: string; focus: string; pressed: string };

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TypeBackground extends SurfaceLevels {}
  interface Palette {
    border: BorderLevels;
    control: ControlColors;
  }
  interface PaletteOptions {
    border?: Partial<BorderLevels>;
    control?: ControlColors;
  }
}
