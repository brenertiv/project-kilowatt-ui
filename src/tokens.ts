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
    defaultValue: '#F9FAFC',
    darkValue: '#0D212A',
  },
  {
    id: 'surface',
    cssVar: '--color-surface',
    label: 'Surface',
    group: 'Color',
    type: 'color',
    defaultValue: '#FFFFFF',
    darkValue: '#112A36',
  },
  {
    id: 'border',
    cssVar: '--color-border',
    label: 'Border',
    group: 'Color',
    type: 'color',
    defaultValue: '#DCE3EC',
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
    defaultValue: '#365670',
    darkValue: '#D6DEE8',
  },
  {
    id: 'textMuted',
    cssVar: '--color-text-muted',
    label: 'Muted text',
    group: 'Color',
    type: 'color',
    defaultValue: '#426A8A',
    darkValue: '#6CA2CF',
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
    darkValue: '#1B3E4F',
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
    defaultValue: '#008459',
    darkValue: '#04D1AA',
  },
  {
    id: 'negative',
    cssVar: '--color-negative',
    label: 'Negative',
    group: 'Color',
    type: 'color',
    defaultValue: '#D61A1A',
    darkValue: '#FF7A7A',
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
    defaultValue: '#EDF1F5',
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
    defaultValue: '"IBM Plex Serif", Georgia, serif',
    options: [
      '"Source Serif 4", Georgia, serif',
      '"IBM Plex Serif", Georgia, serif',
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
  {
    id: 'fontSizeTitle',
    cssVar: '--font-size-title',
    label: 'Title size',
    group: 'Typography',
    type: 'length',
    defaultValue: '20px',
  },
  {
    id: 'fontSize',
    cssVar: '--font-size',
    label: 'Body size',
    group: 'Typography',
    type: 'length',
    defaultValue: '14px',
  },
  {
    id: 'fontSizeSm',
    cssVar: '--font-size-sm',
    label: 'Label size',
    group: 'Typography',
    type: 'length',
    defaultValue: '12px',
  },
  {
    id: 'fontSizeMetric',
    cssVar: '--font-size-metric',
    label: 'Metric size',
    group: 'Typography',
    type: 'length',
    defaultValue: '32px',
  },
  { id: 'radius', cssVar: '--radius', label: 'Radius', group: 'Shape', type: 'length', defaultValue: '10px' },
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
    defaultValue: '32px',
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

/** Identity knobs. Semantic roles are documented on the Design System page and are not editable. */
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

function shadowElevation(values: Record<string, string>, scheme: ColorScheme) {
  const shadow = Number.parseInt(values.shadow ?? '0', 10) || 0;
  if (shadow === 0) return 'none';
  const color = scheme === 'dark' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(17, 18, 20, 0.08)';
  return `0 1px ${shadow}px ${color}`;
}

/**
 * A CSS variable that is part of the system but not editable: either a fixed
 * step on a scale, an alias of an editable token, or computed from one.
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

export const derivedTokens: DerivedToken[] = [
  { cssVar: '--space-1', label: 'Space 1', group: 'Space', value: '4px', note: 'Tightest pairing: icon to label' },
  { cssVar: '--space-2', label: 'Space 2', group: 'Space', aliasOf: 'space', note: 'Alias of --space' },
  { cssVar: '--space-3', label: 'Space 3', group: 'Space', aliasOf: 'gap', note: 'Alias of --gap' },
  { cssVar: '--space-4', label: 'Space 4', group: 'Space', value: '16px', note: 'Matches --card-pad' },
  { cssVar: '--space-5', label: 'Space 5', group: 'Space', value: '24px', note: 'Page padding' },
  { cssVar: '--space-6', label: 'Space 6', group: 'Space', value: '32px' },
  { cssVar: '--space-7', label: 'Space 7', group: 'Space', value: '48px' },
  { cssVar: '--space-8', label: 'Space 8', group: 'Space', value: '64px' },
  {
    cssVar: '--radius-inner',
    label: 'Inner radius',
    group: 'Shape',
    value: '6px',
    note: 'Nested tiles and clipped viewports',
  },
  {
    cssVar: '--shadow-elevation',
    label: 'Elevation shadow',
    group: 'Shape',
    compute: shadowElevation,
    note: 'Computed from --shadow',
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
  return `${cssBlock(':root', { 'color-scheme': 'light', ...lightVars })}\n\n${cssBlock('html.dark', darkVars)}\n`;
}

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
    description: 'The page, the cards that sit on it, and the lines between them.',
    tokenIds: ['bg', 'surface', 'border', 'hover'],
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Three levels of emphasis. Hierarchy comes from these, not from size alone.',
    tokenIds: ['text', 'textSecondary', 'textMuted'],
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
    tokenIds: ['positive', 'warning', 'negative'],
  },
  {
    id: 'utility',
    label: 'Action and utility',
    description: 'Solid fills for the single high-commitment action, and neutral tracks behind progress.',
    tokenIds: ['solid', 'onSolid', 'track'],
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
    weight: 500,
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
    weight: 500,
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
    letterSpacing: '0.05em',
    transform: 'uppercase',
    usage: 'Group headings above a grid of cards.',
    sample: 'Data',
  },
  {
    id: 'metric',
    label: 'Metric',
    sizeToken: 'fontSizeMetric',
    familyToken: 'fontSans',
    weight: 500,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    tabularNums: true,
    usage: 'KPI values. Always tabular so digits do not shift.',
    sample: '12,853',
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
  'Georgia, "Times New Roman", Times, serif': 'Georgia',
  'ui-serif, Georgia, serif': 'System',
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace': 'System',
  '"JetBrains Mono", ui-monospace, monospace': 'JetBrains Mono',
  '"IBM Plex Mono", ui-monospace, monospace': 'IBM Plex Mono',
  '"Source Code Pro", ui-monospace, monospace': 'Source Code Pro',
  '"Roboto Mono", ui-monospace, monospace': 'Roboto Mono',
};
