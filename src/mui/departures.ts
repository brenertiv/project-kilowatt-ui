import type { ThemeOptions } from '@mui/material/styles';
import { iconWeight } from '../icons';
import './augmentation';
import type { BorderLevels } from './augmentation';
import { deepOrange, green, lightBlue, purple, red } from '@mui/material/colors';
import { navy, slate } from './colors';

/**
 * Every way Kilowatt departs from stock Material UI, and nothing else.
 *
 * The theme (`theme.ts`) is MUI's defaults with these entries merged on top, so
 * this list and the running theme cannot disagree, and `departures.test.ts`
 * fails if the theme differs from MUI anywhere a departure doesn't claim.
 * Foundations → MUI departures in Storybook is generated from this file.
 *
 * To depart from MUI, add an entry here with the reason. Anything not listed is
 * MUI's default, on purpose.
 */

export type ColorScheme = 'light' | 'dark';

export type DepartureArea = 'Theme' | 'Palette' | 'Typography' | 'Components' | 'Icons';

export type Departure = {
  id: string;
  area: DepartureArea;
  title: string;
  /** Why Kilowatt differs from MUI here, in one or two sentences. */
  why: string;
  /** The theme options this departure sets. Absent for conventions outside the theme. */
  options?: (scheme: ColorScheme) => ThemeOptions;
  /** For a convention outside the theme: what MUI does, what Kilowatt does instead, and where. */
  convention?: { muiDefault: string; kilowatt: string; where: string };
  /**
   * The MUI components (by import name, as in `@mui/material/Button`) whose look or use this
   * departure changes. Each one's docs page lists it under "MUI departures", and
   * `src/components/docs.test.ts` checks that it does. Absent for a theme-wide departure
   * (the palette, CSS variables), which every component inherits and no page lists.
   */
  components?: string[];
};

/** Surfaces by elevation, per scheme: the ramp step each level uses. level0 is the page (darkest), level4 the highest (lightest). */
export const surfaceSteps = {
  light: { level0: 400, level1: 300, level2: 200, level3: 100, level4: 50 },
  dark: { level0: 900, level1: 800, level2: 750, level3: 700, level4: 650 },
} as const satisfies Record<ColorScheme, Record<string, number>>;

/** Borders by contrast, per scheme: level0 the faintest, level2 the strongest. `divider` is level1. */
export const borderSteps = {
  light: { level0: 500, level1: 700, level2: 900 },
  dark: { level0: 600, level1: 500, level2: 400 },
} as const satisfies Record<ColorScheme, Record<keyof BorderLevels, number>>;

const ramps = { light: slate, dark: navy } as const;

function levels<T extends Record<string, number>>(scheme: ColorScheme, steps: T): Record<keyof T, string> {
  const ramp = ramps[scheme] as Record<number, string>;
  return Object.fromEntries(Object.entries(steps).map(([level, step]) => [level, ramp[step]])) as Record<keyof T, string>;
}

/** The surface level each Paper elevation sits on: flat and card surfaces, app bars and snackbars, menus, drawers and dialogs. */
export const elevationSurfaces: { elevations: [number, number]; level: keyof typeof surfaceSteps.light; uses: string }[] = [
  { elevations: [0, 1], level: 'level1', uses: 'Paper, Card, Accordion' },
  { elevations: [2, 6], level: 'level2', uses: 'AppBar, Snackbar' },
  { elevations: [7, 12], level: 'level3', uses: 'Menu, Popover' },
  { elevations: [13, 24], level: 'level4', uses: 'Drawer, Dialog' },
];

type Intent = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

/**
 * The intents Kilowatt moves off MUI's default, per scheme: a step from MUI's own
 * color ramps that passes 4.5:1 as text on every surface level, with its contrast
 * text also at 4.5:1 or better. Intents not listed keep MUI's default, which
 * already passes. MUI derives `light` and `dark` from `main`.
 */
