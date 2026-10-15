import type { ColorScheme } from '../tokens';
import type { buildSystemSnapshot } from './export';

/**
 * The system as Design Tokens Community Group files (format 2025.10), one per
 * color scheme, for token tools and agents that read the standard format.
 * Primitives are literal values; semantic colors alias the primitive step they
 * name in that scheme, or carry a literal value when they have none (overlays).
 */

type Snapshot = ReturnType<typeof buildSystemSnapshot>;

type DtcgToken = { $type?: string; $value: unknown; $description?: string };
type DtcgGroup = { [key: string]: DtcgGroup | DtcgToken | string | undefined; $description?: string };

const round = (value: number) => Math.round(value * 10_000) / 10_000;

/** `#rgb`, `#rrggbb` or `#rrggbbaa` as a DTCG sRGB color. */
export function dtcgColor(hex: string) {
  const raw = hex.trim().replace(/^#/, '');
  const full = raw.length === 3 ? [...raw].map((digit) => digit + digit).join('') : raw;
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(full)) throw new Error(`Not a hex color: ${hex}`);
  const channel = (index: number) => Number.parseInt(full.slice(index, index + 2), 16) / 255;
  return {
    colorSpace: 'srgb',
    components: [round(channel(0)), round(channel(2)), round(channel(4))],
    alpha: full.length === 8 ? round(channel(6)) : 1,
    hex: `#${full.slice(0, 6).toLowerCase()}`,
  };
}

/** A primitive's CSS value as a typed DTCG token, chosen from its path and the shape of the value. */
export function dtcgPrimitive(path: string, value: string): DtcgToken {
  const dimension = /^(-?[\d.]+)(px|rem)$/.exec(value);
  if (path.startsWith('color/')) return { $type: 'color', $value: dtcgColor(value) };
  if (path.includes('fontFamily')) return { $type: 'fontFamily', $value: value.replace(/^"|"$/g, '') };
  if (dimension) return { $type: 'dimension', $value: { value: Number(dimension[1]), unit: dimension[2] } };
  const em = /^(-?[\d.]+)em$/.exec(value);
  if (em) {
    // DTCG dimensions are px or rem only, so a relative size travels as its em multiplier.
    return { $type: 'number', $value: Number(em[1]), $description: `In em: ${value}` };
  }
  if (/^[\d.]+%$/.test(value)) return { $type: 'number', $value: round(Number.parseFloat(value) / 100) };
  if (/^-?[\d.]+$/.test(value)) {
    return { $type: path.includes('fontWeight') ? 'fontWeight' : 'number', $value: Number(value) };
  }
  throw new Error(`No DTCG type for ${path}: ${value}`);
}

const reference = (primitivePath: string) => `{${primitivePath.replaceAll('/', '.')}}`;

function place(root: DtcgGroup, path: string[], token: DtcgToken) {
  let group = root;
  for (const segment of path.slice(0, -1)) {
    group[segment] ??= {};
    group = group[segment] as DtcgGroup;
  }
  group[path.at(-1)!] = token;
}

export function systemToDtcg(snapshot: Snapshot, scheme: ColorScheme): DtcgGroup {
  const root: DtcgGroup = {
    $description: `Kilowatt design tokens, ${scheme} scheme. Generated from src/tokens.ts; do not edit.`,
  };
  for (const primitive of snapshot.primitives) place(root, primitive.path.split('/'), dtcgPrimitive(primitive.path, primitive.value));

  const semantic: DtcgGroup = { $description: 'Semantic colors by role. CSS variable in each $description.' };
  for (const [id, color] of Object.entries(snapshot.colors)) {
    const primitive = scheme === 'light' ? color.lightPrimitive : color.darkPrimitive;
    const value = scheme === 'light' ? color.light : color.dark;
    place(semantic, [color.role ?? 'other', id], {
      $type: 'color',
      $value: primitive ? reference(primitive) : dtcgColor(value),
      $description: `${color.label}. var(${color.cssVar})`,
    });
  }
  root.semantic = semantic;
  return root;
}
