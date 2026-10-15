import { breakpointCssVars } from './breakpoints';
import { figmaColor, figmaString } from './figma/snapshot';
import { cssName, primitiveCssVars, primitiveValue } from './primitives';

export type TokenGroup = 'Color' | 'Typography' | 'Shape' | 'Space';
export type TokenType = 'color' | 'length' | 'font';

/** Groups a token can belong to, including groups with no editable tokens. */
export type SystemGroup = TokenGroup | 'Layout';

export type ColorScheme = 'light' | 'dark';

export type Token = {
  id: string;
  cssVar: string;
  label: string;
  group: TokenGroup;
  type: TokenType;
  defaultValue: string;
  darkValue?: string;
  options?: string[];
  /** Figma variable path that owns this token's default, e.g. `color/text/primary`. Absent for code-owned tokens. */
  figma?: string;
  /** For code-owned tokens, the primitive step per mode the default is read from, so it can be pushed to Figma as an alias. */
  primitive?: { light: string; dark: string };
};

/** Quotes a family name for a CSS font stack when it has a space. */
function family(path: string, fallback: string) {
  const name = figmaString(`primitives/typography/fontFamily/${path}`);
  return `${name.includes(' ') ? `"${name}"` : name}, ${fallback}`;
}

/** A semantic color Figma owns: both modes read from the `color` collection in the snapshot. */
function fromFigma(id: string, path: string, label: string): Token {
  return {
    id,
    cssVar: cssName(path),
    label,
    group: 'Color',
    type: 'color',
    figma: `color/${path}`,
    defaultValue: figmaColor(`color/${path}`, 'Light'),
    darkValue: figmaColor(`color/${path}`, 'Dark'),
  };
}

/** A color code owns, expressed as a primitive step per mode so it can be pushed to Figma as an alias. */
function fromCode(id: string, cssVar: string, label: string, light: string, dark: string): Token {
  return {
    id,
    cssVar,
    label,
    group: 'Color',
    type: 'color',
    primitive: { light, dark },
    defaultValue: primitiveValue(light),
    darkValue: primitiveValue(dark),
  };
}

function palette(role: string, label: string): Token[] {
  return [
    fromFigma(`${role}Main`, `${role}/main`, `${label}`),
    fromFigma(`${role}Light`, `${role}/light`, `${label} light`),
    fromFigma(`${role}Dark`, `${role}/dark`, `${label} dark`),
    fromFigma(`${role}ContrastText`, `${role}/contrastText`, `On ${label.toLowerCase()}`),
  ];
}

