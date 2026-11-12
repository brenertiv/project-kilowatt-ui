import type { ThemeOptions } from '@mui/material/styles';
import { iconWeight } from '../icons';
import './augmentation';
import type { BorderLevels } from './augmentation';
import { blueGrey, purple, red } from '@mui/material/colors';
import { aquaverde, brand, green, navy, orange, parchment, slate, violet, yellow } from './colors';

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

/** Surfaces, per scheme: the ramp step each level uses. level0 is the background (darkest), level1 the docked panels, level2 the frame and page, and level5 the highest (lightest). */
export const surfaceSteps = {
  light: { level0: 300, level1: 200, level2: 100, level3: 50, level4: 50, level5: 50 },
  dark: { level0: 950, level1: 900, level2: 800, level3: 700, level4: 600, level5: 600 },
} as const satisfies Record<ColorScheme, Record<string, number>>;

/** Surface borders by contrast, per scheme: level0 the faintest, level3 the strongest. `divider` is level1. Control outlines are separate (`control-outlines`). */
export const borderSteps = {
  light: { level0: 400, level1: 500, level2: 700, level3: 800 },
  dark: { level0: 600, level1: 500, level2: 400, level3: 200 },
} as const satisfies Record<ColorScheme, Record<keyof BorderLevels, number>>;

const ramps = { light: slate, dark: navy } as const;

function levels<T extends Record<string, number>>(scheme: ColorScheme, steps: T): Record<keyof T, string> {
  const ramp = ramps[scheme] as Record<number, string>;
  return Object.fromEntries(Object.entries(steps).map(([level, step]) => [level, ramp[step]])) as Record<keyof T, string>;
}

/** The surface level each Paper elevation sits on: flat surfaces, app bars and snackbars, menus, drawers and dialogs. Cards sit on level3 at any elevation (`paper-surface-levels`). */
export const elevationSurfaces: { elevations: [number, number]; level: keyof typeof surfaceSteps.light; uses: string }[] = [
  { elevations: [0, 1], level: 'level2', uses: 'The frame and page, flat Paper, Accordion' },
  { elevations: [2, 6], level: 'level3', uses: 'AppBar, Snackbar, and every Card' },
  { elevations: [7, 12], level: 'level4', uses: 'Menu, Popover (light; level2 in dark)' },
  { elevations: [13, 24], level: 'level5', uses: 'Drawer, Dialog (light; level2 in dark)' },
];

/** The overlays that sit on level2 with the divider as their edge in the dark scheme, by their MUI component and Paper slot (`paper-surface-levels`). */
const darkOverlays = ['MuiDialog', 'MuiDrawer', 'MuiMenu', 'MuiPopover'] as const;

type Intent = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

/**
 * The intents Kilowatt moves off MUI's default, per scheme: a step from a color ramp (MUI's
 * own for error and info; Kilowatt's orange and yellow for warning and green for success) that
 * passes 4.5:1 as text on every surface level, with its contrast text also at 4.5:1 or better. Intents not listed keep MUI's default, which
 * already passes. MUI derives `light` and `dark` from `main`, except where `dark` is set: success's
 * is a deeper step of the green ramp, for the negative part of a two-part bar (`SegmentedBar`'s
 * `shade: 'dark'`), at 3:1 on the card.
 */
export const intentSteps: Record<ColorScheme, Partial<Record<Intent, { ramp: string; step: string; main: string; dark?: { step: string; value: string } }>>> = {
  light: {
    error: { ramp: 'red', step: '800', main: red[800] },
    warning: { ramp: 'orange', step: '700', main: orange[700] },
    info: { ramp: 'purple', step: '500', main: purple[500] },
    success: { ramp: 'green', step: '700', main: green[700], dark: { step: '900', value: green[900] } },
  },
  dark: {
    error: { ramp: 'red', step: '100', main: red[100] },
    info: { ramp: 'purple', step: '100', main: purple[100] },
    success: { ramp: 'green', step: '300', main: green[300], dark: { step: '600', value: green[600] } },
    warning: { ramp: 'yellow', step: '400', main: yellow[400] },
  },
};

/** MUI's contrast text for each scheme: white on light-scheme intents, near-black on dark-scheme ones. */
const intentContrastText: Record<ColorScheme, string> = { light: '#fff', dark: 'rgba(0, 0, 0, 0.87)' };

type RampName = 'navy' | 'slate';
const rampByName = { navy, slate } as const;
type Step = keyof typeof navy & keyof typeof slate;

/**
 * Primary, per scheme: `main`, `light`, the hover step (`dark`) and, where it isn't MUI's,
 * the contrast text. Light is Enertiv navy. Dark is a light neutral (slate) with navy
 * text, so on the navy dark surfaces primary stands apart from the blue secondary and
 * from info instead of becoming another pale blue.
 */
export const primarySteps: Record<
  ColorScheme,
  { ramp: RampName; main: Step; light: Step; dark: Step; contrastText?: { ramp: RampName; step: Step } }
> = {
  light: { ramp: 'navy', main: 900, light: 700, dark: 950 },
  dark: { ramp: 'slate', main: 700, light: 100, dark: 800, contrastText: { ramp: 'navy', step: 950 } },
};

/**
 * Secondary, per scheme, on the brand ramp. The brand blue itself (500) is too light to
 * pass as text or under white text, so light uses 700 for `main`, with 500 as `light`;
 * dark uses 300.
 */
export const secondarySteps: Record<ColorScheme, { main: keyof typeof brand; light: keyof typeof brand; dark: keyof typeof brand }> = {
  light: { main: 700, light: 500, dark: 800 },
  dark: { main: 300, light: 200, dark: 400 },
};

