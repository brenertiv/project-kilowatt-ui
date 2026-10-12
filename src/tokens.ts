import { breakpointCssVars } from './breakpoints';

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
};

export const tokens: Token[] = [
  {
    id: 'bg',
    cssVar: '--color-bg',
    label: 'App background',
    group: 'Color',
    type: 'color',
    defaultValue: '#F3F6F9',
    darkValue: '#0D212A',
  },
  {
    id: 'surface',
    cssVar: '--color-surface',
    label: 'Surface',
    group: 'Color',
    type: 'color',
    defaultValue: '#FFFFFF',
    darkValue: '#1B3E4F',
  },
  {
    id: 'surfaceSunken',
    cssVar: '--color-surface-sunken',
    label: 'Sunken surface',
    group: 'Color',
    type: 'color',
    defaultValue: '#F9FAFC',
    darkValue: '#112A36',
  },
  {
    id: 'border',
    cssVar: '--color-border',
    label: 'Border',
    group: 'Color',
    type: 'color',
    defaultValue: '#E2E8EF',
    darkValue: '#1B3E4F',
  },
  {
    id: 'text',
    cssVar: '--color-text',
    label: 'Primary text',
    group: 'Color',
    type: 'color',
    defaultValue: '#0D212A',
    darkValue: '#F9FAFC',
  },
  {
    id: 'textSecondary',
    cssVar: '--color-text-secondary',
    label: 'Secondary text',
    group: 'Color',
    type: 'color',
    defaultValue: '#56646A',
    darkValue: '#B6C2C8',
  },
  {
    id: 'textMuted',
    cssVar: '--color-text-muted',
    label: 'Muted text',
    group: 'Color',
    type: 'color',
    defaultValue: '#626F75',
    darkValue: '#A0AFB7',
  },
  {
    id: 'accent',
    cssVar: '--color-accent',
    label: 'Accent',
    group: 'Color',
    type: 'color',
    defaultValue: '#2EA6E1',
    darkValue: '#51B5E6',
  },
  {
    id: 'accentTint',
    cssVar: '--color-accent-tint',
    label: 'Accent tint',
    group: 'Color',
    type: 'color',
    defaultValue: '#DCF0FA',
    darkValue: '#12425A',
  },
  {
    id: 'onAccent',
    cssVar: '--color-on-accent',
    label: 'On accent',
    group: 'Color',
    type: 'color',
    defaultValue: '#0D212A',
    darkValue: '#0D212A',
  },
  {
    id: 'positive',
    cssVar: '--color-positive',
    label: 'Positive',
    group: 'Color',
    type: 'color',
    defaultValue: '#086D51',
    darkValue: '#00E5A0',
  },
  {
    id: 'negative',
    cssVar: '--color-negative',
    label: 'Negative',
    group: 'Color',
    type: 'color',
    defaultValue: '#D61A1A',
    darkValue: '#FF9F9F',
  },
  {
    id: 'warning',
    cssVar: '--color-warning',
    label: 'Warning',
    group: 'Color',
    type: 'color',
    defaultValue: '#E16A2E',
    darkValue: '#F48E36',
  },
  {
    id: 'solid',
    cssVar: '--color-solid',
    label: 'Solid action',
    group: 'Color',
    type: 'color',
    defaultValue: '#112A36',
    darkValue: '#F9FAFC',
  },
  {
    id: 'onSolid',
    cssVar: '--color-on-solid',
    label: 'On solid',
    group: 'Color',
    type: 'color',
    defaultValue: '#FFFFFF',
    darkValue: '#0D212A',
  },
  {
    id: 'hover',
    cssVar: '--color-hover',
    label: 'Hover fill',
    group: 'Color',
    type: 'color',
    defaultValue: '#E7ECF2',
    darkValue: '#1B3E4F',
  },
  {
    id: 'track',
    cssVar: '--color-track',
    label: 'Track / fill',
    group: 'Color',
    type: 'color',
    defaultValue: '#D6DEE8',
    darkValue: '#365670',
  },
  {
    id: 'textDisabled',
    cssVar: '--color-text-disabled',
    label: 'Disabled text',
    group: 'Color',
    type: 'color',
    defaultValue: '#9EA6AA',
    darkValue: '#748994',
  },
  {
    id: 'link',
    cssVar: '--color-link',
    label: 'Link',
    group: 'Color',
    type: 'color',
    defaultValue: '#1C6487',
    darkValue: '#B9E1F5',
  },
  {
    id: 'borderSubtle',
    cssVar: '--color-border-subtle',
    label: 'Subtle border',
    group: 'Color',
    type: 'color',
    defaultValue: '#EDF1F5',
    darkValue: '#112A36',
  },
  {
    id: 'borderStrong',
    cssVar: '--color-border-strong',
    label: 'Strong border',
    group: 'Color',
    type: 'color',
    defaultValue: '#D0DAE5',
    darkValue: '#365670',
  },
  {
    id: 'positiveTint',
    cssVar: '--color-positive-tint',
    label: 'Positive tint',
    group: 'Color',
    type: 'color',
    defaultValue: '#E1FFEF',
    darkValue: '#17595C',
  },
  {
    id: 'negativeTint',
    cssVar: '--color-negative-tint',
    label: 'Negative tint',
    group: 'Color',
    type: 'color',
    defaultValue: '#FFF1F1',
    darkValue: '#3F4E5C',
  },
  {
    id: 'warningTint',
    cssVar: '--color-warning-tint',
    label: 'Warning tint',
    group: 'Color',
    type: 'color',
    defaultValue: '#FFF5E4',
    darkValue: '#3E4B4B',
  },
  {
    id: 'utilityElectricity',
    cssVar: '--color-utility-electricity',
    label: 'Electricity',
    group: 'Color',
    type: 'color',
    defaultValue: '#FF6BD6',
    darkValue: '#D15CC5',
  },
  {
    id: 'utilityWater',
    cssVar: '--color-utility-water',
    label: 'Water',
    group: 'Color',
    type: 'color',
    defaultValue: '#3FB4E5',
    darkValue: '#5CABD2',
  },
  {
    id: 'utilityGas',
    cssVar: '--color-utility-gas',
    label: 'Gas',
    group: 'Color',
    type: 'color',
    defaultValue: '#00C371',
    darkValue: '#5CBE7C',
  },
  {
    id: 'utilitySteam',
    cssVar: '--color-utility-steam',
    label: 'Steam',
    group: 'Color',
    type: 'color',
    defaultValue: '#FF9900',
    darkValue: '#FF993A',
  },
  {
    id: 'utilitySanitation',
    cssVar: '--color-utility-sanitation',
    label: 'Sanitation',
    group: 'Color',
    type: 'color',
    defaultValue: '#B8B105',
    darkValue: '#E8C71F',
  },
  {
    id: 'chart1',
    cssVar: '--chart-1',
    label: 'Series 1 (blue)',
    group: 'Color',
    type: 'color',
    defaultValue: '#2A78D6',
    darkValue: '#3987E5',
  },
  {
    id: 'chart2',
    cssVar: '--chart-2',
    label: 'Series 2 (orange)',
    group: 'Color',
    type: 'color',
    defaultValue: '#EB6834',
    darkValue: '#D95926',
  },
  {
    id: 'chart3',
    cssVar: '--chart-3',
    label: 'Series 3 (aqua)',
    group: 'Color',
    type: 'color',
    defaultValue: '#1BAF7A',
    darkValue: '#199E70',
  },
  {
    id: 'chart4',
    cssVar: '--chart-4',
    label: 'Series 4 (yellow)',
    group: 'Color',
    type: 'color',
    defaultValue: '#EDA100',
    darkValue: '#C98500',
  },
  {
    id: 'chart5',
    cssVar: '--chart-5',
    label: 'Series 5 (magenta)',
    group: 'Color',
    type: 'color',
    defaultValue: '#E87BA4',
    darkValue: '#D55181',
  },
  {
    id: 'chart6',
    cssVar: '--chart-6',
    label: 'Series 6 (green)',
    group: 'Color',
    type: 'color',
    defaultValue: '#008300',
    darkValue: '#008300',
  },
  {
    id: 'chart7',
    cssVar: '--chart-7',
    label: 'Series 7 (violet)',
    group: 'Color',
    type: 'color',
    defaultValue: '#4A3AA7',
    darkValue: '#9085E9',
  },
  {
    id: 'chart8',
    cssVar: '--chart-8',
    label: 'Series 8 (red)',
    group: 'Color',
    type: 'color',
    defaultValue: '#E34948',
    darkValue: '#E66767',
  },
  {
    id: 'fontSans',
    cssVar: '--font-sans',
    label: 'Font Sans',
    group: 'Typography',
    type: 'font',
    defaultValue: 'Roboto, system-ui, sans-serif',
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
    defaultValue: '"Roboto Serif", Georgia, serif',
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
    defaultValue: '"Roboto Mono", ui-monospace, monospace',
    options: [
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      '"JetBrains Mono", ui-monospace, monospace',
      '"IBM Plex Mono", ui-monospace, monospace',
      '"Source Code Pro", ui-monospace, monospace',
      '"Roboto Mono", ui-monospace, monospace',
    ],
  },
  { id: 'radius', cssVar: '--radius', label: 'Radius', group: 'Shape', type: 'length', defaultValue: '8px' },
  {
    id: 'radiusControl',
    cssVar: '--radius-control',
    label: 'Control radius',
    group: 'Shape',
    type: 'length',
    defaultValue: '8px',
  },
  {
    id: 'controlHeight',
    cssVar: '--control-height',
    label: 'Control height',
    group: 'Shape',
    type: 'length',
    defaultValue: '36px',
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
  { id: 'space', cssVar: '--space', label: 'Base space', group: 'Space', type: 'length', defaultValue: '8px' },
  { id: 'cardPad', cssVar: '--card-pad', label: 'Card padding', group: 'Space', type: 'length', defaultValue: '16px' },
  { id: 'gap', cssVar: '--gap', label: 'Card gap', group: 'Space', type: 'length', defaultValue: '12px' },
];

export type TokenLayer = 'primitive' | 'semantic';

/** Identity knobs. Semantic tokens build on these; both layers are editable in the Theme editor. */
export const primitiveTokenIds = [
  'bg',
  'text',
  'accent',
  'positive',
  'negative',
  'warning',
  'fontSans',
  'fontSerif',
  'fontMono',
  'radius',
  'controlHeight',
  'shadow',
  'space',
] as const;

export type PrimitiveTokenId = (typeof primitiveTokenIds)[number];

export function isPrimitiveTokenId(id: string): id is PrimitiveTokenId {
  return (primitiveTokenIds as readonly string[]).includes(id);
}

export function tokenLayer(token: Token): TokenLayer {
  return isPrimitiveTokenId(token.id) ? 'primitive' : 'semantic';
}

export const primitiveTokens = tokens.filter((token) => isPrimitiveTokenId(token.id));
export const semanticTokens = tokens.filter((token) => !isPrimitiveTokenId(token.id));

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
  return `color-mix(in oklab, ${values.track ?? defaultTheme.track} 55%, ${values.textMuted ?? defaultTheme.textMuted})`;
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
  { cssVar: '--spacing-0', label: 'Spacing 0', group: 'Space', value: '0px', note: 'Figma spacing/0' },
  { cssVar: '--spacing-5', label: 'Spacing 5', group: 'Space', value: '20px', note: 'Figma spacing/5, between space 4 and 5' },
  { cssVar: '--spacing-10', label: 'Spacing 10', group: 'Space', value: '40px', note: 'Figma spacing/10, between space 6 and 7' },
  { cssVar: '--spacing-component-xs', label: 'Component XS', group: 'Space', value: '4px', note: 'Figma spacing/component-xs' },
  { cssVar: '--spacing-component-sm', label: 'Component SM', group: 'Space', aliasOf: 'space', note: 'Figma spacing/component-sm' },
  { cssVar: '--spacing-component-md', label: 'Component MD', group: 'Space', aliasOf: 'gap', note: 'Figma spacing/component-md' },
  { cssVar: '--spacing-component-lg', label: 'Component LG', group: 'Space', aliasOf: 'cardPad', note: 'Figma spacing/component-lg' },
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
  { cssVar: '--radius-lg', label: 'Radius LG', group: 'Shape', value: '12px', note: 'Figma radius/lg' },
  { cssVar: '--radius-xl', label: 'Radius XL', group: 'Shape', value: '16px', note: 'Figma radius/xl' },
  { cssVar: '--radius-2xl', label: 'Radius 2XL', group: 'Shape', value: '20px', note: 'Figma radius/2xl' },
  { cssVar: '--radius-full', label: 'Full radius', group: 'Shape', value: '9999px', note: 'Avatars and pills (Figma radius/full)' },
  { cssVar: '--shadow-sm', label: 'Shadow SM', group: 'Shape', value: shadowScale.sm, note: 'Figma Shadow/card, Shadow/tooltip' },
  { cssVar: '--shadow-md', label: 'Shadow MD', group: 'Shape', value: shadowScale.md, note: 'Figma Shadow/panel, Shadow/popover' },
  { cssVar: '--shadow-lg', label: 'Shadow LG', group: 'Shape', value: shadowScale.lg, note: 'Figma Shadow/modal' },
  { cssVar: '--shadow-xl', label: 'Shadow XL', group: 'Shape', value: shadowScale.xl, note: 'Figma Shadow/Primitive/xl' },
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
    note: 'Alias of --color-track, written per scheme',
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
  const vars: Record<string, string> = {};
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
export const chartSeriesIds = ['chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'chart6', 'chart7', 'chart8'] as const;

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
      'Three surfaces from the slate and navy ramps: the page, a sunken level for toolbars and inputs, and raised cards. Mirrors Figma surface/0, surface/1 and surface/2.',
    tokenIds: ['bg', 'surfaceSunken', 'surface', 'border', 'borderSubtle', 'borderStrong', 'hover'],
  },
  {
    id: 'text',
    label: 'Text',
    description:
      'One text color with emphasis steps. Figma defines secondary, muted and disabled as 70, 60 and 40 percent opacity of text color/100; these are the same steps flattened onto the raised surface and snapped so secondary and muted clear 4.5:1.',
    tokenIds: ['text', 'textSecondary', 'textMuted', 'textDisabled', 'link'],
  },
  {
    id: 'accent',
    label: 'Accent',
    description: 'One saturated blue answers "what is active or important?". Never use it decoratively.',
    tokenIds: ['accent', 'accentTint', 'onAccent'],
  },
  {
    id: 'state',
    label: 'State',
    description:
      'Positive marks favorable deltas and success. Warning marks caution. Negative marks unfavorable deltas and errors. Always paired with a label or icon.',
    tokenIds: ['positive', 'positiveTint', 'warning', 'warningTint', 'negative', 'negativeTint'],
  },
  {
    id: 'utility',
    label: 'Utilities',
    description:
      'Entity colors for commodity data. A utility keeps its hue everywhere it appears, so a water series in a chart matches the water chip in a table. Not a categorical palette: they fail the adjacent-pair checks together, so never rely on them alone to separate series.',
    tokenIds: ['utilityElectricity', 'utilityWater', 'utilityGas', 'utilitySteam', 'utilitySanitation'],
  },
  {
    id: 'action',
    label: 'Action',
    description: 'Solid fills for the single high-commitment action, and neutral tracks behind progress.',
    tokenIds: ['solid', 'onSolid', 'track'],
  },
  {
    id: 'chart',
    label: 'Chart series',
    description:
      'Eight categorical hues in a fixed order, assigned to series in sequence and never cycled. The order is the colorblind-safety mechanism; both schemes pass the adjacent-pair checks on their surfaces.',
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
  { id: 'text-on-surface', label: 'Primary text on surface', fg: 'text', bg: 'surface', kind: 'normal' },
  {
    id: 'secondary-on-surface',
    label: 'Secondary text on surface',
    fg: 'textSecondary',
    bg: 'surface',
    kind: 'normal',
  },
  { id: 'muted-on-surface', label: 'Muted text on surface', fg: 'textMuted', bg: 'surface', kind: 'normal' },
  { id: 'on-accent', label: 'On accent', fg: 'onAccent', bg: 'accent', kind: 'ui' },
  { id: 'on-solid', label: 'On solid', fg: 'onSolid', bg: 'solid', kind: 'ui' },
  { id: 'warning-on-surface', label: 'Warning on surface', fg: 'warning', bg: 'surface', kind: 'normal' },
  { id: 'negative-on-surface', label: 'Negative on surface', fg: 'negative', bg: 'surface', kind: 'normal' },
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
