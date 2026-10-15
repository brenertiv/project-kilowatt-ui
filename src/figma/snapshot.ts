import snapshot from './variables.json';

/**
 * The committed snapshot of the Figma variables, `variables.json`, and the
 * reader the primitives and tokens build on. Figma owns these values; code
 * never edits the snapshot by hand. The tooling that refreshed it from Figma
 * has been removed for now, so it stays as committed until that returns.
 *
 * Paths are `collection/variable`, e.g. `primitives/color/brand/500` or
 * `color/text/primary`. Aliases are followed across collections; a collection
 * that lacks the requested mode answers with its first mode, which is how the
 * single-mode primitives serve both Light and Dark.
 */

export type FigmaAlias = { alias: string; opacity?: number };
export type FigmaValue = string | number | boolean | FigmaAlias;
export type FigmaVariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

export type FigmaVariable = {
  type: FigmaVariableType;
  description?: string;
  values: Record<string, FigmaValue>;
};

export type FigmaCollection = {
  modes: string[];
  variables: Record<string, FigmaVariable>;
};

export type FigmaSnapshot = {
  fileKey: string | null;
  fetchedAt: string;
  collections: Record<string, FigmaCollection>;
};

export const figmaSnapshot = snapshot as FigmaSnapshot;

export function isFigmaAlias(value: FigmaValue): value is FigmaAlias {
  return typeof value === 'object' && value !== null && 'alias' in value;
}

function split(path: string): [string, string] {
  const index = path.indexOf('/');
  if (index < 0) throw new Error(`Figma path "${path}" needs a collection prefix`);
  return [path.slice(0, index), path.slice(index + 1)];
}

/** One variable by path, or undefined when the snapshot has none. */
export function figmaVariable(path: string, source: FigmaSnapshot = figmaSnapshot) {
  const [collectionName, name] = split(path);
  const collection = source.collections[collectionName];
  const variable = collection?.variables[name];
  if (!collection || !variable) return undefined;
  return { collection: collectionName, name, modes: collection.modes, variable };
}

/** Every variable of a collection whose name starts with `prefix`, in snapshot (name) order. */
export function figmaVariables(
  collectionName: string,
  prefix = '',
  source: FigmaSnapshot = figmaSnapshot,
): [string, FigmaVariable][] {
  const collection = source.collections[collectionName];
  if (!collection) return [];
  return Object.entries(collection.variables).filter(([name]) => name.startsWith(prefix));
}

function parseHex(hex: string): { r: number; g: number; b: number; a: number } {
  const raw = hex.replace('#', '');
  const channel = (at: number) => Number.parseInt(raw.slice(at, at + 2), 16);
  return { r: channel(0), g: channel(2), b: channel(4), a: raw.length === 8 ? channel(6) / 255 : 1 };
}

function formatHex({ r, g, b, a }: { r: number; g: number; b: number; a: number }) {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  const alpha = Math.round(a * 255);
  return `#${h(r)}${h(g)}${h(b)}${alpha < 255 ? h(alpha) : ''}`;
}

/**
 * Resolves a path to its value in `mode`, following aliases. An alias with an
 * opacity multiplies that opacity into the color's alpha, as Figma renders it.
 */
export function resolveFigma(
  path: string,
  mode?: string,
  source: FigmaSnapshot = figmaSnapshot,
  depth = 0,
): string | number | boolean {
  if (depth > 16) throw new Error(`Figma alias loop at "${path}"`);
  const found = figmaVariable(path, source);
  if (!found) throw new Error(`Figma variable "${path}" is not in the snapshot`);
  const modeName = mode && found.modes.includes(mode) ? mode : found.modes[0];
  const value = found.variable.values[modeName];
  if (value === undefined) throw new Error(`Figma variable "${path}" has no value for mode "${modeName}"`);
  if (!isFigmaAlias(value)) return value;
  const resolved = resolveFigma(value.alias, mode, source, depth + 1);
  if (value.opacity === undefined || typeof resolved !== 'string' || !resolved.startsWith('#')) return resolved;
  const color = parseHex(resolved);
  return formatHex({ ...color, a: color.a * (value.opacity / 100) });
}

/** A color as lowercase hex, 6 digits or 8 when it carries alpha. */
export function figmaColor(path: string, mode?: string, source: FigmaSnapshot = figmaSnapshot): string {
  const value = resolveFigma(path, mode, source);
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) {
    throw new Error(`Figma variable "${path}" is not a color: ${JSON.stringify(value)}`);
  }
  return formatHex(parseHex(value.toLowerCase()));
}

export function figmaNumber(path: string, mode?: string, source: FigmaSnapshot = figmaSnapshot): number {
  const value = resolveFigma(path, mode, source);
  if (typeof value !== 'number') throw new Error(`Figma variable "${path}" is not a number: ${JSON.stringify(value)}`);
  return value;
}

export function figmaString(path: string, mode?: string, source: FigmaSnapshot = figmaSnapshot): string {
  const value = resolveFigma(path, mode, source);
  if (typeof value !== 'string') throw new Error(`Figma variable "${path}" is not a string: ${JSON.stringify(value)}`);
  return value;
}

/** The last primitive an alias chain lands on, e.g. `primitives/color/navy/900`, or undefined for a raw value. */
export function figmaAliasTarget(
  path: string,
  mode?: string,
  source: FigmaSnapshot = figmaSnapshot,
): string | undefined {
  const found = figmaVariable(path, source);
  if (!found) return undefined;
  const modeName = mode && found.modes.includes(mode) ? mode : found.modes[0];
  const value = found.variable.values[modeName];
  if (!isFigmaAlias(value)) return undefined;
  return figmaAliasTarget(value.alias, mode, source) ?? value.alias;
}