export const tokens: Token[] = [
  fromFigma('backgroundDefault', 'background/default', 'Page background'),
  fromFigma('backgroundLevel1', 'background/level1', 'Level 1 surface'),
  fromFigma('backgroundLevel2', 'background/level2', 'Level 2 surface'),
  fromFigma('backgroundPaper', 'background/paper', 'Paper'),
  fromFigma('divider', 'divider', 'Divider'),
  fromCode('dividerSubtle', '--divider-subtle', 'Subtle divider', 'color/slate/300', 'color/navy/800'),
  fromCode('dividerStrong', '--divider-strong', 'Strong divider', 'color/slate/800', 'color/navy/600'),
  fromFigma('textPrimary', 'text/primary', 'Primary text'),
  fromFigma('textSecondary', 'text/secondary', 'Secondary text'),
  fromFigma('textTertiary', 'text/tertiary', 'Tertiary text'),
  fromFigma('textDisabled', 'text/disabled', 'Disabled text'),
  fromFigma('actionHover', 'action/hover', 'Hover overlay'),
  fromFigma('actionPressed', 'action/pressed', 'Pressed overlay'),
  fromFigma('actionFocus', 'action/focus', 'Focus overlay'),
  fromFigma('actionSelected', 'action/selected', 'Selected overlay'),
  ...palette('primary', 'Primary'),
  fromCode('track', '--track', 'Track', 'color/slate/700', 'color/navy/600'),
  ...palette('secondary', 'Secondary'),
  fromCode('secondaryTint', '--secondary-tint', 'Secondary tint', 'color/brand/50', 'color/brand/800'),
  ...palette('success', 'Success'),
  fromCode('successTint', '--success-tint', 'Success tint', 'color/green/50', 'color/green/900'),
  ...palette('warning', 'Warning'),
  fromCode('warningTint', '--warning-tint', 'Warning tint', 'color/yellow/50', 'color/orange/900'),
  ...palette('error', 'Error'),
  fromCode('errorTint', '--error-tint', 'Error tint', 'color/red/50', 'color/red/900'),
  ...palette('info', 'Info'),
  fromCode('utilityElectricity', '--utility-electricity', 'Electricity', 'color/violet/400', 'color/violet/200'),
  fromCode('utilityWater', '--utility-water', 'Water', 'color/brand/500', 'color/brand/400'),
  fromCode('utilityGas', '--utility-gas', 'Gas', 'color/meadow/600', 'color/meadow/400'),
  fromCode('utilitySteam', '--utility-steam', 'Steam', 'color/orange/500', 'color/orange/300'),
  fromCode('utilitySanitation', '--utility-sanitation', 'Sanitation', 'color/spring/500', 'color/spring/300'),
  fromCode('chart1', '--chart-1', 'Series 1 (brand)', 'color/brand/400', 'color/brand/600'),
  fromCode('chart2', '--chart-2', 'Series 2 (orange)', 'color/orange/700', 'color/orange/600'),
  fromCode('chart3', '--chart-3', 'Series 3 (green)', 'color/green/400', 'color/green/500'),
  fromCode('chart4', '--chart-4', 'Series 4 (violet)', 'color/violet/500', 'color/violet/300'),
  fromCode('chart5', '--chart-5', 'Series 5 (spring)', 'color/spring/400', 'color/spring/500'),
  fromCode('chart6', '--chart-6', 'Series 6 (midnight)', 'color/midnight/700', 'color/midnight/700'),
  fromCode('chart7', '--chart-7', 'Series 7 (meadow)', 'color/meadow/400', 'color/meadow/500'),
  {
    id: 'fontSans',
    cssVar: '--font-sans',
    label: 'Font Sans',
    group: 'Typography',
    type: 'font',
    figma: 'primitives/typography/fontFamily/sans',
    defaultValue: family('sans', 'system-ui, sans-serif'),
    options: [
      'Inter, "SF Pro Text", system-ui, sans-serif',
      '"IBM Plex Sans", system-ui, sans-serif',
      'Manrope, system-ui, sans-serif',
      'Roboto, system-ui, sans-serif',
      '"Source Sans 3", system-ui, sans-serif',
      'system-ui, sans-serif',
    ],
  },
  {
    id: 'fontSerif',
    cssVar: '--font-serif',
    label: 'Font Serif',
    group: 'Typography',
    type: 'font',
    figma: 'primitives/typography/fontFamily/serif',
    defaultValue: family('serif', 'Georgia, serif'),
    options: [
      '"Source Serif 4", Georgia, serif',
      '"IBM Plex Serif", Georgia, serif',
      '"Roboto Serif", Georgia, serif',
      'Georgia, "Times New Roman", Times, serif',
      'ui-serif, Georgia, serif',
    ],
  },
  {
    id: 'fontMono',
    cssVar: '--font-mono',
    label: 'Font Mono',
    group: 'Typography',
    type: 'font',
    figma: 'primitives/typography/fontFamily/mono',
    defaultValue: family('mono', 'ui-monospace, monospace'),
    options: [
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      '"JetBrains Mono", ui-monospace, monospace',
      '"IBM Plex Mono", ui-monospace, monospace',
      '"Source Code Pro", ui-monospace, monospace',
      '"Roboto Mono", ui-monospace, monospace',
    ],
  },
  {
    id: 'radius',
    cssVar: '--radius',
    label: 'Radius',
    group: 'Shape',
    type: 'length',
    primitive: { light: 'radius/md', dark: 'radius/md' },
    defaultValue: primitiveValue('radius/md'),
  },
  {
    id: 'radiusControl',
    cssVar: '--radius-control',
    label: 'Control radius',
    group: 'Shape',
    type: 'length',
    primitive: { light: 'radius/md', dark: 'radius/md' },
    defaultValue: primitiveValue('radius/md'),
  },
  {
    id: 'controlHeight',
    cssVar: '--control-height',
    label: 'Control height',
    group: 'Shape',
    type: 'length',
    primitive: { light: 'size/36', dark: 'size/36' },
    defaultValue: primitiveValue('size/36'),
  },
  {
    id: 'borderWidth',
    cssVar: '--border-width',
    label: 'Border width',
    group: 'Shape',
    type: 'length',
    defaultValue: '1px',
  },
  { id: 'shadow', cssVar: '--shadow', label: 'Elevation', group: 'Shape', type: 'length', defaultValue: '0px' },
  {
    id: 'space',
    cssVar: '--space',
    label: 'Base space',
    group: 'Space',
    type: 'length',
    primitive: { light: 'spacing/1', dark: 'spacing/1' },
    defaultValue: primitiveValue('spacing/1'),
  },
  {
    id: 'cardPad',
    cssVar: '--card-pad',
    label: 'Card padding',
    group: 'Space',
    type: 'length',
    primitive: { light: 'spacing/2', dark: 'spacing/2' },
    defaultValue: primitiveValue('spacing/2'),
  },
  {
    id: 'gap',
    cssVar: '--gap',
    label: 'Card gap',
    group: 'Space',
    type: 'length',
    primitive: { light: 'spacing/1_5', dark: 'spacing/1_5' },
    defaultValue: primitiveValue('spacing/1_5'),
  },
];
/**
 * Editable token layers. `core` tokens are the identity knobs the rest of the
 * theme derives from; `semantic` tokens are roles with their own stored value.
 * Both sit above the primitives in `primitives.ts`, which mirror Figma's ramps.
 */
