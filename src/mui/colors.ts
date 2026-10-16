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
 * Deep blues for dark-scheme surfaces and borders, and the primary intent. 950 is the
 * darkest. Five dark surfaces (600 to 950) all pass text contrast, and the light end
 * (50) passes 4.5:1 as dark-scheme primary on every dark surface; some steps were
 * derived in OKLab between or beyond the original ramp's to get there.
 */
export const navy = {
  50: '#88beec',
  100: '#72abdb',
  200: '#6598c2',
  300: '#4f7da3',
  400: '#426a8a',
  500: '#365670',
  600: '#294a5f',
  700: '#1b3e4f',
  800: '#142f3c',
  900: '#0d2029',
  950: '#09161c',
} as const;
