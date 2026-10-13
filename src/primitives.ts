/**
 * Primitives: the raw ramps and scales, mirrored one to one from the Figma
 * "primitives" collection in Enertiv UI Foundations. Semantic tokens in
 * `tokens.ts` take their values from these steps. Change a step here only when
 * it changes in Figma; the Theme editor edits semantic tokens, not primitives.
 *
 * CSS variable names follow the Figma path with slashes turned into dashes:
 * `color/brand/600` becomes `--color-brand-600`, `spacing/4` becomes `--spacing-4`.
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

/** Every ramp is eleven steps named 50 to 950, the convention of the newer Figma ramps. */
export const rampSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * Steps that do not yet exist in Figma. The ten-step ramps there run 100 to 1000
 * and already span the same lightness range, so their 1000 is named 950 here and
 * a 50 tint is synthesized by mixing the 100 step toward white. Add these in Figma
 * and replace the values when they land.
 */
export const derivedRampSteps: Partial<Record<RampName, number[]>> = {
  brand: [50],
  navy: [50],
  slate: [50],
  yellow: [50],
  violet: [50],
  red: [50],
};

/** Each ramp is an ordered list of [step, hex] following `rampSteps`. */
export const colorRamps: Record<RampName, [number, string][]> = {
  brand: [[50, '#EFF8FD'], [100, '#DCF0FA'], [200, '#B9E1F5'], [300, '#96D3F0'], [400, '#74C4EB'], [500, '#51B5E6'], [600, '#2EA6E1'], [700, '#2585B4'], [800, '#1C6487'], [900, '#12425A'], [950, '#09212D']],
  navy: [[50, '#C3DEF5'], [100, '#79B5E8'], [200, '#72ABDB'], [300, '#6CA2CF'], [400, '#6598C2'], [500, '#4F7DA3'], [600, '#426A8A'], [700, '#365670'], [800, '#1B3E4F'], [900, '#112A36'], [950, '#0D212A']],
  slate: [[50, '#FFFFFF'], [100, '#FFFFFF'], [200, '#F9FAFC'], [300, '#F3F6F9'], [400, '#EDF1F5'], [500, '#E7ECF2'], [600, '#E2E8EF'], [700, '#DCE3EC'], [800, '#D6DEE8'], [900, '#D0DAE5'], [950, '#CAD5E2']],
  yellow: [[50, '#FFFAF3'], [100, '#FFF5E4'], [200, '#FFE4BC'], [300, '#FFD491'], [400, '#FFC268'], [500, '#FFB44C'], [600, '#FFA83E'], [700, '#FB9C3A'], [800, '#F48E36'], [900, '#ED7F32'], [950, '#E16A2E']],
  green: [[50, '#E1FFEF'], [100, '#BCFEDC'], [200, '#84F4C1'], [300, '#00E5A0'], [400, '#1BC28C'], [500, '#0FA477'], [600, '#0A8864'], [700, '#086D51'], [800, '#00533E'], [900, '#033C2D'], [950, '#09271E']],
  violet: [[50, '#F8F4FE'], [100, '#F0E7FC'], [200, '#D5C3F6'], [300, '#B99CF1'], [400, '#9B72EB'], [500, '#8351E7'], [600, '#6A2EE1'], [700, '#5E29DA'], [800, '#4D21D2'], [900, '#3A19CC'], [950, '#0405C3']],
  red: [[50, '#FFF9F9'], [100, '#FFF1F1'], [200, '#FFE4E4'], [300, '#FFD1D1'], [400, '#FFB8B8'], [500, '#FF9F9F'], [600, '#FF7A7A'], [700, '#FF5A5A'], [800, '#FF4040'], [900, '#F72323'], [950, '#D61A1A']],
  orange: [[50, '#FFF1EC'], [100, '#FFE0D6'], [200, '#FDC4B2'], [300, '#FE9E7F'], [400, '#FB6632'], [500, '#E34712'], [600, '#BB3B0F'], [700, '#952F0C'], [800, '#772001'], [900, '#5C1300'], [950, '#410900']],
  spring: [[50, '#F6F7ED'], [100, '#EDF3AB'], [200, '#DBE64C'], [300, '#C4CF3A'], [400, '#A8B11B'], [500, '#8E960A'], [600, '#767D0F'], [700, '#5F6500'], [800, '#494E04'], [900, '#363900'], [950, '#232500']],
  meadow: [[50, '#EBFFE7'], [100, '#DAF9D4'], [200, '#BFECB6'], [300, '#9EDB92'], [400, '#74C365'], [500, '#43A159'], [600, '#00804C'], [700, '#00683D'], [800, '#04512F'], [900, '#003D21'], [950, '#002915']],
  aquaverde: [[50, '#EBF2F1'], [100, '#D7E3E2'], [200, '#BACDCB'], [300, '#98B2B0'], [400, '#829997'], [500, '#6E8280'], [600, '#5B6D6B'], [700, '#485957'], [800, '#374544'], [900, '#273432'], [950, '#182322']],
  parchment: [[50, '#F6F3EE'], [100, '#F0E4D3'], [200, '#D4C3AC'], [300, '#BDAE99'], [400, '#A19381'], [500, '#897C6C'], [600, '#736859'], [700, '#5E5446'], [800, '#4A4135'], [900, '#383025'], [950, '#271F16']],
  midnight: [[50, '#F3F7FF'], [100, '#E4EEFF'], [200, '#C9DDFD'], [300, '#AFC7EE'], [400, '#8FAAD8'], [500, '#7190C4'], [600, '#5578B2'], [700, '#3A60A1'], [800, '#1E488F'], [900, '#0A3366'], [950, '#001F3F']],
};

