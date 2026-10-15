import { create } from 'storybook/theming';

/**
 * Kilowatt's themes for the Storybook interface (sidebar, toolbar, panels) and the
 * docs pages: the Enertiv logo, the token surfaces and brand blue, and the system
 * fonts. The Scheme toolbar switches between them (manager.ts, preview.tsx).
 * Values are the token values from src/tokens.ts; the interface can't read CSS variables.
 */

export type Scheme = 'light' | 'dark';

/** The logos live in src/assets and are served at ./brand/ (staticDirs in main.ts). */
const logo = (scheme: Scheme) =>
  // Only the space needs escaping; "=" and "," are valid in a path and static servers match them as is.
  `./brand/${encodeURI(`type=logo, mode=${scheme}.svg`)}`;

const shared = {
  brandTitle: 'Kilowatt',
  brandUrl: './?path=/docs/introduction--docs',
  brandTarget: '_self',
  // The fonts load from Google Fonts in manager-head.html and preview-head.html.
  fontBase: 'Roboto, system-ui, sans-serif', // --font-sans
  fontCode: '"Roboto Mono", ui-monospace, monospace', // --font-mono
  // color/brand/700: white text on it clears 4.5:1, which brand/500 does not.
  colorSecondary: '#1c6487',
};

export const themes = {
  light: create({
    base: 'light',
    ...shared,
    brandImage: logo('light'),
    barSelectedColor: '#1c6487',
    appBg: '#f3f6f9', // backgroundLevel1
    appContentBg: '#ffffff', // backgroundPaper
    appPreviewBg: '#ffffff',
    appBorderColor: '#e2e8ef', // divider
    textColor: '#09161c', // textPrimary
    textMutedColor: '#365670', // textSecondary
  }),
  dark: create({
    base: 'dark',
    ...shared,
    brandImage: logo('dark'),
    barSelectedColor: '#51b5e6', // color/brand/400, readable on the dark toolbar
    appBg: '#0d2029', // backgroundLevel1
    appContentBg: '#09161c', // backgroundDefault
    appPreviewBg: '#09161c',
    appBorderColor: '#1b3e4f', // divider
    textColor: '#f9fafc', // textPrimary
    textMutedColor: '#cad5e2', // textSecondary
  }),
};

/** The viewer's system setting, which the Scheme toolbar starts from. */
export function systemScheme(): Scheme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function schemeOf(globals: Record<string, unknown> | undefined): Scheme {
  return globals?.scheme === 'dark' ? 'dark' : 'light';
}
