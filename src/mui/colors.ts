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
  950: '#768699',
} as const;

/**
 * Enertiv navy, a subtle ramp: deep, low-saturation blues. 600 to 950 are the
 * dark-scheme surfaces (evenly spaced, growing steadily more saturated toward 600);
 * 200 to 500 are the dark-scheme borders; 700 is light-scheme primary. 200, the dark
 * control border, is lightened a touch from #6598c2 so it clears 3:1 with headroom on
 * every dark surface.
 */
export const navy = {
  50: '#88beec',
  100: '#72abdb',
  200: '#689bc5',
  300: '#4f7da3',
  400: '#426a8a',
  500: '#365670',
  600: '#294a5f',
  700: '#1b3e4f',
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