export type TokenLayer = 'core' | 'semantic';

/** Identity knobs. Semantic tokens build on these; both layers are editable in the Theme editor. */
export const coreTokenIds = [
  'backgroundDefault',
  'textPrimary',
  'secondaryMain',
  'successMain',
  'warningMain',
  'errorMain',
  'fontSans',
  'fontSerif',
  'fontMono',
  'radius',
  'controlHeight',
  'shadow',
  'space',
] as const;
export type CoreTokenId = (typeof coreTokenIds)[number];

export function isCoreTokenId(id: string): id is CoreTokenId {
  return (coreTokenIds as readonly string[]).includes(id);
}

export function tokenLayer(token: Token): TokenLayer {
  return isCoreTokenId(token.id) ? 'core' : 'semantic';
}

export const coreTokens = tokens.filter((token) => isCoreTokenId(token.id));
export const semanticTokens = tokens.filter((token) => !isCoreTokenId(token.id));

export const defaultTheme = Object.fromEntries(tokens.map((token) => [token.id, token.defaultValue])) as Record<
  string,
  string
>;

export const colorTokens = tokens.filter((token) => token.type === 'color');

export const defaultDarkColors = Object.fromEntries(
  colorTokens.map((token) => [token.id, token.darkValue ?? token.defaultValue]),
) as Record<string, string>;

export type ThemeValues = typeof defaultTheme;

export function resolveTheme(
  values: ThemeValues,
  darkColors: Record<string, string>,
  scheme: ColorScheme,
): ThemeValues {
  if (scheme === 'light') return values;
  const next = { ...values };
  for (const token of colorTokens) {
    next[token.id] = darkColors[token.id] ?? token.darkValue ?? token.defaultValue;
  }
  return next;
}

/** Figma Shadow/card: two soft layers in the #2B3D4F ink. `--shadow` scales the blur; 0 switches it off. */
function shadowElevation(values: Record<string, string>, scheme: ColorScheme) {
  const shadow = Number.parseInt(values.shadow ?? '0', 10) || 0;
  if (shadow === 0) return 'none';
  const ink = scheme === 'dark' ? '0, 0, 0' : '43, 61, 79';
  const [outer, inner] = scheme === 'dark' ? [0.45, 0.3] : [0.08, 0.06];
  return `0 1px ${shadow}px rgba(${ink}, ${outer}), 0 1px 2px rgba(${ink}, ${inner})`;
}

/** Figma Shadow/Primitive steps, light scheme. Overlays pick md (popover) and lg (modal). */
export const shadowScale = {
  sm: '0 1px 3px rgba(43, 61, 79, 0.08), 0 1px 2px rgba(43, 61, 79, 0.06)',
  md: '0 2px 8px rgba(43, 61, 79, 0.1), 0 1px 3px rgba(43, 61, 79, 0.08)',
  lg: '0 4px 16px rgba(43, 61, 79, 0.12), 0 2px 6px rgba(43, 61, 79, 0.08)',
  xl: '0 8px 24px rgba(43, 61, 79, 0.16), 0 4px 10px rgba(43, 61, 79, 0.1)',
} as const;

function scrollbarThumb(values: Record<string, string>) {
  return values.track ?? defaultTheme.track;
}