export const intentSteps: Record<ColorScheme, Partial<Record<Intent, { ramp: string; step: string; main: string }>>> = {
  light: {
    error: { ramp: 'red', step: '800', main: red[800] },
    warning: { ramp: 'deepOrange', step: '900', main: deepOrange[900] },
    info: { ramp: 'lightBlue', step: '900', main: lightBlue[900] },
    success: { ramp: 'green', step: '900', main: green[900] },
  },
  dark: {
    secondary: { ramp: 'purple', step: '100', main: purple[100] },
    error: { ramp: 'red', step: '100', main: red[100] },
    info: { ramp: 'lightBlue', step: '300', main: lightBlue[300] },
    success: { ramp: 'green', step: '300', main: green[300] },
  },
};

/** MUI's contrast text for each scheme: white on light-scheme intents, near-black on dark-scheme ones. */
const intentContrastText: Record<ColorScheme, string> = { light: '#fff', dark: 'rgba(0, 0, 0, 0.87)' };

/**
 * Primary, per scheme, on the navy ramp: `main` and the hover step (`dark`). Light sets
 * `light` too, since MUI's derived shades of a navy this deep barely differ; dark lets
 * MUI derive `light` from `main`.
 */
export const primarySteps: Record<ColorScheme, { main: keyof typeof navy; light?: keyof typeof navy; dark: keyof typeof navy }> = {
  light: { main: 700, light: 600, dark: 800 },
  dark: { main: 25, dark: 100 },
};

/** Selectable MUI controls whose selected state fills their icons. Each gets `Mui-selected` when selected. */
const selectableControls = ['ToggleButton', 'Tab', 'ListItemButton', 'MenuItem', 'BottomNavigationAction'] as const;

