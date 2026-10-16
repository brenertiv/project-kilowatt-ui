/**
 * Kilowatt's color ramps, in the shape MUI uses for its own (`@mui/material/colors`):
 * plain objects keyed by step, 50 the lightest. They are primitives: nothing reads
 * them except the palette in `departures.ts`, and components read the palette.
 */

/** Cool grays for light-scheme surfaces and borders. 50 is white. */
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
} as const;

/**
 * Deep blues for dark-scheme surfaces and borders, and the primary intent. 900 is the
 * darkest. 750 and 650 are added between the ramp's steps, as the OKLab midpoints of
 * their neighbours, so the dark scheme has five surfaces that all pass text contrast.
 * 25 is added past 50, a step lighter in OKLab, so dark-scheme primary passes 4.5:1
 * on every dark surface.
 */
export const navy = {
  25: '#88beec',
  50: '#79b5e8',
  100: '#72abdb',
  200: '#6ca2cf',
  300: '#6598c2',
  400: '#4f7da3',
  500: '#426a8a',
  600: '#365670',
  650: '#294a5f',
  700: '#1b3e4f',
  750: '#142f3c',
  800: '#0d2029',
  900: '#09161c',
} as const;
