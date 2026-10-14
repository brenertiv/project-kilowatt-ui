/**
 * Figma links and the registry that maps this repository onto a Figma file.
 *
 * A link copied from Figma names a file by key and, with "Copy link to
 * selection", a node inside it. Links are parsed once and stored in a
 * canonical form so `links.json` has no tracking parameters and stable diffs.
 * This module is pure: the dev server imports it to validate writes, and the
 * app imports it to parse what the user pastes.
 */

export type FigmaLinkKind = 'design' | 'board' | 'proto' | 'slides' | 'make';

export type FigmaLink = {
  kind: FigmaLinkKind;
  fileKey: string;
  /** Human name taken from the URL path, e.g. "Enertiv UI Foundations 0.0". */
  fileName: string | null;
  /** Node id in Figma's `1:23` form, or null for a link to the whole file. */
  nodeId: string | null;
  /** Canonical URL: www host, `design` for legacy `/file/` links, only the node-id parameter kept. */
  url: string;
};

/** What the repository links to: the file the system mirrors, and one node per component. */
export type FigmaLinks = {
  /** The design file the tokens and components are mirrored from, as a whole-file link. */
  file: string | null;
  /** Workbench component slug (`data-table`) to a link to that component's node in Figma. */
  components: Record<string, string>;
};

const kinds = new Set<string>(['design', 'board', 'proto', 'slides', 'make', 'file']);

/** `1-23`, `1:23` and the URL-encoded `1%3A23` all mean node `1:23`. */
export function normalizeNodeId(raw: string): string | null {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const match = /^(\d+)[:-](\d+)$/.exec(decoded.trim());
  return match ? `${match[1]}:${match[2]}` : null;
}

export function parseFigmaUrl(input: string): FigmaLink | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.hostname !== 'www.figma.com' && url.hostname !== 'figma.com') return null;
  const [, rawKind, fileKey, rawName = ''] = url.pathname.split('/');
  if (!rawKind || !kinds.has(rawKind) || !fileKey || !/^[A-Za-z0-9]+$/.test(fileKey)) return null;
  const rawNode = url.searchParams.get('node-id');
  const nodeId = rawNode ? normalizeNodeId(rawNode) : null;
  if (rawNode && !nodeId) return null;
  const kind: FigmaLinkKind = rawKind === 'file' ? 'design' : (rawKind as FigmaLinkKind);
  let fileName: string | null = null;
  try {
    fileName = decodeURIComponent(rawName).replace(/-/g, ' ').trim() || null;
  } catch {
    fileName = null;
  }
  const canonical = new URL(`https://www.figma.com/${kind}/${fileKey}/${rawName}`);
  if (nodeId) canonical.searchParams.set('node-id', nodeId.replace(':', '-'));
  return { kind, fileKey, fileName, nodeId, url: canonical.toString() };
}

function canonicalUrl(value: unknown, where: string): string {
  if (typeof value !== 'string') throw new Error(`${where}: expected a Figma link, got ${JSON.stringify(value)}`);
  const link = parseFigmaUrl(value);
  if (!link) throw new Error(`${where}: not a Figma link: ${value}`);
  return link.url;
}

/**
 * Checks a registry read from disk or sent by the app and returns it in
 * canonical form: every link parsed, component keys sorted so the file diffs
 * one line per change. Throws with the offending entry on bad input.
 */
export function normalizeFigmaLinks(input: unknown): FigmaLinks {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Figma links must be an object');
  const record = input as Record<string, unknown>;
  const file = record.file == null || record.file === '' ? null : canonicalUrl(record.file, 'file');
  const rawComponents = record.components ?? {};
  if (!rawComponents || typeof rawComponents !== 'object' || Array.isArray(rawComponents)) {
    throw new Error('components must be an object of slug to link');
  }
  const components: Record<string, string> = {};
  for (const [slug, value] of Object.entries(rawComponents as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`components: "${slug}" is not a component slug`);
    components[slug] = canonicalUrl(value, `components.${slug}`);
  }
  return { file, components };
}

/** Serialized the way the dev server writes `links.json`. */
export function serializeFigmaLinks(links: FigmaLinks): string {
  return `${JSON.stringify(links, null, 2)}\n`;
}
