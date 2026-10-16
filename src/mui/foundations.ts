import type { Theme } from '@mui/material/styles';
import { navy, slate } from './colors';
import { borderSteps, departures, elevationSurfaces, intentSteps, primarySteps, surfaceSteps, type ColorScheme } from './departures';
import { createSchemeTheme } from './theme';
import { departureChanges } from './themeDiff';

/**
 * The Foundations pages as Markdown tables, read from the running theme. Every
 * value carries its source: MUI's default, or the departure that sets it. The
 * pages are generated from this (scripts/build-docs.ts), so they can't drift
 * from the theme and the line between MUI and Kilowatt stays visible.
 */

const themes: Record<ColorScheme, Theme> = { light: createSchemeTheme('light'), dark: createSchemeTheme('dark') };

/** Theme path → the departure that changes it, in either scheme. */
const claims = new Map<string, string>();
for (const departure of departures) {
  for (const scheme of ['light', 'dark'] as const) {
    for (const change of departureChanges(departure, scheme)) claims.set(change.path, departure.id);
  }
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
    "Every `main` passes 4.5:1 as text on all five surface levels in its scheme, and its `contrastText` passes 4.5:1 on it; a test enforces both. Primary is Enertiv navy (the `primary-navy` departure), on the navy ramp. For the other intents, where MUI's default falls short on the surfaces, Kilowatt uses another step of the same MUI color ramp (`@mui/material/colors`) and MUI derives `light` and `dark` from it:",
    table(
      ['Intent', 'Light', 'Dark'],
      intents.map((intent) => {
        const cell = (scheme: ColorScheme) => {
          if (intent === 'primary') return `navy ${primarySteps[scheme].main} ${code(navy[primarySteps[scheme].main])}`;
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
    "Four borders by contrast against the surfaces, in both schemes, so a border looks the same weight in light and dark. level0 to level2 separate and frame: level0 is the faintest, and `divider` is level1, so MUI's Divider uses it. level3 is for control outlines (outlined buttons, inputs) and reaches 3:1 on every surface, the contrast WCAG asks of a control's boundary. Set one with `sx={{ borderColor: 'border.level2' }}`.",
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
      ['Step', 'Slate (light)', 'Navy (dark)'],
      [...new Set([...Object.keys(slate), ...Object.keys(navy)].map(Number))]
        .sort((a, b) => a - b)
        .map((step) => [
          code(step),
          step in slate ? code(slate[step as keyof typeof slate]) : '—',
          step in navy ? code(navy[step as keyof typeof navy]) : '—',
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
  const radius = themes.light.shape.borderRadius;
  return [
    `MUI has one radius, ${code(`${radius}px`)}. Buttons, inputs, cards, menus and chips use it. In \`sx\`, \`borderRadius\` multiplies it: \`sx={{ borderRadius: 2 }}\` is ${code(`${Number(radius) * 2}px`)}.`,
    table(['Theme path', 'Value', 'Source'], [[code('shape.borderRadius'), code(`${radius}px`), sourceOf('shape.borderRadius')]]),
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
    lead: "The palette in its light and dark schemes: MUI's intents, text, action overlays and greys, with Kilowatt's surface and border levels and the ramps they come from.",
    specimen: 'Color',
    extraSpecimens: ['IntentsOnSurfaces'],
    markdown: colorMarkdown,
  },
  {
    name: 'Typography',
    lead: "MUI's type: Roboto, four weights and thirteen variants, set through Typography's `variant`.",
    specimen: 'Typography_',
    markdown: typographyMarkdown,
  },
  { name: 'Spacing', lead: "MUI's 8px spacing unit and its multiples.", specimen: 'Spacing', markdown: spacingMarkdown },
  { name: 'Shape', lead: "MUI's border radius.", specimen: 'Shape', markdown: shapeMarkdown },
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