function scrollbarThumbHover(values: Record<string, string>) {
  return `color-mix(in oklab, ${values.track ?? defaultTheme.track} 55%, ${values.textTertiary ?? defaultTheme.textTertiary})`;
}

/**
 * A CSS variable that is part of the system but has no stored value of its own:
 * a fixed step on a scale, an alias of an editable token, or computed from one.
 * The Theme editor shows these read-only with their resolved value.
 */
export type DerivedToken = {
  cssVar: string;
  label: string;
  group: SystemGroup;
  /** Fixed value. Omitted when `aliasOf` or `compute` supplies the value. */
  value?: string;
  /** Id of the editable token this variable mirrors. */
  aliasOf?: string;
  compute?: (values: Record<string, string>, scheme: ColorScheme) => string;
  note?: string;
};

/**
 * One step on the type scale. The fixed size is the primitive and is declared
 * once; `fluid` layers a viewport clamp on top of it for larger hierarchy.
 */
export type TypeStep = {
  id: string;
  cssVar: string;
  /** Fixed size in rem. */
  rem: number;
  /** Fluid variant. Its ceiling is the fixed size, referenced rather than restated. */
  fluid?: { minRem: number; preferred: string };
};

export const typeScale: TypeStep[] = [
  { id: 'xxs', cssVar: '--text-xxs', rem: 0.625 },
  { id: 'xs', cssVar: '--text-xs', rem: 0.75 },
  { id: 'sm', cssVar: '--text-sm', rem: 0.875 },
  { id: 'md', cssVar: '--text-md', rem: 1 },
  { id: 'lg', cssVar: '--text-lg', rem: 1.125 },
  { id: 'xl', cssVar: '--text-xl', rem: 1.375, fluid: { minRem: 1.25, preferred: '1.1rem + 0.5vw' } },
  { id: '2xl', cssVar: '--text-2xl', rem: 1.75, fluid: { minRem: 1.5, preferred: '1.25rem + 0.8vw' } },
  { id: '3xl', cssVar: '--text-3xl', rem: 2.125, fluid: { minRem: 1.75, preferred: '1.4rem + 1.2vw' } },
  { id: '4xl', cssVar: '--text-4xl', rem: 2.75, fluid: { minRem: 2.25, preferred: '1.7rem + 1.8vw' } },
];

const remPx = 16;

export function typeStepPx(step: TypeStep): string {
  return `${step.rem * remPx}px`;
}

export function fluidCssVar(step: TypeStep): string {
  return `${step.cssVar}-fluid`;
}

export function fluidValue(step: TypeStep): string {
  if (!step.fluid) return `var(${step.cssVar})`;
  return `clamp(${step.fluid.minRem}rem, ${step.fluid.preferred}, var(${step.cssVar}))`;
}

export function fluidRangePx(step: TypeStep): string {
  if (!step.fluid) return typeStepPx(step);
  return `${step.fluid.minRem * remPx}–${typeStepPx(step)}`;
}

/** A semantic size: a text role pointed at one step of the type scale. */
export type FontSizeToken = {
  id: string;
  cssVar: string;
  label: string;
  /** Id of the type scale step this role uses. */
  step: string;
  /** Use the step's fluid variant. Reserved for page-level hierarchy. */
  fluid?: boolean;
};

export const fontSizeTokens: FontSizeToken[] = [
  { id: 'fontSizeSm', cssVar: '--font-size-sm', label: 'Label size', step: 'xs' },
  { id: 'fontSize', cssVar: '--font-size', label: 'Body size', step: 'sm' },
  { id: 'fontSizeTitle', cssVar: '--font-size-title', label: 'Title size', step: 'xl', fluid: true },
  { id: 'fontSizeMetricSm', cssVar: '--font-size-metric-sm', label: 'Compact metric size', step: 'xl' },
  { id: 'fontSizeMetric', cssVar: '--font-size-metric', label: 'Metric size', step: '3xl', fluid: true },
];

export const fontSizeTokenById: Record<string, FontSizeToken> = Object.fromEntries(
  fontSizeTokens.map((token) => [token.id, token]),
);

function fontSizeStep(token: FontSizeToken): TypeStep {
  return typeScale.find((step) => step.id === token.step)!;
}

/** The type scale variable a semantic size points at. */
export function fontSizeSource(token: FontSizeToken): string {
  const step = fontSizeStep(token);
  return token.fluid ? fluidCssVar(step) : step.cssVar;
}

