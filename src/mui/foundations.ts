import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import { brand, navy, orange, slate, yellow } from './colors';
import { borderSteps, departures, elevationSurfaces, intentSteps, primarySteps, secondarySteps, surfaceSteps, type ColorScheme } from './departures';
import { mergeOptions } from './theme';
import { diffThemes, stockTheme } from './themeDiff';

/**
 * The Foundations pages as Markdown tables, read from the running theme. Every
 * value carries its source: MUI's default, or the departure that sets it. The
 * pages are generated from this (scripts/build-docs.ts), so they can't drift
 * from the theme and the line between MUI and Kilowatt stays visible.
 *
 * The pages document values, so they read the theme without CSS-variable output:
 * with `cssVariables` on, MUI returns `theme.spacing(1)` as `var(--mui-spacing, 8px)`
 * rather than `8px`. Sources are worked out the same way, so a value MUI ships
 * unchanged reads as MUI's default even though the running theme serves it as a
 * CSS variable.
 */

/** The theme options for one scheme, without `cssVariables`: values, not their CSS-variable form. */
function valueOptions(scheme: ColorScheme, upTo = departures.length): ThemeOptions {
  return departures.slice(0, upTo).reduce<Record<string, unknown>>(
    (options, departure) => {
      if (!departure.options) return options;
      const values = { ...(departure.options(scheme) as Record<string, unknown>) };
      delete values.cssVariables;
      return mergeOptions(options, values);
    },
    { palette: { mode: scheme } },
  ) as ThemeOptions;
}

const themes: Record<ColorScheme, Theme> = { light: createTheme(valueOptions('light')), dark: createTheme(valueOptions('dark')) };

/** Theme path → the departure that changes its value, in either scheme: each departure is charged with what changes when it's added. */
const claims = new Map<string, string>();
for (const scheme of ['light', 'dark'] as const) {
  let before = stockTheme(scheme);
  departures.forEach((departure, index) => {
    const after = createTheme(valueOptions(scheme, index + 1));
    for (const change of diffThemes(before, after)) claims.set(change.path, departure.id);
    before = after;
  });
}

/** Where a theme value comes from: MUI's default, or a departure (by id). */
export function sourceOf(path: string): string {
  const id = claims.get(path);
  return id ? `Departure: \`${id}\`` : 'MUI default';
}

function read(theme: Theme, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], theme);
}

const code = (value: unknown) => `\`${String(value).replace(/\|/g, '\\|')}\``;

function table(head: string[], rows: string[][]) {
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((row) => `| ${row.join(' | ')} |`)].join('\n');
}

/** One row per theme path: the path, its light and dark values, and its source. */
function schemeRows(paths: string[]) {
  return paths.map((path) => {
    const light = read(themes.light, path);
    const dark = read(themes.dark, path);
    return [code(path), code(light), light === dark ? 'same' : code(dark), sourceOf(path)];
  });
}

const schemeHead = ['Theme path', 'Light', 'Dark', 'Source'];

const intents = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
const intentKeys = ['main', 'light', 'dark', 'contrastText'] as const;

