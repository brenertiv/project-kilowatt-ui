export type Doc = {
  /** URL segment, derived from the file name. */
  slug: string;
  /** First level-one heading, or the file name when there is none. */
  title: string;
  /** Level-two headings in order, with ids matching the rendered anchors. */
  sections: { id: string; label: string }[];
  markdown: string;
};

/** Markdown files in `/docs` at the repository root, keyed by path. */
const files = import.meta.glob('/docs/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseDoc(path: string, markdown: string): Doc {
  const file = path.split('/').pop() ?? path;
  const slug = file.replace(/\.md$/, '');
  const h1 = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim();
  const sections = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => {
    const label = match[1].trim();
    return { id: slugify(label), label };
  });
  return { slug, title: h1 ?? slug, sections, markdown };
}

export const docs: Doc[] = Object.entries(files)
  .map(([path, markdown]) => parseDoc(path, markdown))
  .sort((a, b) => a.title.localeCompare(b.title));

export function findDoc(slug: string | undefined) {
  return docs.find((doc) => doc.slug === slug);
}
