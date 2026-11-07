/**
 * Types for the palette keys Kilowatt adds to MUI's, through MUI's documented
 * module augmentation. The values are set in `departures.ts`.
 */

import type { CSSProperties } from 'react';

/** Surfaces: level0 is the background (darkest), level1 the docked panels, level2 the frame and page, level5 the highest surface (lightest). */
type SurfaceLevels = { level0: string; level1: string; level2: string; level3: string; level4: string; level5: string };

/**
 * Surface borders by contrast, in both schemes, for separators and frames: level0 is the
 * faintest, level3 the strongest. Control outlines don't use them; they have `control`.
 */
export type BorderLevels = { level0: string; level1: string; level2: string; level3: string };

/** Control outlines (inputs, selects, outlined buttons, toggle buttons), by state. Independent of the surface border levels. */
export type ControlColors = { border: string; hover: string; focus: string; pressed: string };

/**
 * A comparison where neither side is worse (Rules → Charts), such as this month against a year earlier:
 * one end color a side, `below` and `above`, on two ramps with nothing in common, drawn over the surface
 * at an opacity of the value over its cap; `contrastText` is the text over an end color where
 * `text.primary` no longer passes.
 */
export type DivergingColors = { below: string; above: string; contrastText: string };

/**
 * Chart data colors (Rules → Charts): `series` tells up to six categories apart, in a fixed
 * order; `seriesDark` is a darker shade of each slot, for the negative part of a two-part bar
 * (`undefined` where a slot has none, and the slot's own color stands in); `neutral` is for what
 * isn't the focus (a baseline, the previous period); `sequential` shows magnitude, from the step
 * nearest the surface to the one furthest from it; `diverging` shows a comparison where neither
 * side is worse.
 */
export type ChartColors = {
  series: string[];
  seriesDark: (string | undefined)[];
  neutral: string;
  sequential: string[];
  diverging: DivergingColors;
};

/**
 * Basemap colors the surface roles don't cover (Rules → Maps): `land`, a step past the page;
 * `water`, a step past the land; and `road` and `boundary`, for the lines CARTO draws at low zoom.
 */
export type MapColors = { land: string; water: string; road: string; boundary: string };

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TypeBackground extends SurfaceLevels {}
  interface TypographyVariants {
    brand: CSSProperties;
  }
  interface TypographyVariantsOptions {
    brand?: CSSProperties;
  }
  interface Palette {
    border: BorderLevels;
    control: ControlColors;
    chart: ChartColors;
    map: MapColors;
  }
  interface PaletteOptions {
    border?: Partial<BorderLevels>;
    control?: ControlColors;
    chart?: ChartColors;
    map?: MapColors;
  }
}

declare module '@mui/material/Typography' {
  /** `variant="brand"`: the serif for branded moments (`brand-type`). */
  interface TypographyPropsVariantOverrides {
    brand: true;
  }
}

declare module '@mui/material/Paper' {
  /** `variant="soft"`: a raised composer's level2 surface with the soft shadow (`soft-shadow`). */
  interface PaperPropsVariantOverrides {
    soft: true;
  }
}