export const departures: Departure[] = [
  {
    id: 'css-variables',
    area: 'Theme',
    title: 'CSS theme variables',
    why: "MUI's opt-in CSS variables mode, with the color scheme switched by a `dark` class on <html>. Theme styles can then name a palette value once, as `var(--mui-palette-…)`, and get the right color in each scheme, which the elevation-to-surface mapping needs.",
    options: () => ({ cssVariables: { colorSchemeSelector: 'class' } }),
  },
  {
    id: 'surfaces-and-borders',
    area: 'Palette',
    title: 'Surface and border levels',
    why: "Five surfaces by elevation and three borders by contrast, from the slate (light) and navy (dark) ramps, in place of MUI's white or #121212 surfaces and single divider. `background.default` is level0 and `background.paper` level1, so MUI's components pick them up; `divider` is border level1.",
    options: (scheme) => {
      const surfaces = levels(scheme, surfaceSteps[scheme]);
      const border = levels(scheme, borderSteps[scheme]);
      return { palette: { background: { ...surfaces, default: surfaces.level0, paper: surfaces.level1 }, border, divider: border.level1 } };
    },
  },
  {
    id: 'intents-on-surfaces',
    area: 'Palette',
    title: 'Intent colors that pass on every surface',
    why: "MUI's intents are tuned for a white or #121212 background, and several fall below 4.5:1 as text on the surface levels. These take a nearby step from MUI's own color ramps that passes on every level in its scheme; the intents that already pass stay as MUI ships them. Light warning moves to deep orange, since no orange step passes on the light surfaces.",
    options: (scheme) => ({
      palette: Object.fromEntries(
        Object.entries(intentSteps[scheme]).map(([intent, { main }]) => [intent, { main, contrastText: intentContrastText[scheme] }]),
      ),
    }),
  },
  {
    id: 'primary-navy',
    area: 'Palette',
    title: 'Navy primary',
    why: "Primary is Enertiv navy instead of MUI's blue: navy 700 in light, and navy 25 in dark, the light end of the same ramp so it reads on the dark navy surfaces. Like the other intents, it passes 4.5:1 as text on every surface level, and its contrast text passes on it. Every component that uses `primary` (buttons, links, focus rings, checkboxes, tabs, progress) turns navy.",
    options: (scheme) => {
      const { main, light, dark } = primarySteps[scheme];
      return {
        palette: {
          primary: { main: navy[main], ...(light === undefined ? {} : { light: navy[light] }), dark: navy[dark], contrastText: intentContrastText[scheme] },
        },
      };
    },
  },
  {
    id: 'button-text-case',
    area: 'Typography',
    components: ['Button', 'ToggleButton', 'Tab', 'Fab', 'BottomNavigationAction'],
    title: 'Button labels in Title Case',
    why: "MUI uppercases every label set in the `button` type style. Kilowatt shows labels as written, and writes them in Title Case. CSS can't do Title Case (`capitalize` also capitalizes minor words such as \"and\"), so it's a writing convention: what's in the code is what people and screen readers get, and it carries through translation.",
    options: () => ({ typography: { button: { textTransform: 'none' } } }),
    convention: {
      muiDefault: 'Labels uppercased by `typography.button.textTransform`',
      kilowatt: 'Labels shown as written, written in Title Case: "Dispatch Ticket", "Export CSV", "Save and Close"',
      where: 'Every label of a Button, ToggleButton, Tab, Fab or BottomNavigationAction',
    },
  },
  {
    id: 'flat-buttons',
    area: 'Components',
    components: ['Button', 'ButtonGroup'],
    title: 'Flat buttons',
    why: "Contained buttons sit flat, without MUI's elevation (2, rising to 4 on hover and 8 when pressed), so they read as controls on a surface rather than as surfaces of their own. This is MUI's own `disableElevation`, made the default; `theme.shadows` is unchanged, so Paper, menus and dialogs keep theirs.",
    options: () => ({
      components: {
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiButtonGroup: { defaultProps: { disableElevation: true } },
      },
    }),
  },
  {
    id: 'paper-surface-levels',
    components: ['Paper', 'Card', 'Accordion', 'AppBar', 'Snackbar', 'Menu', 'Popover', 'Drawer', 'Dialog'],
    area: 'Components',
    title: 'Paper takes its surface from its elevation',
    why: "Paper's background steps up the surface levels with its elevation, in both schemes, in place of MUI's white light surfaces and its dark-scheme white overlay. Cards sit on level1, app bars on level2, menus on level3, drawers and dialogs on level4.",
    options: () => ({
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              ...Object.fromEntries(
                elevationSurfaces.flatMap(({ elevations: [from, to], level }) =>
                  Array.from({ length: to - from + 1 }, (_, index) => [
                    `&.MuiPaper-elevation${from + index}`,
                    { backgroundColor: `var(--mui-palette-background-${level})` },
                  ]),
                ),
              ),
            },
          },
        },
      },
    }),
  },
  {
    id: 'icons',
    components: ['Icon', 'Button', 'IconButton'],
    area: 'Icons',
    title: 'Icon set',
    why: `Google's Material Symbols variable font through MUI's Icon, instead of MUI's SVG icon package, so weight and fill are axes rather than separate icons. Icons render at weight ${iconWeight}, a step lighter than the font's 400, so they sit lighter beside text.`,
    convention: {
      muiDefault: 'SVG icons from @mui/icons-material',
      kilowatt: `MUI's Icon with Material Symbols Outlined at weight ${iconWeight}, through the Icon component in src/icons.tsx`,
      where: 'src/icons.tsx; @mui/icons-material is not installed',
    },
    options: () => ({
      components: {
        MuiIcon: {
          defaultProps: { baseClassName: 'material-symbols-outlined' },
          styleOverrides: {
            // The axes read inherited custom properties, so a selected control can fill
            // the icons inside it and an icon's own fill or weight prop still wins.
            root: { fontVariationSettings: `'FILL' var(--icon-fill, 0), 'wght' var(--icon-weight, ${iconWeight})` },
          },
        },
      },
    }),
  },
  {
    id: 'selected-fills-icons',
    components: [...selectableControls],
    area: 'Components',
    title: 'Selected controls fill their icons',
    why: 'A selected control shows its icon filled and an unselected one outlined, so selection reads from the glyph as well as from the control\'s color. Applies to every MUI control with a selected state; an icon with an explicit fill keeps it.',
    options: () => ({
      components: Object.fromEntries(
        selectableControls.map((control) => [`Mui${control}`, { styleOverrides: { root: { '&.Mui-selected': { '--icon-fill': 1 } } } }]),
      ),
    }),
  },
];