/** Rendered size in px: a single value for fixed roles, a range for fluid ones. */
export function fontSizePx(token: FontSizeToken): string {
  const step = fontSizeStep(token);
  return token.fluid ? fluidRangePx(step) : typeStepPx(step);
}

export const derivedTokens: DerivedToken[] = [
  ...typeScale.map((step) => ({
    cssVar: step.cssVar,
    label: `Text ${step.id.toUpperCase()}`,
    group: 'Typography' as const,
    value: `${step.rem}rem`,
    note: typeStepPx(step),
  })),
  ...typeScale
    .filter((step) => step.fluid)
    .map((step) => ({
      cssVar: fluidCssVar(step),
      label: `Text ${step.id.toUpperCase()} fluid`,
      group: 'Typography' as const,
      value: fluidValue(step),
      note: `${fluidRangePx(step)}, scales with the viewport`,
    })),
  ...fontSizeTokens.map((token) => ({
    cssVar: token.cssVar,
    label: token.label,
    group: 'Typography' as const,
    value: `var(${fontSizeSource(token)})`,
    note: fontSizePx(token),
  })),
  { cssVar: '--space-1', label: 'Space 1', group: 'Space', value: '4px', note: 'Tightest pairing: icon to label' },
  { cssVar: '--space-2', label: 'Space 2', group: 'Space', aliasOf: 'space', note: 'Alias of --space' },
  { cssVar: '--space-3', label: 'Space 3', group: 'Space', aliasOf: 'gap', note: 'Alias of --gap' },
  { cssVar: '--space-4', label: 'Space 4', group: 'Space', value: '16px', note: 'Matches --card-pad' },
  { cssVar: '--space-5', label: 'Space 5', group: 'Space', value: '24px', note: 'Page padding' },
  { cssVar: '--space-6', label: 'Space 6', group: 'Space', value: '32px' },
  { cssVar: '--space-7', label: 'Space 7', group: 'Space', value: '48px' },
  { cssVar: '--space-8', label: 'Space 8', group: 'Space', value: '64px' },
  {
    cssVar: '--spacing-component-xs',
    label: 'Component XS',
    group: 'Space',
    value: '4px',
    note: 'Figma spacing/component-xs',
  },
  {
    cssVar: '--spacing-component-sm',
    label: 'Component SM',
    group: 'Space',
    aliasOf: 'space',
    note: 'Figma spacing/component-sm',
  },
  {
    cssVar: '--spacing-component-md',
    label: 'Component MD',
    group: 'Space',
    aliasOf: 'gap',
    note: 'Figma spacing/component-md',
  },
  {
    cssVar: '--spacing-component-lg',
    label: 'Component LG',
    group: 'Space',
    aliasOf: 'cardPad',
    note: 'Figma spacing/component-lg',
  },
  { cssVar: '--spacing-layout-sm', label: 'Layout SM', group: 'Space', value: '16px', note: 'Figma spacing/layout-sm' },
  { cssVar: '--spacing-layout-md', label: 'Layout MD', group: 'Space', value: '24px', note: 'Figma spacing/layout-md' },
  { cssVar: '--spacing-layout-lg', label: 'Layout LG', group: 'Space', value: '32px', note: 'Figma spacing/layout-lg' },
  { cssVar: '--spacing-layout-xl', label: 'Layout XL', group: 'Space', value: '48px', note: 'Figma spacing/layout-xl' },
  {
    cssVar: '--radius-inner',
    label: 'Inner radius',
    group: 'Shape',
    value: '4px',
    note: 'Chips, badges, nested tiles and clipped viewports (Figma radius/sm)',
  },
  {
    cssVar: '--shadow-sm',
    label: 'Shadow SM',
    group: 'Shape',
    value: shadowScale.sm,
    note: 'Figma Shadow/card, Shadow/tooltip',
  },
  {
    cssVar: '--shadow-md',
    label: 'Shadow MD',
    group: 'Shape',
    value: shadowScale.md,
    note: 'Figma Shadow/panel, Shadow/popover',
  },
  { cssVar: '--shadow-lg', label: 'Shadow LG', group: 'Shape', value: shadowScale.lg, note: 'Figma Shadow/modal' },
  {
    cssVar: '--shadow-xl',
    label: 'Shadow XL',
    group: 'Shape',
    value: shadowScale.xl,
    note: 'Figma Shadow/Primitive/xl',
  },
  {
    cssVar: '--shadow-elevation',
    label: 'Elevation shadow',
    group: 'Shape',
    compute: shadowElevation,
    note: 'Computed from --shadow',
  },
  {
    cssVar: '--scrollbar-thumb',
    label: 'Scrollbar thumb',
    group: 'Color',
    compute: scrollbarThumb,
    note: 'Alias of --track, written per scheme',
  },
  {
    cssVar: '--scrollbar-thumb-hover',
    label: 'Scrollbar thumb hover',
    group: 'Color',
    compute: scrollbarThumbHover,
    note: 'Track mixed toward muted text',
  },
  { cssVar: '--content-max', label: 'Content max width', group: 'Layout', value: '1440px' },
];