export function colorMarkdown() {
  const greys = Object.keys(themes.light.palette.grey);
  return [
    '## Color schemes',
    'The theme carries MUI\'s light and dark palettes as color schemes. Components read the palette of the active scheme, so a component never picks a color per scheme itself. Switch the scheme with `useColorScheme().setMode`.',
    '## Intents',
    'Each intent has `main`, `light`, `dark` and `contrastText`. Pass the intent to a component (`color="primary"`, `severity="error"`) rather than a color.',
    "Every `main` passes 4.5:1 as text on all five surface levels in its scheme, and its `contrastText` passes 4.5:1 on it; a test enforces both. Primary is Enertiv navy in light and a light neutral with navy text in dark (the `primary-navy` departure); secondary is the brand blue (the `secondary-brand` departure), on the brand ramp, at the step that passes in each scheme. Warning uses Kilowatt's orange (light) and yellow (dark) ramps. For error, info and success, where MUI's default falls short on the surfaces, Kilowatt uses another step of the same MUI color ramp (`@mui/material/colors`). MUI derives `light` and `dark` from `main`:",
    table(
      ['Intent', 'Light', 'Dark'],
      intents.map((intent) => {
        const cell = (scheme: ColorScheme) => {
          if (intent === 'primary') {
            const { ramp, main } = primarySteps[scheme];
            return `${ramp} ${main} ${code((ramp === 'navy' ? navy : slate)[main])}`;
          }
          if (intent === 'secondary') return `brand ${secondarySteps[scheme].main} ${code(brand[secondarySteps[scheme].main])}`;
          const pick = intentSteps[scheme][intent];
          return pick ? `${pick.ramp} ${pick.step} ${code(pick.main)}` : "MUI's default";
        };
        return [code(intent), cell('light'), cell('dark')];
      }),
    ),
    ...intents.flatMap((intent) => [
      `### ${intent[0].toUpperCase()}${intent.slice(1)}`,
      table(schemeHead, schemeRows(intentKeys.map((key) => `palette.${intent}.${key}`))),
    ]),
    '## Text',
    table(schemeHead, schemeRows(['primary', 'secondary', 'disabled'].map((key) => `palette.text.${key}`))),
    '## Surfaces',
    "Five surfaces by elevation. level0 is the page and the darkest; each level above it is lighter, in both schemes. `background.default` is level0 and `background.paper` is level1, so MUI's components use them without being told. Paper picks its level from its elevation (see Elevation); elsewhere, set one with `sx={{ bgcolor: 'background.level2' }}`.",
    table(
      ['Level', 'Theme path', 'Light', 'Dark', 'Used by', 'Source'],
      (Object.keys(surfaceSteps.light) as (keyof typeof surfaceSteps.light)[]).map((level) => [
        code(level),
        code(`palette.background.${level}`),
        `${code(slate[surfaceSteps.light[level]])} slate ${surfaceSteps.light[level]}`,
        `${code(navy[surfaceSteps.dark[level]])} navy ${surfaceSteps.dark[level]}`,
        level === 'level0' ? 'The page (`background.default`)' : (elevationSurfaces.find((entry) => entry.level === level)?.uses ?? ''),
        sourceOf(`palette.background.${level}`),
      ]),
    ),
    '## Borders',
    "Four borders by contrast against the surfaces, in both schemes, so level0 to level2 look the same weight in light and dark. level0 to level2 separate and frame: level0 is the faintest, and `divider` is level1, so MUI's Divider uses it. level3 is the strongest, for a frame or separator that must stand out: it reaches 3:1 on every dark surface; the light scheme's slate 950 sits below 3:1 for now, by design decision. Control outlines are a separate role, `palette.control` (`control-outlines`), and don't use these levels. Set one with `sx={{ borderColor: 'border.level2' }}`.",
    table(
      ['Level', 'Theme path', 'Light', 'Dark', 'Source'],
      (Object.keys(borderSteps.light) as (keyof typeof borderSteps.light)[]).map((level) => [
        code(level),
        code(`palette.border.${level}`),
        `${code(slate[borderSteps.light[level]])} slate ${borderSteps.light[level]}`,
        `${code(navy[borderSteps.dark[level]])} navy ${borderSteps.dark[level]}`,
        sourceOf(`palette.border.${level}`),
      ]),
    ),
    table(schemeHead, schemeRows(['palette.divider'])),
    '## Ramps',
    "The primitives the surface and border levels are read from, in MUI's color-object shape (`src/mui/colors.ts`). Components never use a ramp step directly; they use a level.",
    table(
      ['Step', 'Slate (light surfaces)', 'Navy (dark surfaces, primary)', 'Brand (secondary)', 'Orange (light warning)', 'Yellow (dark warning)'],
      [...new Set([slate, navy, brand, orange, yellow].flatMap((ramp) => Object.keys(ramp)).map(Number))]
        .sort((a, b) => a - b)
        .map((step) => [
          code(step),
          ...[slate, navy, brand, orange, yellow].map((ramp) => (step in ramp ? code((ramp as Record<number, string>)[step]) : '—')),
        ]),
    ),
    '## Action',
    'The overlays MUI lays over components for hover, selected, focus and disabled states.',
    table(
      schemeHead,
      schemeRows(['active', 'hover', 'selected', 'focus', 'disabled', 'disabledBackground'].map((key) => `palette.action.${key}`)),
    ),
    '## Common and grey',
    table(schemeHead, schemeRows([...['black', 'white'].map((key) => `palette.common.${key}`), ...greys.map((key) => `palette.grey.${key}`)])),
  ].join('\n\n');
}

const variants = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'button', 'caption', 'overline'] as const;

/** The element `Typography` renders for each variant by default (its `variantMapping` prop). */
const variantElements: Record<(typeof variants)[number], string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  button: 'span',
  caption: 'span',
  overline: 'span',
};

