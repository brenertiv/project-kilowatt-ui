import { getLuminance } from '@mui/material/styles';
import type { ColorScheme } from '../mui/departures';

/**
 * The order a stack's parts are drawn in, from the start of the value axis (the bottom of a column,
 * the left of a bar), as indices into `colors` (Rules → Charts → A stack runs dark to light). The
 * run spans every color in the stack, whatever its ramp: a column is darkest at the bottom and
 * lightest at the top, a bar lightest at the left and darkest at the right, and the dark scheme
 * reverses both. Parts of one color (a series and its striped variant) keep the order they're given.
 *
 * @param colors - Each part's color in the scheme, as a CSS color with its value (not a CSS variable).
 * @param scheme - The color scheme the stack is drawn in.
 * @param horizontal - `true` for a bar that runs left to right. Default `false`, a column.
 */
export function stackOrder(colors: string[], scheme: ColorScheme, horizontal = false): number[] {
  const lightness = colors.map((color) => getLuminance(color));
  const darkestFirst = (scheme === 'light') !== horizontal;
  return colors.map((_, i) => i).sort((a, b) => (darkestFirst ? lightness[a] - lightness[b] : lightness[b] - lightness[a]));
}
