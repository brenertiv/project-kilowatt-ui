import { figmaColor, figmaNumber, figmaString, figmaVariables } from './figma/snapshot';

/**
 * Primitives: the raw ramps and scales, read from the Figma "primitives"
 * collection in the committed snapshot (`src/figma/variables.json`). Figma
 * owns every value here; nothing is typed by hand. Semantic tokens in
 * `tokens.ts` take their values from these steps, and the Theme editor edits
 * semantic tokens, never primitives.
 *
 * CSS variable names follow the Figma path with slashes turned into dashes
 * and camel case flattened: `color/brand/600` becomes `--color-brand-600`,
 * `spacing/0_5` becomes `--spacing-0-5`, `typography/fontSize/12` becomes
 * `--typography-font-size-12`.
 */

export type RampName =
  | 'brand'
  | 'navy'
  | 'slate'
  | 'yellow'
  | 'green'
  | 'violet'
  | 'red'
  | 'orange'
  | 'spring'
  | 'meadow'
  | 'aquaverde'
  | 'parchment'
  | 'midnight';

export const rampNames: RampName[] = [
  'brand',
  'navy',
  'slate',
  'yellow',
  'green',
  'violet',
  'red',
  'orange',
  'spring',
  'meadow',
  'aquaverde',
  'parchment',
  'midnight',
];

const collection = 'primitives';

function entries(prefix: string): [string, string][] {
  return figmaVariables(collection, prefix).map(([name]) => [name.slice(prefix.length), `${collection}/${name}`]);
}

/** Each ramp is an ordered list of [step, hex]. Ramps keep the steps Figma gives them; they are not padded or renamed. */
export const colorRamps: Record<RampName, [number, string][]> = Object.fromEntries(
  rampNames.map((ramp) => [
    ramp,
    entries(`color/${ramp}/`)
      .filter(([step]) => /^\d+$/.test(step))
      .map(([step, path]) => [Number(step), figmaColor(path)] as [number, string])
      .sort((a, b) => a[0] - b[0]),
  ]),
) as Record<RampName, [number, string][]>;

/** The step names a ramp has, ascending. */
export function rampSteps(ramp: RampName): number[] {
  return colorRamps[ramp].map(([step]) => step);
}

/** Figma spacing/N in px, ascending. The name is the Figma name (`0_5`, `1`, `1_5`), not a position. */
export const spacingScale: [string, number][] = entries('spacing/')
  .map(([name, path]) => [name, figmaNumber(path)] as [string, number])
  .sort((a, b) => a[1] - b[1]);

export const radiusScale: [string, number][] = entries('radius/')
  .map(([name, path]) => [name, figmaNumber(path)] as [string, number])
  .sort((a, b) => a[1] - b[1]);

function numberMap(prefix: string, digits: number): Record<string, number> {
  return Object.fromEntries(entries(prefix).map(([name, path]) => [name, Number(figmaNumber(path).toFixed(digits))]));
}

function sortByValue(map: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(map).sort((a, b) => a[1] - b[1]));
}

export const typographyPrimitives = {
  fontFamily: Object.fromEntries(
    entries('typography/fontFamily/').map(([name, path]) => [name, figmaString(path)]),
  ) as Record<string, string>,
  /** px, keyed by the Figma name, which is the size itself. The rem type scale in `tokens.ts` equals these at a 16px root. */
  fontSize: sortByValue(numberMap('typography/fontSize/', 0)),
  fontWeight: sortByValue(numberMap('typography/fontWeight/', 0)),
  lineHeight: sortByValue(numberMap('typography/lineHeight/', 3)),
  /** em, as Figma records them. */
  letterSpacing: sortByValue(numberMap('typography/letterSpacing/', 4)),
};

/** Figma size/N: control heights, ascending. */
export const sizeScale: number[] = entries('size/')
  .map(([, path]) => figmaNumber(path))
  .sort((a, b) => a - b);

/** Figma opacity/N in percent, ascending. */
export const opacityScale: [string, number][] = entries('opacity/')
  .map(([name, path]) => [name, figmaNumber(path)] as [string, number])
  .sort((a, b) => a[1] - b[1]);

export type Primitive = {
  path: string;
  cssVar: string;
  value: string;
  group: 'color' | 'spacing' | 'radius' | 'typography' | 'size' | 'opacity';
};

export function cssName(path: string) {
  return `--${path
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[/_\s]+/g, '-')
    .toLowerCase()}`;
}

function quoteFamily(family: string) {
  return family.includes(' ') ? `"${family}"` : family;
}

function primitive(path: string, value: string, group: Primitive['group']): Primitive {
  return { path, cssVar: cssName(path), value, group };
}

/** Every primitive as a Figma path, a CSS variable name and a CSS value. */
export const primitives: Primitive[] = [
  ...rampNames.flatMap((ramp) =>
    colorRamps[ramp].map(([step, hex]) => primitive(`color/${ramp}/${step}`, hex, 'color')),
  ),
  primitive('color/transparent', figmaColor('primitives/color/transparent'), 'color'),
  ...spacingScale.map(([name, px]) => primitive(`spacing/${name}`, `${px}px`, 'spacing')),
  ...radiusScale.map(([name, px]) => primitive(`radius/${name}`, `${px}px`, 'radius')),
  ...Object.entries(typographyPrimitives.fontFamily).map(([name, family]) =>
    primitive(`typography/fontFamily/${name}`, quoteFamily(family), 'typography'),
  ),
  ...Object.entries(typographyPrimitives.fontSize).map(([name, px]) =>
    primitive(`typography/fontSize/${name}`, `${px}px`, 'typography'),
  ),
  ...Object.entries(typographyPrimitives.fontWeight).map(([name, weight]) =>
    primitive(`typography/fontWeight/${name}`, String(weight), 'typography'),
  ),
  ...Object.entries(typographyPrimitives.lineHeight).map(([name, value]) =>
    primitive(`typography/lineHeight/${name}`, String(value), 'typography'),
  ),
  ...Object.entries(typographyPrimitives.letterSpacing).map(([name, value]) =>
    primitive(`typography/letterSpacing/${name}`, `${value}em`, 'typography'),
  ),
  ...sizeScale.map((px) => primitive(`size/${px}`, `${px}px`, 'size')),
  ...opacityScale.map(([name, percent]) => primitive(`opacity/${name}`, `${percent}%`, 'opacity')),
];

export const primitiveCssVars: Record<string, string> = Object.fromEntries(primitives.map((p) => [p.cssVar, p.value]));

const hexToPath = new Map<string, string>();
for (const p of primitives) {
  if (p.group === 'color' && !hexToPath.has(p.value.toLowerCase())) hexToPath.set(p.value.toLowerCase(), p.path);
}

/** The ramp step a hex value comes from, e.g. `color/slate/200`, or undefined when it is not a primitive. */
export function primitiveForColor(hex: string | undefined): string | undefined {
  if (!hex) return undefined;
  return hexToPath.get(hex.trim().toLowerCase());
}

/** The ramp step whose value matches, formatted for a label: `slate 200`. */
export function rampLabel(hex: string | undefined): string | undefined {
  const path = primitiveForColor(hex);
  return path ? path.replace(/^color\//, '').replace('/', ' ') : undefined;
}

/** The value of one primitive by Figma path, e.g. `color/brand/500` or `spacing/2`. */
export function primitiveValue(path: string): string {
  const found = primitiveCssVars[cssName(path)];
  if (found === undefined) throw new Error(`No primitive at "${path}"`);
  return found;
}
