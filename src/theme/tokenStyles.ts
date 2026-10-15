import { defaultDarkColors, defaultTheme, themeToCssText } from '../tokens';

const STYLE_ID = 'kilowatt-tokens';

/**
 * Writes every token as a CSS variable, light on `:root` and dark on `html.dark`,
 * from `src/tokens.ts`: the one source for the plain CSS components. The same
 * text ships as `/kilowatt-tokens.css`. Call once before render.
 */
export function installTokenStyles() {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.prepend(style);
  }
  style.textContent = themeToCssText(defaultTheme, defaultDarkColors);
}
