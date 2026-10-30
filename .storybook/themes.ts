import { create } from 'storybook/theming';
import { createSchemeTheme } from '../src/mui/theme';

/**
 * Storybook's own light and dark interface themes, with the Kilowatt logo. The
 * Scheme toolbar switches between them (manager.ts, preview.tsx).
 *
 * Every color, the font and the corner radius come from the Kilowatt theme for the
 * same scheme, so the sidebar, toolbar, panels and docs pages sit on the same surfaces
 * and borders as the stories inside them.
 */

export type Scheme = 'light' | 'dark';

/** The logos live in src/assets and are served at ./brand/ (staticDirs in main.ts). */
const logo = (scheme: Scheme) =>
  // Only the space needs escaping; "=" and "," are valid in a path and static servers match them as is.
  `./brand/${encodeURI(`type=logo, mode=${scheme}.svg`)}`;

const brand = { brandTitle: 'Kilowatt', brandUrl: './?path=/docs/introduction--docs', brandTarget: '_self' };

const light = createSchemeTheme('light');
const dark = createSchemeTheme('dark');

/**
 * Storybook's accent: the selected sidebar item (under white text), active tabs, links
 * and focus. Light uses primary (navy). Dark primary is a light neutral that can't hold
 * white text, so dark uses the brand blue (light's `secondary.light`), which Storybook
 * darkens for the selected item to about the light scheme's `secondary.main`.
 */
const accent: Record<Scheme, string> = { light: light.palette.primary.main, dark: light.palette.secondary.light };

function storybookTheme(scheme: Scheme) {
  const { palette, typography, shape } = scheme === 'light' ? light : dark;
  const { background, text } = palette;
  const inverse = scheme === 'light' ? dark : light;
  // MUI types the radius as number | string; Kilowatt's is a number of pixels (the shape-radius departure).
  const radius = Number(shape.borderRadius);
  // One border for the whole interface: frames, separators, buttons and inputs alike.
  // Storybook's own controls are part of its interface, not Kilowatt controls, so they
  // take the frame border too: the divider (level1), so the chrome and the stories share one line.
  const frameBorder = palette.divider;
  return create({
    base: scheme,
    ...brand,
    brandImage: logo(scheme),

    colorPrimary: palette.primary.main,
    colorSecondary: accent[scheme],

    // The sidebar and toolbar are a card surface on the page; stories and docs sit on the page itself.
    appBg: background.level2,
    appContentBg: background.level0,
    appPreviewBg: background.level0,
    appHoverBg: palette.action.hover,
    appBorderColor: frameBorder,
    appBorderRadius: radius,

    fontBase: typography.fontFamily,

    textColor: text.primary,
    textInverseColor: inverse.palette.text.primary,
    textMutedColor: text.secondary,

    barBg: background.level2,
    barTextColor: text.secondary,
    barHoverColor: accent[scheme],
    barSelectedColor: accent[scheme],

    buttonBg: background.level3,
    buttonBorder: frameBorder,
    booleanBg: background.level0,
    booleanSelectedBg: background.level5,

    inputBg: background.level3,
    inputBorder: frameBorder,
    inputTextColor: text.primary,
    inputBorderRadius: radius,
  });
}

export const themes = { light: storybookTheme('light'), dark: storybookTheme('dark') };

/** The viewer's system setting, which the Scheme toolbar starts from. */
export function systemScheme(): Scheme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function schemeOf(globals: Record<string, unknown> | undefined): Scheme {
  return globals?.scheme === 'dark' ? 'dark' : 'light';
}