/** Figma spacing/N in px. The index is the Figma name, not a position. */
export const spacingScale: [number, number][] = [
  [0, 0], [1, 4], [2, 8], [3, 12], [4, 16], [5, 20], [6, 24], [8, 32], [10, 40], [12, 48], [16, 64], [20, 80], [24, 96], [32, 128],
];

export const radiusScale: [string, number][] = [
  ['none', 0], ['xs', 2], ['sm', 4], ['md', 8], ['lg', 12], ['xl', 16], ['2xl', 20], ['full', 9999],
];

export const typographyPrimitives = {
  fontFamily: { sans: 'Roboto', serif: 'Roboto Serif', mono: 'Roboto Mono' } as Record<string, string>,
  /** px, as Figma records them. The app's rem scale in `tokens.ts` equals these at a 16px root. */
  fontSize: { xxs: 10, xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 34, '4xl': 44, '5xl': 32 } as Record<string, number>,
  fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 } as Record<string, number>,
  lineHeight: { 'extra-tight': 1, tight: 1.2, normal: 1.4, relaxed: 1.6 } as Record<string, number>,
  /** em, as Figma records them. */
  letterSpacing: { tight: -0.01, normal: 0, wide: 0.02, wider: 0.04 } as Record<string, number>,
};

/** Figma size/N: control heights. */
export const sizeScale: number[] = [30, 36, 42];

export type Primitive = { path: string; cssVar: string; value: string; group: 'color' | 'spacing' | 'radius' | 'typography' | 'size' };

function cssName(path: string) {
  return `--${path.replace(/\//g, '-').replace(/\s+/g, '-')}`;
}

/** Every primitive as a Figma path, a CSS variable name and a CSS value. */
export const primitives: Primitive[] = [
  ...(Object.keys(colorRamps) as RampName[]).flatMap((ramp) =>
    colorRamps[ramp].map(([step, hex]) => ({ path: `color/${ramp}/${step}`, cssVar: cssName(`color/${ramp}/${step}`), value: hex, group: 'color' as const })),
  ),
  ...spacingScale.map(([name, px]) => ({ path: `spacing/${name}`, cssVar: cssName(`spacing/${name}`), value: `${px}px`, group: 'spacing' as const })),
  ...radiusScale.map(([name, px]) => ({ path: `radius/${name}`, cssVar: cssName(`radius/${name}`), value: `${px}px`, group: 'radius' as const })),
  ...Object.entries(typographyPrimitives.fontFamily).map(([name, family]) => ({ path: `typography/font-family/${name}`, cssVar: cssName(`typography/font-family/${name}`), value: family.includes(' ') ? `"${family}"` : family, group: 'typography' as const })),
  ...Object.entries(typographyPrimitives.fontSize).map(([name, px]) => ({ path: `typography/font-size/${name}`, cssVar: cssName(`typography/font-size/${name}`), value: `${px}px`, group: 'typography' as const })),
  ...Object.entries(typographyPrimitives.fontWeight).map(([name, weight]) => ({ path: `typography/font-weight/${name}`, cssVar: cssName(`typography/font-weight/${name}`), value: String(weight), group: 'typography' as const })),
  ...Object.entries(typographyPrimitives.lineHeight).map(([name, value]) => ({ path: `typography/line-height/${name}`, cssVar: cssName(`typography/line-height/${name}`), value: String(value), group: 'typography' as const })),
  ...Object.entries(typographyPrimitives.letterSpacing).map(([name, value]) => ({ path: `typography/letter-spacing/${name}`, cssVar: cssName(`typography/letter-spacing/${name}`), value: `${value}em`, group: 'typography' as const })),
  ...sizeScale.map((px) => ({ path: `size/${px}`, cssVar: cssName(`size/${px}`), value: `${px}px`, group: 'size' as const })),
];

export const primitiveCssVars: Record<string, string> = Object.fromEntries(primitives.map((p) => [p.cssVar, p.value]));

export function isDerivedStep(ramp: RampName, step: number) {
  return derivedRampSteps[ramp]?.includes(step) ?? false;
}

const hexToPath = new Map<string, string>();
// Prefer steps that exist in Figma over synthesized ones when a hex matches both.
for (const pass of [false, true]) {
  for (const p of primitives) {
    if (p.group !== 'color') continue;
    const [, ramp, step] = p.path.split('/');
    if (isDerivedStep(ramp as RampName, Number(step)) !== pass) continue;
    if (!hexToPath.has(p.value.toUpperCase())) hexToPath.set(p.value.toUpperCase(), p.path);
  }
}

/** The ramp step a hex value comes from, e.g. `color/slate/300`, or undefined when it is not a primitive. */
export function primitiveForColor(hex: string | undefined): string | undefined {
  if (!hex) return undefined;
  return hexToPath.get(hex.trim().toUpperCase());
}

/** The ramp step whose value matches, formatted for a label: `slate 300`. */
export function rampLabel(hex: string | undefined): string | undefined {
  const path = primitiveForColor(hex);
  return path ? path.replace(/^color\//, '').replace('/', ' ') : undefined;
}