/**
 * Chart colors, per scheme (Rules → Charts), from five ramps only: brand, aquaverde, parchment,
 * navy and violet. Red, yellow and green are signals (error, warning, success) and reach a chart
 * only through the intents. `series` is six colors in a fixed order: the first three are one step
 * each of brand, aquaverde and parchment, the fourth is navy (light) or a pale brand (dark), the
 * fifth a second step of aquaverde, and the sixth violet, the one hue with real chroma beside
 * brand, so a chart that reaches six series gets the most separation where it needs it most. Each
 * reaches 3:1 on every surface level, and every pair stays apart under normal vision and simulated
 * protanopia, deuteranopia and tritanopia (departures.test.ts); with two low-chroma neutrals, that
 * means the same step of aquaverde and parchment never sit together, and lightness does much of the
 * work. `neutral` is a mid step of the neutral ramp not in the series (aquaverde in light,
 * parchment in dark), at 3:1 and apart from the six.
 * `sequential` is the brand ramp, from the step nearest the surface to the one furthest from it,
 * so it runs light to dark in light and dark to light in dark.
 * `seriesDark` is a darker shade of each series slot, for the negative part of a two-part bar whose
 * positive part takes the slot: further from the card in light and nearer it in dark, at 3:1 on the
 * card and 1.5:1 from its slot, and not a step the scheme already uses for `neutral` or another slot.
 * A slot with no step that meets all three is `undefined`, and the slot's own color stands in.
 * `diverging` is a comparison where neither side is worse: one end color a side, brand below and
 * parchment above, with `contrastText` for text where `text.primary` no longer passes over an end.
 */
const chartRamps = { brand, aquaverde, parchment, navy, violet } as const;
type ChartRamp = keyof typeof chartRamps;
type ChartStep = { ramp: ChartRamp; step: string };

export const chartSteps: Record<
  ColorScheme,
  {
    series: ChartStep[];
    seriesDark: (ChartStep | undefined)[];
    neutral: ChartStep;
    sequential: ChartStep[];
    diverging: { below: ChartStep; above: ChartStep; contrastText: { ramp: RampName; step: Step } };
  }
> = {
  light: {
    series: [
      { ramp: 'brand', step: '600' },
      { ramp: 'aquaverde', step: '950' },
      { ramp: 'parchment', step: '600' },
      { ramp: 'navy', step: '200' },
      { ramp: 'aquaverde', step: '500' },
      { ramp: 'violet', step: '500' },
    ],
    // Aquaverde 950, slot 1, ends its ramp; aquaverde 700 is `neutral`, so slot 4 takes 800; violet 700 is too near slot 5.
    seriesDark: [
      { ramp: 'brand', step: '800' },
      undefined,
      { ramp: 'parchment', step: '800' },
      { ramp: 'navy', step: '800' },
      { ramp: 'aquaverde', step: '800' },
      { ramp: 'violet', step: '900' },
    ],
    neutral: { ramp: 'aquaverde', step: '700' },
    sequential: ['100', '300', '500', '700', '900'].map((step) => ({ ramp: 'brand', step })),
    diverging: { below: { ramp: 'brand', step: '800' }, above: { ramp: 'parchment', step: '800' }, contrastText: { ramp: 'slate', step: 50 } },
  },
  dark: {
    series: [
      { ramp: 'brand', step: '400' },
      { ramp: 'aquaverde', step: '200' },
      { ramp: 'parchment', step: '500' },
      { ramp: 'brand', step: '50' },
      { ramp: 'aquaverde', step: '400' },
      { ramp: 'violet', step: '300' },
    ],
    // Aquaverde 400 is slot 4, so slot 1 takes 500. Parchment 600 falls under 3:1 on the card; aquaverde 500 and violet 400 sit too near their slots.
    seriesDark: [
      { ramp: 'brand', step: '600' },
      { ramp: 'aquaverde', step: '500' },
      undefined,
      { ramp: 'brand', step: '300' },
      undefined,
      undefined,
    ],
    neutral: { ramp: 'parchment', step: '300' },
    sequential: ['900', '700', '500', '300', '100'].map((step) => ({ ramp: 'brand', step })),
    diverging: { below: { ramp: 'brand', step: '200' }, above: { ramp: 'parchment', step: '200' }, contrastText: { ramp: 'navy', step: 950 } },
  },
};

/**
 * The basemap's own colors, per scheme (Rules → Maps), each a step of the surface ramp with no hue
 * of its own. `land` is a step past the page (slate 400 in light, where the page is 300; navy 950,
 * the page's own step, in dark, where cards are 700), so the map reads as a recessed plane in its
 * card; `water` a step past the land; `road` and `boundary`, for the road casings and boundaries
 * CARTO draws when zoomed out, reach past the water so a zoomed-out map shows structure, not labels
 * alone. Light water stops at slate 500: past it, map labels (text.secondary) drop below 4.5:1 on
 * water (src/maps/departures.test.ts).
 */
export const mapSteps: Record<ColorScheme, { land: string; water: string; road: string; boundary: string }> = {
  light: { land: slate[400], water: slate[500], road: slate[800], boundary: slate[800] },
  dark: { land: navy[950], water: navy[600], road: navy[500], boundary: navy[300] },
};

/**
 * Keyboard focus, per scheme (`focus-ring`): the brightest brand step that still reaches 3:1 as a
 * ring and 4.5:1 as a focused label on every surface. Light takes the secondary's main step (brand
 * 500, the brand blue itself, is about 2.4:1 on the page); dark takes its lighter step.
 */
export const focusSteps: Record<ColorScheme, keyof typeof brand> = { light: 700, dark: 200 };

/**
 * Text, per scheme: primary, secondary and tertiary. Neutral icons take the secondary (`icon-color`).
 * Dark secondary and both tertiaries come from MUI's blue grey, whose hue sits with navy's: slate
 * jumps from a near-white 800 to a mid grey 900, with no step between. Dark secondary is the darkest
 * blue grey that keeps 4.5:1 on a hovered selected row (`dark-selected-tint`). Tertiary is below
 * 4.5:1 by design decision (about 3:1 at its faintest).
 */
export const textSteps: Record<ColorScheme, { primary: string; secondary: string; tertiary: string }> = {
  light: { primary: navy[950], secondary: slate[900], tertiary: blueGrey[400] },
  dark: { primary: slate[100], secondary: blueGrey[200], tertiary: blueGrey[500] },
};