export function derivedValue(
  token: DerivedToken,
  values: Record<string, string>,
  scheme: ColorScheme = 'light',
): string {
  if (token.compute) return token.compute(values, scheme);
  if (token.aliasOf) return values[token.aliasOf] ?? defaultTheme[token.aliasOf] ?? '';
  return token.value ?? '';
}

export function themeToCssVars(values: Record<string, string>, scheme: ColorScheme = 'light'): Record<string, string> {
  const vars: Record<string, string> = { ...primitiveCssVars };
  for (const token of tokens) {
    vars[token.cssVar] = values[token.id] ?? token.defaultValue;
  }
  for (const token of derivedTokens) {
    vars[token.cssVar] = derivedValue(token, values, scheme);
  }
  Object.assign(vars, breakpointCssVars);
  return vars;
}

function cssBlock(selector: string, vars: Record<string, string>) {
  const lines = Object.entries(vars).map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

export function themeToCssText(values: ThemeValues, darkColors: Record<string, string> = defaultDarkColors): string {
  const lightVars = themeToCssVars(values, 'light');
  const darkResolved = resolveTheme(values, darkColors, 'dark');
  const darkVars: Record<string, string> = { 'color-scheme': 'dark' };
  for (const token of colorTokens) {
    darkVars[token.cssVar] = darkResolved[token.id] ?? token.darkValue ?? token.defaultValue;
  }
  darkVars['--shadow-elevation'] = shadowElevation(darkResolved, 'dark');
  darkVars['--scrollbar-thumb'] = scrollbarThumb(darkResolved);
  darkVars['--scrollbar-thumb-hover'] = scrollbarThumbHover(darkResolved);
  return `${cssBlock(':root', { 'color-scheme': 'light', ...lightVars })}\n\n${cssBlock('html.dark', darkVars)}\n`;
}

/** Categorical chart slots in assignment order. Validated with the dataviz palette checks on both surfaces. */
export const chartSeriesIds = ['chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'chart6', 'chart7'] as const;

/** Semantic grouping for the color palette, so roles read in intent order. */
export type ColorRoleGroup = {
  id: string;
  label: string;
  description: string;
  tokenIds: string[];
};

export const colorRoles: ColorRoleGroup[] = [
  {
    id: 'surfaces',
    label: 'Surfaces',
    description:
      'Four surfaces from the slate and navy ramps, after Figma background/default, level1, level2 and paper: the page, toolbars and inputs, nested wells, and raised cards and popovers. The divider follows Figma; the subtle and strong steps are code-owned.',
    tokenIds: [
      'backgroundDefault',
      'backgroundLevel1',
      'backgroundLevel2',
      'backgroundPaper',
      'divider',
      'dividerSubtle',
      'dividerStrong',
    ],
  },
  {
    id: 'text',
    label: 'Text',
    description:
      'Solid navy steps after Figma text/primary, secondary, tertiary and disabled. No opacity: each emphasis is a ramp color in both modes.',
    tokenIds: ['textPrimary', 'textSecondary', 'textTertiary', 'textDisabled'],
  },
  {
    id: 'action',
    label: 'Action overlays',
    description:
      'Figma action/*: the primary text color at a small opacity, laid over the component fill for hover, pressed, focus and selected. Never applied as layer opacity.',
    tokenIds: ['actionHover', 'actionPressed', 'actionFocus', 'actionSelected'],
  },
  {
    id: 'primary',
    label: 'Primary',
    description:
      'Figma primary: the solid navy for the single high-commitment action, with its contrast text. Track is the code-owned neutral behind progress.',
    tokenIds: ['primaryMain', 'primaryLight', 'primaryDark', 'primaryContrastText', 'track'],
  },
  {
    id: 'secondary',
    label: 'Secondary',
    description:
      'Figma secondary: the brand blue that answers "what is active or important?". Never decorative. The tint is code-owned and marks selection and the active nav item.',
    tokenIds: ['secondaryMain', 'secondaryLight', 'secondaryDark', 'secondaryContrastText', 'secondaryTint'],
  },
  {
    id: 'state',
    label: 'State',
    description:
      'Figma success, warning and error. Success marks favorable deltas, warning marks caution, error marks unfavorable deltas and failures. Tints are code-owned steps from the same ramps. Always paired with a label or icon.',
    tokenIds: [
      'successMain',
      'successLight',
      'successDark',
      'successContrastText',
      'successTint',
      'warningMain',
      'warningLight',
      'warningDark',
      'warningContrastText',
      'warningTint',
      'errorMain',
      'errorLight',
      'errorDark',
      'errorContrastText',
      'errorTint',
    ],
  },
  {
    id: 'info',
    label: 'Info',
    description: 'Figma info on the midnight ramp. Links and informational chips use it.',
    tokenIds: ['infoMain', 'infoLight', 'infoDark', 'infoContrastText'],
  },
  {
    id: 'utility',
    label: 'Utilities',
    description:
      'Code-owned entity colors for commodity data from the Figma ramps: electricity on violet, water on brand, gas on meadow, steam on orange, sanitation on spring, each stepped lighter in dark mode. A utility keeps its hue everywhere it appears. Not a categorical palette; never rely on them alone to separate series.',
    tokenIds: ['utilityElectricity', 'utilityWater', 'utilityGas', 'utilitySteam', 'utilitySanitation'],
  },
  {
    id: 'chart',
    label: 'Chart series',
    description:
      'Code-owned. Seven categorical slots, one per chromatic Figma ramp not reserved for status, in the order brand, orange, green, violet, spring, midnight, meadow, chosen by search to maximise colorblind separation. Validated with the dataviz checks: worst adjacent CVD ΔE 26.3 light and 12.4 dark against a target of 8. Assigned to series in sequence, never cycled; an eighth series folds into Other.',
    tokenIds: [...chartSeriesIds],
  },
];

export const fontFamilyIds = ['fontSans', 'fontSerif', 'fontMono'] as const;

export type FontFamilyId = (typeof fontFamilyIds)[number];

export const fontFamilyCssVar: Record<FontFamilyId, string> = {
  fontSans: '--font-sans',
  fontSerif: '--font-serif',
  fontMono: '--font-mono',
};

/** A named typeface stack: sans for UI, serif for reading, mono for code. */
export type FontRole = {
  id: FontFamilyId;
  usage: string;
  sample: string;
};

export const fontRoles: FontRole[] = [
  { id: 'fontSans', usage: 'Interface, body, and controls.', sample: 'Portfolio performance' },
  {
    id: 'fontSerif',
    usage: 'Editorial passages and long reading.',
    sample: 'Chilled water loop is running 4°F above setpoint.',
  },
  { id: 'fontMono', usage: 'Code, token names, and identifiers.', sample: '--font-mono' },
];

/** A named text style: a size token plus the weight and leading applied to it. */
export type TypeRole = {
  id: string;
  label: string;
  /** Id of a semantic size in `fontSizeTokens`. */
  sizeToken: string;
  /** Point at fontSans, fontSerif, or fontMono to restyle this role. */
  familyToken: FontFamilyId;
  weight: number;
  lineHeight: number;
  letterSpacing?: string;
  transform?: 'uppercase';
  tabularNums?: boolean;
  usage: string;
  sample: string;
};

export const typeRoles: TypeRole[] = [
  {
    id: 'title',
    label: 'Title',
    sizeToken: 'fontSizeTitle',
    familyToken: 'fontSans',
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    usage: 'Page heading. One per view.',
    sample: 'Portfolio performance',
  },
  {
    id: 'cardTitle',
    label: 'Card title',
    sizeToken: 'fontSize',
    familyToken: 'fontSans',
    weight: 400,
    lineHeight: 1.3,
    usage: 'Card, dialog, and popover headings.',
    sample: 'Support traffic activity',
  },
  {
    id: 'body',
    label: 'Body',
    sizeToken: 'fontSize',
    familyToken: 'fontSans',
    weight: 400,
    lineHeight: 1.5,
    usage: 'Default UI text, controls, and table cells.',
    sample: 'Chilled water loop is running 4°F above setpoint at 120 Broadway.',
  },
  {
    id: 'label',
    label: 'Label',
    sizeToken: 'fontSizeSm',
    familyToken: 'fontSans',
    weight: 400,
    lineHeight: 1.4,
    usage: 'Field labels, descriptions, and card meta.',
    sample: 'Used on tickets and meter rollups.',
  },
  {
    id: 'eyebrow',
    label: 'Section eyebrow',
    sizeToken: 'fontSizeSm',
    familyToken: 'fontSans',
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.15em',
    transform: 'uppercase',
    usage: 'Group headings above a grid of cards.',
    sample: 'Data',
  },
  {
    id: 'metric',
    label: 'Metric',
    sizeToken: 'fontSizeMetric',
    familyToken: 'fontSans',
    weight: 400,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    tabularNums: true,
    usage: 'KPI values. Always tabular so digits do not shift.',
    sample: '12,853',
  },
  {
    id: 'metricSm',
    label: 'Compact metric',
    sizeToken: 'fontSizeMetricSm',
    familyToken: 'fontSans',
    weight: 400,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    tabularNums: true,
    usage: 'Secondary values inside a card or widget. Fixed so dense layouts do not reflow.',
    sample: '3,922',
  },
];

export const layoutGrid = {
  columns: 12,
  defaultSpan: 4,
  wideSpan: 6,
} as const;

export type ContrastKind = 'normal' | 'ui';

export type ContrastPair = {
  id: string;
  label: string;
  fg: string;
  bg: string;
  kind: ContrastKind;
};

export const contrastPairs: ContrastPair[] = [
  { id: 'text-on-paper', label: 'Primary text on paper', fg: 'textPrimary', bg: 'backgroundPaper', kind: 'normal' },
  {
    id: 'secondary-on-paper',
    label: 'Secondary text on paper',
    fg: 'textSecondary',
    bg: 'backgroundPaper',
    kind: 'normal',
  },
  {
    id: 'tertiary-on-paper',
    label: 'Tertiary text on paper',
    fg: 'textTertiary',
    bg: 'backgroundPaper',
    kind: 'normal',
  },
  { id: 'text-on-page', label: 'Primary text on page', fg: 'textPrimary', bg: 'backgroundDefault', kind: 'normal' },
  { id: 'on-secondary', label: 'On secondary', fg: 'secondaryContrastText', bg: 'secondaryMain', kind: 'ui' },
  { id: 'on-primary', label: 'On primary', fg: 'primaryContrastText', bg: 'primaryMain', kind: 'ui' },
  { id: 'warning-on-paper', label: 'Warning on paper', fg: 'warningMain', bg: 'backgroundPaper', kind: 'normal' },
  { id: 'error-on-paper', label: 'Error on paper', fg: 'errorMain', bg: 'backgroundPaper', kind: 'normal' },
  { id: 'info-on-paper', label: 'Info on paper', fg: 'infoMain', bg: 'backgroundPaper', kind: 'normal' },
];
export const tokenById: Record<string, Token> = Object.fromEntries(tokens.map((token) => [token.id, token]));

export const fontLabels: Record<string, string> = {
  'Inter, "SF Pro Text", system-ui, sans-serif': 'Inter',
  '"IBM Plex Sans", system-ui, sans-serif': 'IBM Plex Sans',
  'Manrope, system-ui, sans-serif': 'Manrope',
  'Roboto, system-ui, sans-serif': 'Roboto',
  '"Source Sans 3", system-ui, sans-serif': 'Source Sans 3',
  'system-ui, sans-serif': 'System',
  '"Source Serif 4", Georgia, serif': 'Source Serif 4',
  '"IBM Plex Serif", Georgia, serif': 'IBM Plex Serif',
  '"Roboto Serif", Georgia, serif': 'Roboto Serif',
  'Georgia, "Times New Roman", Times, serif': 'Georgia',
  'ui-serif, Georgia, serif': 'System',
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace': 'System',
  '"JetBrains Mono", ui-monospace, monospace': 'JetBrains Mono',
  '"IBM Plex Mono", ui-monospace, monospace': 'IBM Plex Mono',
  '"Source Code Pro", ui-monospace, monospace': 'Source Code Pro',
  '"Roboto Mono", ui-monospace, monospace': 'Roboto Mono',
};