export function typographyMarkdown() {
  const type = themes.light.typography;
  const px = (rem: string | number | undefined) =>
    typeof rem === 'string' && rem.endsWith('rem') ? `${Number.parseFloat(rem) * type.htmlFontSize}px` : String(rem);
  return [
    '## Font',
    table(
      ['Theme path', 'Value', 'Source'],
      ['fontFamily', 'fontSize', 'htmlFontSize', 'fontWeightLight', 'fontWeightRegular', 'fontWeightMedium', 'fontWeightBold'].map((key) => [
        code(`typography.${key}`),
        code(read(themes.light, `typography.${key}`)),
        sourceOf(`typography.${key}`),
      ]),
    ),
    'Roboto loads from Google Fonts at 300, 400, 500 and 700, as MUI\'s installation guide does.',
    '## Variants',
    'Set text with `<Typography variant="…">`. Choose the variant for its look and `component` for the element when they differ, e.g. `<Typography variant="h6" component="h2">`.',
    table(
      ['Variant', 'Element', 'Size', 'Weight', 'Line height', 'Letter spacing', 'Case', 'Source'],
      variants.map((variant) => {
        const style = type[variant];
        return [
          code(variant),
          code(variantElements[variant]),
          `${code(style.fontSize)} (${px(style.fontSize)})`,
          code(style.fontWeight),
          code(style.lineHeight),
          code(style.letterSpacing),
          style.textTransform ? code(style.textTransform) : '—',
          sourceOf(`typography.${variant}.fontSize`),
        ];
      }),
    ),
  ].join('\n\n');
}

const spacingSteps = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12];

export function spacingMarkdown() {
  const theme = themes.light;
  return [
    `The spacing unit is ${code(theme.spacing(1))}. Spacing props and \`sx\` keys (\`p\`, \`m\`, \`gap\`, \`Stack spacing\`) take multiples of it: \`sx={{ p: 2 }}\` is ${code(theme.spacing(2))}. Source: ${sourceOf('spacing(1)')}.`,
    table(
      ['Multiple', '`theme.spacing(n)`'],
      spacingSteps.map((step) => [code(step), code(theme.spacing(step))]),
    ),
  ].join('\n\n');
}

export function shapeMarkdown() {
  const theme = (units: number) => themes.light.spacing(units);
  const radius = themes.light.shape.borderRadius;
  return [
    `The theme has one radius, ${code(`${radius}px`)}, MUI's single \`shape.borderRadius\`. Buttons, icon buttons, inputs, cards, menus, dialogs, tooltips and toggle buttons use it. Chips and avatars keep their own pill and circle shapes. In \`sx\`, \`borderRadius\` multiplies it: \`sx={{ borderRadius: 2 }}\` is ${code(`${Number(radius) * 2}px`)}.`,
    table(['Theme path', 'Value', 'Source'], [[code('shape.borderRadius'), code(`${radius}px`), sourceOf('shape.borderRadius')]]),
    '## Nested corners',
    "When a rounded element sits close inside a rounded container, the container's radius is the element's radius plus the gap between them, so the corners are concentric. The element keeps the theme radius; the container grows. The radius unit and the spacing unit are both 8px, so in `sx` it's addition. At a gap of 16px or more the corners read as separate shapes and both keep the theme radius. See Rules → Concentric corners.",
    table(
      ['Gap (padding + border)', 'Container radius', 'Container `sx`'],
      [0.5, 1, 1.5].map((gap) => [
        `${code(theme(gap))} (\`p: ${gap}\`)`,
        code(`${Number(radius) + Number.parseFloat(theme(gap))}px`),
        code(`borderRadius: ${1 + gap}`),
      ]),
    ),
  ].join('\n\n');
}

/** Elevations MUI's own components use by default. */
const componentElevations: [string, number][] = [
  ['Paper, Card, Accordion', 1],
  ['AppBar', 4],
  ['Snackbar', 6],
  ['Menu, Popover', 8],
  ['Drawer', 16],
  ['Dialog', 24],
];

export function elevationMarkdown() {
  const shadows = themes.light.shadows;
  return [
    'MUI has 25 elevation levels, 0 to 24, in `theme.shadows`. Set one with `elevation` on Paper and the components built on it, or `boxShadow: n` in `sx`. Paper also takes a lighter surface as its elevation rises (below).',
    '## Defaults by component',
    table(
      ['Component', 'Elevation'],
      componentElevations.map(([component, level]) => [component, code(level)]),
    ),
    '## Surface by elevation',
    'Paper takes its background from its elevation, in both schemes, so a higher surface is a lighter one. This replaces the white overlay MUI lays over dark-scheme Paper.',
    table(
      ['Elevation', 'Surface', 'Used by', 'Source'],
      elevationSurfaces.map(({ elevations: [from, to], level, uses }) => [
        code(`${from}–${to}`),
        code(`background.${level}`),
        uses,
        sourceOf('components.MuiPaper.styleOverrides.root.backgroundImage'),
      ]),
    ),
    '## Levels',
    table(
      ['Level', 'Shadow', 'Source'],
      shadows.map((shadow, level) => [code(level), code(shadow), sourceOf(`shadows.${level}`)]),
    ),
  ].join('\n\n');
}

