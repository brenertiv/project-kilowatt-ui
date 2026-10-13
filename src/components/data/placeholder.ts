/**
 * Placeholder detection. The live API holds records named `???`, `0` or
 * nothing at all, so a name is only shown when it carries information.
 */
const placeholderValues = new Set([
  '',
  '?',
  '??',
  '???',
  '0',
  '-',
  '—',
  'n/a',
  'na',
  'null',
  'none',
  'undefined',
  'tbd',
  'unknown',
]);

export function isPlaceholder(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return value === 0;
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return placeholderValues.has(normalized) || /^[?\-_.\s0]+$/.test(normalized);
}

export type DisplayName = { text: string; placeholder: boolean; raw: string | null };

/** The name to show for a record, and whether it is a stand-in for a missing one. */
export function displayName(value: string | null | undefined, fallback: string): DisplayName {
  if (isPlaceholder(value)) return { text: fallback, placeholder: true, raw: value ?? null };
  return { text: value!.trim(), placeholder: false, raw: value! };
}

/** Shortens a UUID for display: the first block, e.g. `d79cbeac`. */
export function shortId(id: string | number): string {
  const text = String(id);
  return text.length > 12 ? text.split('-')[0]! : text;
}