const chartColor = ({ ramp, step }: ChartStep) => (chartRamps[ramp] as Record<string, string>)[step];

/** The palette's chart roles for one scheme, from `chartSteps`. */
function chartPalette(scheme: ColorScheme) {
  const { series, seriesDark, neutral, sequential, diverging } = chartSteps[scheme];
  return {
    series: series.map(chartColor),
    seriesDark: seriesDark.map((step) => (step ? chartColor(step) : undefined)),
    neutral: chartColor(neutral),
    sequential: sequential.map(chartColor),
    diverging: {
      below: chartColor(diverging.below),
      above: chartColor(diverging.above),
      contrastText: rampByName[diverging.contrastText.ramp][diverging.contrastText.step],
    },
  };
}

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
    id: 'shape-radius',
    area: 'Theme',
    title: 'Corner radius',
    why: "One corner radius of 8px instead of MUI's 4px, for a softer look at Kilowatt's density. It's MUI's single `shape.borderRadius`, so every component that rounds with the theme (buttons, inputs, cards, menus, dialogs, tooltips, toggle buttons) follows it, cards at twice it (`card-radius`), and `sx` multiples scale from it: `borderRadius: 1` is 8px, `2` is 16px.",
    options: () => ({ shape: { borderRadius: 8 } }),
  },
  {
    id: 'surfaces-and-borders',
    area: 'Palette',
    title: 'Surface and border levels',
    why: "Six surfaces and four borders by contrast, from the slate (light) and navy (dark) ramps, in place of MUI's white or #121212 surfaces and single divider, so each raised surface steps lighter in both schemes and a separator can be as faint or as strong as its job needs. level0 is the background and rail, level1 the docked panels, a step darker than the frame they sit in, and level2 the frame and page. The top levels share a step: light runs out of steps above white, so cards, menus and dialogs are all white and stand apart by their shadows, and dark's top two stop at navy 600 because a lighter step (navy 500) would drop the secondary color and border level3 below their contrast. `background.default` is level0 and `background.paper` level2, so MUI's components pick them up; `divider` is border level1.",
    options: (scheme) => {
      const surfaces = levels(scheme, surfaceSteps[scheme]);
      const border = levels(scheme, borderSteps[scheme]);
      return { palette: { background: { ...surfaces, default: surfaces.level0, paper: surfaces.level2 }, border, divider: border.level1 } };
    },
  },
  {
    id: 'intents-on-surfaces',
    area: 'Palette',
    title: 'Intent colors that pass on every surface',
    why: "MUI's intents are tuned for a white or #121212 background, and several fall below 4.5:1 as text on the surface levels. Error and info take a nearby step from MUI's own color ramps that passes on every level in its scheme; the intents that already pass stay as MUI ships them. Warning and success use Kilowatt's own ramps: orange 700 in light (clearly apart from error's red) and yellow 400 in dark for warning, and Enertiv's jade green for success, 700 in light and 300 in dark. Success's `dark` is a deeper step of the same ramp, green 900 in light and 600 in dark, in place of the shade MUI derives from `main`, which sits one small step below it: a two-part bar draws its negative part in it (`SegmentedBar`'s `shade: 'dark'`), so the pair reads as one hue with the positive part standing out. Dark stops at 600, since 700 falls under 3:1 on the card. MUI also hovers a contained success button in it.",
    options: (scheme) => ({
      palette: Object.fromEntries(
        Object.entries(intentSteps[scheme]).map(([intent, { main, dark }]) => [
          intent,
          { main, ...(dark && { dark: dark.value }), contrastText: intentContrastText[scheme] },
        ]),
      ),
    }),
  },
  {
    id: 'text-colors',
    area: 'Palette',
    title: 'Navy and slate text',
    why: "MUI sets text in black or white at fixed opacities (87% and 60% in light, 100% and 70% in dark). Kilowatt uses solid navy 950 and slate 900 in light, slate 100 and MUI's blue grey 200 in dark, so text takes the palette's hue and reads the same on every surface instead of blending into it. Light secondary text is slate, a grey-navy, because the navy ramp has no desaturated mid tone; dark secondary is blue grey, because slate has no mid tone between its near-white 800 and its grey 900, and 800 sat too close to primary to read as secondary. Blue grey 200 is the darkest step that still passes 4.5:1 on a hovered selected row, with the dark selected tint at 10% (`dark-selected-tint`). Kilowatt adds a third role, `text.tertiary` (blue grey 400 in light, 500 in dark), for the quietest text: metadata, timestamps, units and placeholder-like hints. It is below 4.5:1 by design decision (about 3:1 at its faintest), so it never carries text a reader needs; that goes in `text.secondary`.",
    options: (scheme) => ({ palette: { text: textSteps[scheme] } }),
  },
  {
    id: 'primary-navy',
    area: 'Palette',
    title: 'Navy primary, light neutral in dark',
    why: "Primary is Enertiv navy instead of MUI's blue in the light scheme (navy 900), so the main actions carry Enertiv's brand color. In the dark scheme it's a light neutral (slate 700) with navy text: the dark surfaces are navy, so a blue primary there would be another pale blue beside the brand-blue secondary and the info color. Like the other intents, it passes 4.5:1 as text on every surface level, and its contrast text passes on it. Every component that uses `primary` (buttons, links, focus rings, checkboxes, tabs, progress) follows it.",
    options: (scheme) => {
      const { ramp, main, light, dark, contrastText } = primarySteps[scheme];
      const r = rampByName[ramp];
      return {
        palette: {
          primary: {
            main: r[main],
            light: r[light],
            dark: r[dark],
            contrastText: contrastText ? rampByName[contrastText.ramp][contrastText.step] : intentContrastText[scheme],
          },
        },
      };
    },
  },
  {
    id: 'type-scale',
    area: 'Typography',
    title: 'A compact heading scale',
    why: "MUI's headings are sized for marketing pages (`h1` 96px down to `h6` 20px), which is too large for a dense product UI. Kilowatt's step down from 32px to 16px, one step apart, so `h6` meets body size. Only `h1` to `h6` change: body, caption, button and input text keep MUI's sizes, so reading sizes don't shrink. Line heights stay MUI's, and headings are regular weight (`regular-weight`). MUI's letter spacing was tuned for its own sizes (a tight -0.016em on a 96px `h1`, a loose +0.007em on a 34px `h4`), so Kilowatt resets it: `h1` and `h2`, the two largest, tighten slightly (-0.01em), and `h3` to `h6` take none, as body sizes need none. Card titles are `h6` (`card-header-title`).",
    options: () => ({
      typography: {
        h1: { fontSize: '2rem', letterSpacing: '-0.01em' },
        h2: { fontSize: '1.75rem', letterSpacing: '-0.01em' },
        h3: { fontSize: '1.5rem' },
        h4: { fontSize: '1.25rem', letterSpacing: 0 },
        h5: { fontSize: '1.125rem' },
        h6: { fontSize: '1rem', letterSpacing: 0 },
      },
    }),
  },
  {
    id: 'card-header-title',
    area: 'Components',
    components: ['CardHeader'],
    title: 'Card titles in h6',
    why: "MUI sets a `CardHeader` title in `h5`, which on the compact heading scale is 18px and reads loud beside the cards' figures and charts. Kilowatt sets every card title in `h6` (16px), one step down, as a default so every card follows without a size of its own; a card that leads a page (Card → Highlight) sets its title a step above, in `h5`. Asked for in review, so a page of cards reads by its content rather than its titles.",
    options: () => ({ components: { MuiCardHeader: { defaultProps: { slotProps: { title: { variant: 'h6' } } } } } }),
  },
  {
    id: 'card-header-subheader',
    area: 'Components',
    components: ['CardHeader'],
    title: 'Card subtitles in body2',
    why: "MUI sets a `CardHeader` subtitle in `body1` (16px), and in `body2` (14px) only when the header has an avatar. Card titles are 16px (`card-header-title`), so a 16px subtitle would sit level with its title. Kilowatt sets every subtitle in `body2`, the size MUI already uses beside an avatar, so the title leads. The subtitle keeps MUI's `text.secondary` color and still renders as a `span`.",
    options: () => ({ components: { MuiCardHeader: { defaultProps: { slotProps: { subheader: { variant: 'body2' } } } } } }),
  },
  {
    id: 'card-header-layout',
    area: 'Components',
    components: ['CardHeader'],
    title: 'Card headers: aligned actions and one-line titles',
    why: "MUI pulls a `CardHeader` action out by 4px at the top and bottom and 8px at the right, tuned to its 24px title on a 32px line, and centers the header's contents, so a title moves with the height of whatever sits beside it. Kilowatt pulls the action out by 8px on all three sides, so the icon inside an icon button (on a 24px line) sits level with a one-line title (`h6`, on a 25.6px line, within 1px), 16px from the card's right edge in line with the content below, and the button never makes the header taller than its title. Contents align to the top, so a title sits 16px from the top and left of every card, with or without a subtitle. Titles and subtitles stay on one line and truncate, so cards in a grid keep one header height; wrap them in `TruncatedText` to show the full text in a tooltip.",
    options: () => ({
      components: {
        MuiCardHeader: {
          defaultProps: { slotProps: { title: { noWrap: true }, subheader: { noWrap: true } } },
          styleOverrides: {
            root: { alignItems: 'flex-start' },
            content: { minWidth: 0 },
            action: { margin: 'calc(-1 * var(--mui-spacing)) calc(-1 * var(--mui-spacing)) calc(-1 * var(--mui-spacing)) 0' },
          },
        },
      },
    }),
  },
  {
    id: 'card-content-padding',
    area: 'Components',
    components: ['CardContent'],
    title: 'Card content is 16px on every side',
    why: "MUI gives the last `CardContent` 24px of bottom padding against 16px everywhere else. Kilowatt keeps 16px on every side, so a card's sections sit on one inset. The `Card` itself stays unpadded, as in MUI: each section sets its own padding, and a list, table or chart runs edge to edge by leaving `CardContent` out.",
    options: () => ({
      components: { MuiCardContent: { styleOverrides: { root: { '&:last-child': { paddingBottom: 'calc(2 * var(--mui-spacing))' } } } } },
    }),
  },
  {
    id: 'card-radius',
    area: 'Components',
    components: ['Card'],
    title: 'Cards round at twice the theme radius',
    why: "A card's header action and its `CardActions` buttons sit 8px from its corners, and a button keeps the theme radius, so the card's corner is the button's radius plus that gap (Rules → Concentric corners): two theme radii, 16px, instead of MUI's one. It follows `shape-radius`, so changing the theme radius moves cards with it.",
    options: () => ({ components: { MuiCard: { styleOverrides: { root: { borderRadius: 'calc(2 * var(--mui-shape-borderRadius))' } } } } }),
  },
  {
    id: 'table-cell-border',
    area: 'Components',
    components: ['Table'],
    title: 'Table rows divide with `divider`',
    why: "MUI derives a table's row lines from `divider` by mixing it toward white in light and black in dark. On Kilowatt's surfaces that nearly disappears in light (1.02:1 on a card) and turns darker than the surface in dark, where every other border is lighter. Kilowatt uses `divider` itself, so a table's rows match the card frame around them (Rules → One border per edge).",
    options: () => ({ components: { MuiTableCell: { styleOverrides: { root: { borderBottomColor: 'var(--mui-palette-divider)' } } } } }),
  },
  {
    id: 'table-head-weight',
    area: 'Components',
    components: ['Table'],
    title: 'Table header cells at semibold',
    why: "MUI sets header cells at medium (500). Kilowatt sets them at semibold (600, `fontWeightSemibold`), the weight of the subheading that usually names the table, so a card doesn't set three weights in a few lines (a regular title, a semibold subheading, a medium header) that differ by a step too small to read as intended.",
    options: () => ({ components: { MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } } } }),
  },
  {
    id: 'table-sticky-header',
    area: 'Components',
    components: ['Table'],
    title: 'Sticky table headers sit on the card surface',
    why: "MUI paints a sticky header in `background.default`, the page color, which suits a table sitting on the page. Kilowatt's tables sit in cards, on `background.level3`, so the stock header reads as a band of page color across the card. Kilowatt paints it `background.level3`; rows still pass behind it unseen. A sticky table on any other surface, such as a dialog, sets the header cells' background to that surface.",
    options: () => ({ components: { MuiTableCell: { styleOverrides: { stickyHeader: { backgroundColor: 'var(--mui-palette-background-level3)' } } } } }),
  },
  {
    id: 'table-last-row',
    area: 'Components',
    components: ['Table'],
    title: "A table's last row has no bottom line",
    why: "MUI draws a line under every row, so a table's last row lands a line on the edge of the card around it, a double border, and MUI's own demo removes it instance by instance. Kilowatt removes it in the theme, so no table needs that override (Rules → One border per edge). With a `TableFooter`, the last body row keeps its line, which sets the totals apart, and the footer's last row loses it.",
    options: () => ({
      components: {
        MuiTable: {
          styleOverrides: { root: { '& > :last-child > tr:last-child > td, & > :last-child > tr:last-child > th': { borderBottom: 0 } } },
        },
      },
    }),
  },
  {
    id: 'regular-weight',
    area: 'Typography',
    title: 'Headings and body at regular weight',
    why: "MUI sets `h1` and `h2` light (300) and `h6` medium (500), so weight shifts between neighbouring headings. Kilowatt sets the headings and body styles at regular (400, `fontWeightRegular`): size and color carry the hierarchy, and a headline number reads at the same weight as the text around it. `button` is regular through `button-text-weight`; the subheadings are semibold (`semibold-weight`). The weight tokens (`fontWeightLight` to `fontWeightBold`) keep MUI's values, for the components that use them directly and for `strong`.",
    options: () => ({
      typography: {
        h1: { fontWeight: 400 },
        h2: { fontWeight: 400 },
        h6: { fontWeight: 400 },
      },
    }),
  },
  {
    id: 'dark-selected-tint',
    area: 'Palette',
    title: 'A lighter selected tint in the dark scheme',
    why: "MUI tints a selected row, menu item or list item with the primary color at 16% (`action.selectedOpacity`), and at 24% when it's hovered. Dark primary is a light neutral, so at those strengths the tint lifts the navy surface enough to pull secondary text (blue grey 200, `text-colors`) below 4.5:1. Kilowatt tints at 10% in the dark scheme (18% hovered), which keeps secondary text at 4.5:1 or more on every surface while a selected row still reads as selected. The light scheme keeps MUI's 16%, since its secondary text is dark on a light tint.",
    options: (scheme) => (scheme === 'dark' ? { palette: { action: { selectedOpacity: 0.1 } } } : {}),
  },
  {
    id: 'semibold-weight',
    area: 'Typography',
    title: 'A semibold weight for subheadings and data',
    why: "MUI's weights are light (300), regular (400), medium (500) and bold (700), and it sets `subtitle1` regular and `subtitle2` medium. Kilowatt adds `fontWeightSemibold` (600) for small text that has to stand out without growing: the subheadings, `subtitle1` and `subtitle2`, which label a section inside a card or drawer and sit at body size or smaller, and data a reader looks for first (a total, a key reading), through `sx={{ fontWeight: 'fontWeightSemibold' }}`. Headings stay regular (`regular-weight`), so weight marks the small labels, not the large ones. Table header cells are semibold too (`table-head-weight`); MUI's other components that use medium (alert titles, tooltips) keep it.",
    options: () => ({
      typography: {
        fontWeightSemibold: 600,
        subtitle1: { fontWeight: 600 },
        subtitle2: { fontWeight: 600 },
      },
    }),
  },
  {
    id: 'button-text-case',
    area: 'Typography',
    components: ['Button', 'ToggleButton', 'Tab', 'Fab', 'BottomNavigationAction'],
    title: 'Button labels in Title Case',
    why: "MUI uppercases every label set in the `button` type style. Kilowatt shows labels as written, and writes them in Title Case. CSS can't do Title Case (`capitalize` also capitalizes minor words such as \"and\"), so it's a writing convention: what's in the code is what people and screen readers get, and it carries through translation. Rules → Content and layout carries the same case to every name, not only buttons.",
    options: () => ({ typography: { button: { textTransform: 'none' } } }),
    convention: {
      muiDefault: 'Labels uppercased by `typography.button.textTransform`',
      kilowatt: 'Labels shown as written, written in Title Case: "Dispatch Ticket", "Export CSV", "Save and Close"',
      where: 'Every label of a Button, ToggleButton, Tab, Fab or BottomNavigationAction',
    },
  },
  {
    id: 'button-text-weight',
    area: 'Typography',
    components: ['Button', 'ToggleButton', 'Tab', 'Fab', 'BottomNavigationAction'],
    title: 'Button labels at regular weight',
    why: "MUI sets the `button` type style at medium weight (500). Kilowatt sets it at regular (400, `fontWeightRegular`), so labels sit at the same weight as body text and a button's emphasis comes from its variant and color, not its type. Every component set in the `button` style follows.",
    options: () => ({ typography: { button: { fontWeight: 400 } } }),
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
    id: 'link-underline',
    area: 'Components',
    components: ['Link'],
    title: 'Links without underlines',
    why: "MUI underlines every `Link` (`underline=\"always\"`), which in product UI marks a name in a table, a card title or a source as a web link and clutters dense text. Kilowatt sets `underline=\"none\"` by default, so a link is told apart by its color (`primary`, MUI's default) and its wording, and the one underline on a page stays the SourceFigure's, which marks a number that opens its explanation. Links in running text are rare; an action is a Button.",
    options: () => ({ components: { MuiLink: { defaultProps: { underline: 'none' } } } }),
  },
  {
    id: 'control-outlines',
    area: 'Components',
    components: ['Button', 'ButtonGroup', 'ToggleButton', 'TextField', 'Select', 'Autocomplete', 'OutlinedInput'],
    title: 'One outline color for every control',
    why: "MUI outlines its controls in three different colors: inputs at 23% black (or white), outlined buttons in their intent color at half strength, toggle buttons in the divider color. Kilowatt gives them one outline per state from their own palette role, `palette.control`, kept apart from the surface border levels so either can change without moving the other. The outline is quiet at rest (slate 600 in light, navy 400 in dark; below 3:1, by design decision), a stronger one on hover (slate 800 in light, navy 200 in dark), the brand blue on keyboard focus (`focus-ring`) and navy 400 or slate 800 when pressed. Inputs show focus with a 2px outline in the same blue. Error and disabled keep MUI's. Outlined buttons in the other intents (secondary, error, warning, info, success) keep MUI's intent-colored outline on purpose: the color carries their meaning.",
    options: (scheme) => ({
      palette: {
        control:
          scheme === 'dark'
            ? { border: navy[400], hover: navy[200], focus: brand[focusSteps.dark], pressed: slate[800] }
            : { border: slate[600], hover: slate[800], focus: brand[focusSteps.light], pressed: navy[400] },
      },
      components: {
        MuiOutlinedInput: {
          styleOverrides: {
            notchedOutline: { borderColor: 'var(--mui-palette-control-border)' },
            root: {
              '@media (hover: hover)': {
                '&:hover:not(.Mui-focused):not(.Mui-error):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--mui-palette-control-hover)',
                },
              },
              // On touch screens MUI resets a hovered outline to its 23% default; keep the control border instead.
              '@media (hover: none)': {
                '&:hover:not(.Mui-focused):not(.Mui-error):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--mui-palette-control-border)',
                },
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              // MUI draws the outline from --variant-outlinedBorder. Primary only: the other intents keep MUI's.
              // Disabled sets its own border.
              '&.MuiButton-outlined.MuiButton-colorPrimary': {
                '--variant-outlinedBorder': 'var(--mui-palette-control-border)',
                '@media (hover: hover)': {
                  '&:hover': { '--variant-outlinedBorder': 'var(--mui-palette-control-hover)' },
                },
                '&.Mui-focusVisible': { '--variant-outlinedBorder': 'var(--mui-palette-control-focus)' },
                '&:active': { '--variant-outlinedBorder': 'var(--mui-palette-control-pressed)' },
              },
            },
          },
        },
        MuiToggleButton: { styleOverrides: { root: { borderColor: 'var(--mui-palette-control-border)' } } },
      },
    }),
  },
  {
    id: 'focus-ring',
    area: 'Components',
    components: ['ButtonBase', 'Button', 'IconButton', 'ToggleButton', 'Chip', 'Tab', 'ListItemButton', 'MenuItem', 'CardActionArea', 'TextField', 'OutlinedInput', 'InputLabel'],
    title: 'Keyboard focus in the brand blue',
    why: "MUI shows keyboard focus on a ButtonBase (buttons, icon buttons, chips, tabs, list rows, card action areas) only as a background tint, which is easy to miss beside a hover, and on inputs as a primary-colored outline, which in light is the navy of the text around it. Kilowatt shows focus everywhere in one color, `palette.control.focus`, the brightest brand blue that passes on every surface (brand 700 in light, brand 200 in dark): a 2px ring, 2px outside every focused ButtonBase, and the focused input's 2px outline and label.",
    options: () => ({
      components: {
        MuiButtonBase: {
          styleOverrides: { root: { '&.Mui-focusVisible': { outline: '2px solid var(--mui-palette-control-focus)', outlineOffset: 2 } } },
        },
        MuiOutlinedInput: {
          styleOverrides: { root: { '&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--mui-palette-control-focus)' } } },
        },
        MuiInputLabel: { styleOverrides: { root: { '&.Mui-focused:not(.Mui-error)': { color: 'var(--mui-palette-control-focus)' } } } },
      },
    }),
  },
  {
    id: 'icon-color',
    area: 'Palette',
    title: 'Icons in the secondary text color',
    why: "MUI draws neutral icons (icon buttons, list item icons, unchecked checkboxes and radios, sort arrows) in `action.active`: black at 54% in light, white in dark, neither a text color. Kilowatt sets `action.active` to the secondary text color in both schemes, so an icon reads as the text beside it does.",
    options: (scheme) => ({ palette: { action: { active: textSteps[scheme].secondary } } }),
  },
  {
    id: 'icon-button-radius',
    area: 'Components',
    components: ['IconButton'],
    title: 'Icon buttons take the theme radius',
    why: "MUI makes icon buttons circles (`border-radius: 50%`), the one button shape that ignores the theme radius. Kilowatt rounds them with `shape.borderRadius` like every other button, so hover, focus and pressed shapes match the buttons beside them.",
    options: () => ({ components: { MuiIconButton: { styleOverrides: { root: { borderRadius: 'var(--mui-shape-borderRadius)' } } } } }),
  },
  {
    id: 'medium-size',
    area: 'Components',
    components: [
      'Autocomplete', 'Button', 'ButtonGroup', 'Checkbox', 'Chip', 'Fab', 'FormControl', 'IconButton', 'Pagination',
      'Radio', 'Rating', 'Select', 'Slider', 'Switch', 'Table', 'TextField', 'ToggleButton', 'ToggleButtonGroup',
    ],
    title: 'Medium size by default',
    why: "MUI offers `small`, `medium` and sometimes `large` and leaves the choice to each screen, so sizes drift from page to page. Kilowatt uses `medium` wherever a component has a `size` prop, and keeps `small` and `large` for one-off instances. Every MUI component already defaults to `medium` except Fab, which defaults to `large`; Fab defaults to `medium` here so the rule holds without passing `size` anywhere.",
    convention: {
      muiDefault: 'Components default to `medium` (Fab to `large`); MUI leaves the size to each screen',
      kilowatt: 'Leave `size` at `medium`, the default; set `small` or `large` only for a one-off instance',
      where: 'Every component with a `size` prop',
    },
    options: () => ({ components: { MuiFab: { defaultProps: { size: 'medium' } } } }),
  },
  {
    id: 'secondary-brand',
    area: 'Palette',
    title: 'Brand blue secondary',
    why: "Secondary is Enertiv's brand blue instead of MUI's purple, on a brand ramp built around #2EA6E1 (step 500). The brand blue itself passes only 2.3:1 as text and 2.7:1 under white text, so secondary uses the brand step that passes in each scheme: 700 in light (with 500, the exact brand blue, as `light`) and 300 in dark. Like the other intents, it passes 4.5:1 as text on every surface, and its contrast text passes on it.",
    options: (scheme) => {
      const { main, light, dark } = secondarySteps[scheme];
      return { palette: { secondary: { main: brand[main], light: brand[light], dark: brand[dark], contrastText: intentContrastText[scheme] } } };
    },
  },
  {
    id: 'chart-palette',
    area: 'Palette',
    title: 'Chart colors',
    why: "MUI's palette has no colors for data. Charts get three roles, all from five ramps (brand, aquaverde, parchment, navy and violet): `chart.series`, six colors in a fixed order for telling categories apart; `chart.neutral` for what isn't the focus; and `chart.sequential`, the brand ramp, for magnitude. Each series color reaches 3:1 on every surface and stays apart from the others under simulated color-vision deficiencies. Red, yellow and green are signals: status reuses the intents, a deviation's worse side takes `error` and its better side `chart.neutral`, and no series slot is red, yellow or green. Product meanings (a utility type) map to a series slot in product code, not to a palette color. Two more roles serve particular marks. `chart.seriesDark` is a darker shade of each slot, for the negative part of a two-part bar (leased and vacant), so the pair reads as one hue with the positive part standing out; each shade is at least 3:1 on the card and 1.5:1 from its slot, and a slot with no step that meets both is left out and falls back to its own color. And `chart.diverging`, for a comparison where neither side is worse (this month against a year earlier): one end color a side, `below` on brand (800 in light, 200 in dark) and `above` on parchment (800 in light, 200 in dark), two ramps with nothing in common, with `contrastText` (slate 50 in light, navy 950 in dark) for text where `text.primary` no longer passes over the end color.",
    options: (scheme) => ({ palette: { chart: chartPalette(scheme) } }),
  },
  {
    id: 'map-palette',
    area: 'Palette',
    title: 'Map colors',
    why: "MUI's palette has nothing for a basemap. A map's buildings, road fills and labels take the surface, border and text roles every component uses. Four roles are the map's own, each a step of the surface ramp with no hue that data could be confused with: `map.land`, a step past the page, so the map sits apart from every app surface; `map.water`, a step past the land; and `map.road` and `map.boundary`, for the road casings and boundaries CARTO draws at low zoom, which reach past the water so a zoomed-out map shows structure, not labels alone. Data on a map takes the chart roles.",
    options: (scheme) => ({ palette: { map: mapSteps[scheme] } }),
  },
  {
    id: 'paper-surface-levels',
    components: ['Paper', 'Card', 'Accordion', 'AppBar', 'Snackbar', 'Menu', 'Popover', 'Drawer', 'Dialog'],
    area: 'Components',
    title: 'Paper takes its surface from its elevation',
    why: "Paper's background steps up the surface levels with its elevation, in both schemes, in place of MUI's white light surfaces and its dark-scheme white overlay. Flat Paper and accordions sit on level2, app bars on level3, menus on level4, drawers and dialogs on level5. Cards, outlined or raised, sit on level3, a step above the level2 frame they're laid out on, so a card reads as a surface on the page rather than only its border. In the dark scheme the overlays (menus, popovers, drawers and dialogs) sit on level2 instead, with the `divider` as their edge: level4 and level5 read pale against the dark page, and level2 with the divider is the frame's own surface and edge, so an overlay matches the frame it opens over. Level2 rather than level3 because the dark divider is close to level3's step, so a bordered level3 overlay would show almost no edge. The light scheme keeps the elevation's level and MUI's shadows. A snackbar's text takes `text.primary`: MUI colors it for its own inverted surface, which would be white on white on these levels.",
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
        // Two classes, to outrank the elevation rules above, which a raised card also matches.
        MuiCard: { styleOverrides: { root: { '&.MuiPaper-root': { backgroundColor: 'var(--mui-palette-background-level3)' } } } },
        // Two classes, to outrank MUI's own rule.
        MuiSnackbarContent: { styleOverrides: { root: { '&.MuiPaper-root': { color: 'var(--mui-palette-text-primary)' } } } },
        // The dark scheme's selector, as `theme.applyStyles('dark')` writes it for the `class` selector, with the paper's
        // class three times to outrank the elevation rules (two classes) without `!important`.
        ...Object.fromEntries(
          darkOverlays.map((component) => [
            component,
            {
              styleOverrides: {
                paper: {
                  '*:where(.dark) &&&': {
                    backgroundColor: 'var(--mui-palette-background-level2)',
                    border: '1px solid var(--mui-palette-divider)',
                  },
                },
              },
            },
          ]),
        ),
      },
    }),
  },
  {
    id: 'soft-shadow',
    components: ['Paper'],
    area: 'Components',
    title: 'A soft shadow for raised composers',
    why: "MUI's shadows (`theme.shadows`, Paper's `elevation`) are tight and dark, tuned for surfaces stacking on the page; Kilowatt keeps them as its elevation scale. A composer that floats on the frame (a message box that stays above the content it writes into) needs a wider, fainter lift that doesn't read as a menu. Kilowatt adds one Paper variant, `variant=\"soft\"`: the level2 surface with a wide, low-strength shadow, stronger in the dark scheme so it still reads on navy. It's the only shadow outside `theme.shadows`; don't build other shadows in `sx`.",
    convention: {
      muiDefault: 'Paper takes `elevation` (a shadow from `theme.shadows`) or `variant="outlined"`',
      kilowatt: 'A raised composer is `<Paper variant="soft">`: level2 with the soft shadow. Everything else keeps `elevation`',
      where: 'Composers that float over the frame, above the content they write into',
    },
    options: () => {
      // The shadow's color is the palette's black at a strength per scheme, so no raw color enters the override.
      const shadow = (wide: number, near: number) =>
        `0 6px 20px -4px color-mix(in srgb, var(--mui-palette-common-black) ${wide}%, transparent), 0 1px 3px color-mix(in srgb, var(--mui-palette-common-black) ${near}%, transparent)`;
      return {
        components: {
          MuiPaper: {
            variants: [
              {
                props: { variant: 'soft' },
                style: { boxShadow: shadow(10, 5), '*:where(.dark) &': { boxShadow: shadow(45, 30) } },
              },
            ],
          },
        },
      };
    },
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
  {
    id: 'toggle-button-text',
    components: ['ToggleButton'],
    area: 'Components',
    title: 'Unselected toggle buttons use secondary text',
    why: "MUI colors an unselected toggle button's label with `action.active`, the icon color, which reaches only 4.4:1 as text on the page surface (level0). Kilowatt uses `text.secondary`, the text role for secondary labels, which passes 4.5:1 on every surface level in both schemes. Selected and disabled buttons keep MUI's colors.",
    options: () => ({
      components: { MuiToggleButton: { styleOverrides: { root: { color: 'var(--mui-palette-text-secondary)' } } } },
    }),
  },
  {
    id: 'tabular-numerals',
    components: ['Table', 'TablePagination', 'Badge', 'Chip', 'Slider', 'Pagination'],
    area: 'Typography',
    title: 'Tabular numerals where numbers line up or change',
    why: "MUI sets every digit proportionally, so columns of figures don't align and a value shifts sideways as it updates. Kilowatt shows readings, totals and counts everywhere, so the components that hold numbers (table cells, pagination, badges, chips, slider labels) use Roboto's tabular digits, each the same width. Running text keeps proportional digits, which sit better in a sentence.",
    convention: {
      muiDefault: 'Proportional digits everywhere',
      kilowatt: "Tabular digits in the components listed; on any other number that changes or lines up (a KPI, a meter reading, a timer, a column of figures in your own layout), set `sx={{ fontVariantNumeric: 'tabular-nums' }}`",
      where: 'Every number shown as data rather than as part of a sentence',
    },
    options: () => {
      const tabular = { fontVariantNumeric: 'tabular-nums' };
      return {
        components: {
          MuiTableCell: { styleOverrides: { root: tabular } },
          MuiTablePagination: { styleOverrides: { root: tabular } },
          MuiBadge: { styleOverrides: { badge: tabular } },
          MuiChip: { styleOverrides: { label: tabular } },
          MuiSlider: { styleOverrides: { valueLabel: tabular, markLabel: tabular } },
          MuiPaginationItem: { styleOverrides: { root: tabular } },
        },
      };
    },
  },
  {
    id: 'brand-type',
    area: 'Typography',
    title: 'A serif for branded moments',
    why: "MUI's type scale is one family. Kilowatt adds one variant to it, `brand`: Roboto Serif at regular (400, like every style, `regular-weight`), 40px with a line height of 1.2, and 32px below `sm`, where 40px would break a short heading over four lines. It's for branded moments only: a first login's and the upgrade pages' headings, and every report's title, which `PageHeader` sets in it at `h1`'s size (`titleVariant=\"brand\"`). A screen asks for `variant=\"brand\"` and sets the element with `component`; no component takes it by default. Everything else stays Roboto.",
    options: () => ({
      typography: {
        brand: { fontFamily: '"Roboto Serif", serif', fontWeight: 400, fontSize: '2rem', lineHeight: 1.2, '@media (min-width:600px)': { fontSize: '2.5rem' } },
      },
    }),
  },
  {
    id: 'text-wrap',
    area: 'Typography',
    title: 'Balanced headings, pretty body text',
    why: "MUI leaves wrapping to the browser's default, which can strand one word on a heading's last line. Kilowatt sets the heading styles (`h1` to `h6`) to `text-wrap: balance`, which evens out their lines, and the body styles to `text-wrap: pretty`, which avoids a lone word on a paragraph's last line. CssBaseline sets the page in `body1`, so everything inherits `pretty`; browsers without support wrap as before.",
    options: () => ({
      typography: {
        ...Object.fromEntries((['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((variant) => [variant, { textWrap: 'balance' }])),
        body1: { textWrap: 'pretty' },
        body2: { textWrap: 'pretty' },
      },
    }),
  },
  {
    id: 'font-synthesis',
    area: 'Typography',
    title: 'No synthesized bold or italic',
    why: "When a weight or style isn't loaded, browsers fake it by smearing or slanting the nearest one. Kilowatt loads Roboto at 400, 500, 600 and 700 and no italics (`fontWeightLight`, 300, is unused, so it isn't loaded), so CssBaseline sets `font-synthesis: none` on the page: text renders only in the cuts that exist, and emphasis comes from weight, not a faked slant.",
    options: () => ({ components: { MuiCssBaseline: { styleOverrides: { body: { fontSynthesis: 'none' } } } } }),
  },
  {
    id: 'reduced-motion',
    area: 'Theme',
    title: 'Respect reduced motion',
    why: "MUI's transitions and ripples play whatever the user's system setting says. When someone asks for reduced motion (`prefers-reduced-motion: reduce`), CssBaseline makes every CSS transition, MUI's included, finish at once, stops smooth scrolling, and lets the touch ripple appear without growing or pulsing. Progress indicators and skeletons keep animating, because the motion is how they show that something is loading.",
    options: () => ({
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            '@media (prefers-reduced-motion: reduce)': {
              '*, *::before, *::after': { transitionDuration: '0.01ms !important', scrollBehavior: 'auto !important' },
              '.MuiTouchRipple-ripple, .MuiTouchRipple-child': {
                animationDuration: '0.01ms !important',
                animationIterationCount: '1 !important',
              },
            },
          },
        },
      },
    }),
  },
];
