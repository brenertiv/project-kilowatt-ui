import { create } from 'storybook/theming';

/**
 * Storybook's own light and dark interface themes, with the Kilowatt logo. The
 * Scheme toolbar switches between them (manager.ts, preview.tsx).
 */

export type Scheme = 'light' | 'dark';

/** The logos live in src/assets and are served at ./brand/ (staticDirs in main.ts). */
const logo = (scheme: Scheme) =>
  // Only the space needs escaping; "=" and "," are valid in a path and static servers match them as is.
  `./brand/${encodeURI(`type=logo, mode=${scheme}.svg`)}`;

const brand = { brandTitle: 'Kilowatt', brandUrl: './?path=/docs/introduction--docs', brandTarget: '_self' };

export const themes = {
  light: create({ base: 'light', ...brand, brandImage: logo('light') }),
  dark: create({ base: 'dark', ...brand, brandImage: logo('dark') }),
};

/** The viewer's system setting, which the Scheme toolbar starts from. */
export function systemScheme(): Scheme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function schemeOf(globals: Record<string, unknown> | undefined): Scheme {
  return globals?.scheme === 'dark' ? 'dark' : 'light';
}