export function layoutMarkdown() {
  const { values } = themes.light.breakpoints;
  return [
    '## Breakpoints',
    'Breakpoints are minimum widths. Responsive `sx` values and `Grid` sizes take an object keyed by breakpoint, `{ xs: 12, md: 6 }`; in code, `theme.breakpoints.up("md")` gives the media query.',
    table(
      ['Breakpoint', 'Min width', 'Media query', 'Source'],
      Object.entries(values).map(([key, width]) => [
        code(key),
        code(`${width}px`),
        code(themes.light.breakpoints.up(key as keyof typeof values).replace('@media ', '')),
        sourceOf(`breakpoints.values.${key}`),
      ]),
    ),
    '## Page structure',
    '- `Container` centers content and caps its width at a breakpoint (`maxWidth="lg"` is 1200px).',
    '- `Grid` lays out a 12-column grid; `Stack` spaces items in one direction.',
  ].join('\n\n');
}

export function zIndexMarkdown() {
  return [
    'Layering for the components that float. Use these through the components; set `zIndex` yourself only to place something relative to one of them, e.g. `theme.zIndex.appBar + 1`.',
    table(
      ['Theme path', 'Value', 'Source'],
      Object.entries(themes.light.zIndex).map(([key, value]) => [code(`zIndex.${key}`), code(value), sourceOf(`zIndex.${key}`)]),
    ),
  ].join('\n\n');
}

export function motionMarkdown() {
  const { duration, easing } = themes.light.transitions;
  return [
    'MUI components animate with these durations and easings. For your own transitions, use `theme.transitions.create(["opacity"], { duration: theme.transitions.duration.shorter })`.',
    '## Duration',
    table(
      ['Theme path', 'Value', 'Source'],
      Object.entries(duration).map(([key, value]) => [code(`transitions.duration.${key}`), code(`${value}ms`), sourceOf(`transitions.duration.${key}`)]),
    ),
    '## Easing',
    table(
      ['Theme path', 'Value', 'Source'],
      Object.entries(easing).map(([key, value]) => [code(`transitions.easing.${key}`), code(value), sourceOf(`transitions.easing.${key}`)]),
    ),
  ].join('\n\n');
}

/** Each Foundations page: its title, a one-line lead, the specimen story it embeds (if any) and its tables. */
export const foundationPages: { name: string; lead: string; specimen?: string; extraSpecimens?: string[]; markdown: () => string }[] = [
  {
    name: 'Color',
    lead: "The palette in its light and dark schemes: the intents (a navy primary that turns light neutral in dark, a brand-blue secondary, a purple info, and MUI's other intents where they pass on every surface), text, action overlays, greys, the surface and border levels, and the ramps they come from.",
    specimen: 'Color',
    extraSpecimens: ['IntentsOnSurfaces'],
    markdown: colorMarkdown,
  },
  {
    name: 'Typography',
    lead: "MUI's type scale: Roboto, four weights and thirteen variants, set through Typography's `variant`. The headings `h1` to `h6` depart to a compact scale, 32px down to 16px, and every style, `button` included, is regular weight; button labels are shown as written.",
    specimen: 'Typography_',
    markdown: typographyMarkdown,
  },
  { name: 'Spacing', lead: "MUI's 8px spacing unit and its multiples.", specimen: 'Spacing', markdown: spacingMarkdown },
  { name: 'Shape', lead: 'The corner radius every rounded component takes from the theme.', specimen: 'Shape', markdown: shapeMarkdown },
  {
    name: 'Elevation',
    lead: "MUI's 25 shadow levels and the elevation each of its surfaces uses.",
    specimen: 'Elevation',
    markdown: elevationMarkdown,
  },
  { name: 'Layout', lead: "MUI's breakpoints and the components that structure a page.", markdown: layoutMarkdown },
  { name: 'Z-index', lead: 'How MUI layers app bars, drawers, modals, snackbars and tooltips.', markdown: zIndexMarkdown },
  { name: 'Motion', lead: "MUI's transition durations and easing curves.", specimen: 'Motion', markdown: motionMarkdown },
];
