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
 * 200 to 500 are the dark-scheme borders, 200 the control border at 3:1 or more on every
 * dark surface; 700 is light-scheme primary.
 */
export const navy = {
  50: '#88beec',
  100: '#72abdb',
  200: '#6ca2cf',
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
 * Enertiv's brand blue, #2EA6E1 at 500. The secondary intent reads from it, at the
 * steps that pass contrast: the brand blue itself is too light to be text.
 */
export const brand = {
  50: '#dcf0fa',
  100: '#b9e1f5',
  200: '#96d3f0',
  300: '#74c4eb',
  400: '#51b5e6',
  500: '#2ea6e1',
  600: '#2585b4',
  700: '#1c6487',
  800: '#12425a',
  900: '#09212d',
} as const;

/** Orange, for the light-scheme warning intent. */
export const orange = {
  50: '#fff1ec',
  100: '#ffe0d6',
  200: '#fdc4b2',
  300: '#fe9e7f',
  400: '#fb6632',
  500: '#e34712',
  600: '#bb3b0f',
  700: '#952f0c',
  800: '#772001',
  900: '#5c1300',
  950: '#410900',
} as const;

/** Yellow, for the dark-scheme warning intent. */
export const yellow = {
  50: '#fff5e4',
  100: '#ffe4bc',
  200: '#ffd491',
  300: '#ffc268',
  400: '#ffb44c',
  500: '#ffa83e',
  600: '#fb9c3a',
  700: '#f48e36',
  800: '#ed7f32',
  900: '#e16a2e',
} as const;
