/**
 * Kilowatt's color ramps, in the shape MUI uses for its own (`@mui/material/colors`):
 * plain objects keyed by step, 50 the lightest. They are primitives: nothing reads
 * them except the palette in `departures.ts`, and components read the palette.
 */

/**
 * Cool grays for light-scheme surfaces and borders. 50 is white. 950 is added past 900,
 * darker along the ramp's own hue in OKLab, so control outlines reach 3:1 on every
 * light surface.
 */
export const slate = {
  50: '#ffffff',
  100: '#f9fafc',
  200: '#f3f6f9',
  300: '#edf1f5',
  400: '#e7ecf2',
  500: '#e2e8ef',
  600: '#dce3ec',
  700: '#d6dee8',
  800: '#d0dae5',
  900: '#cad5e2',
  950: '#79899c',
} as const;

/**
 * Enertiv navy. One ramp in two parts: 50 to 500 are saturated brand blues (dark-scheme
 * borders, primary's lighter steps); 600 to 950 are quiet, evenly spaced dark steps for
 * the dark-scheme surfaces, with 700 shared as light-scheme primary. The drop in
 * saturation between 500 and 600 is where the ramp turns from accent to surface.
 */
export const navy = {
  50: '#5cb6ff',
  100: '#3dacfe',
  200: '#38a4f1',
  300: '#349ae2',
  400: '#1d7ec0',
  500: '#166ba2',
  600: '#294a5f',
  700: '#023f57',
  800: '#142f3c',
  900: '#0d2029',
  950: '#09161c',
} as const;

/**
 * Enertiv's brand blue, #2EA6E1, at 500, with the other steps derived from it in OKLab
 * (lightness spaced evenly, chroma tapering toward the ends). The secondary intent
 * reads from it.
 */
export const brand = {
  50: '#dff8ff',
  100: '#c5edff',
  200: '#9fdcff',
  300: '#6fc9fd',
  400: '#4db7ef',
  500: '#2ea6e1',
  600: '#008cc6',
  700: '#006fa4',
  800: '#005a88',
  900: '#004468',
  950: '#00324d',
} as const;
