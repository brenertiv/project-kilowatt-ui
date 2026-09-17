import type { ContrastKind } from '../tokens';

function parseHex(value: string): [number, number, number] | null {
  const hex = value.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;
  if (hex.length === 3) {
    return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)];
  }
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

function channel(value: number) {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(foreground: string, background: string): number | null {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  if (a == null || b == null) return null;
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagLevel = 'AAA' | 'AA' | 'fail';

export function wcagLevel(ratio: number, kind: ContrastKind = 'normal'): WcagLevel {
  if (kind === 'ui') return ratio >= 3 ? 'AA' : 'fail';
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'fail';
}

export function formatRatio(ratio: number) {
  return `${ratio.toFixed(2)}:1`;
}

export function measureContrast(foreground: string, background: string, kind: ContrastKind) {
  const ratio = contrastRatio(foreground, background);
  if (ratio == null) return null;
  return { ratio, formatted: formatRatio(ratio), level: wcagLevel(ratio, kind) };
}
