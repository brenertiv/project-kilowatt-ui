import { describe, expect, it } from 'vitest';
import initial from './links.json';
import { linkFor, withLink } from './links';
import { fixtureGroups } from '../workbench/registry';
import { normalizeFigmaLinks, serializeFigmaLinks } from './url';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const key = 'AbC123xyz';
const node = (id: string) => `https://www.figma.com/design/${key}/Foundations?node-id=${id}`;

describe('links.json', () => {
  it('is a valid registry written in canonical form', () => {
    const links = normalizeFigmaLinks(initial);
    const onDisk = readFileSync(join(process.cwd(), 'src/figma/links.json'), 'utf8');
    expect(onDisk).toBe(serializeFigmaLinks(links));
  });

  it('only links components the workbench knows, so renames do not leave dangling entries', () => {
    const slugs = new Set(fixtureGroups.map((group) => group.slug));
    const unknown = Object.keys(normalizeFigmaLinks(initial).components).filter((slug) => !slugs.has(slug));
    expect(unknown, 'component keys in src/figma/links.json without a fixture').toEqual([]);
  });
});

describe('withLink', () => {
  const links = normalizeFigmaLinks({ file: node('').replace('?node-id=', ''), components: { button: node('1-1') } });

  it('sets, replaces and clears a component link', () => {
    const added = withLink(links, { kind: 'component', slug: 'data-table' }, node('2-2'));
    expect(Object.keys(added.components)).toEqual(['button', 'data-table']);
    const replaced = withLink(added, { kind: 'component', slug: 'button' }, node('3-3'));
    expect(linkFor(replaced, { kind: 'component', slug: 'button' })).toBe(node('3-3'));
    const cleared = withLink(replaced, { kind: 'component', slug: 'button' }, null);
    expect(linkFor(cleared, { kind: 'component', slug: 'button' })).toBeNull();
    expect(cleared.components['data-table']).toBe(node('2-2'));
  });

  it('sets and clears the file link without touching components', () => {
    const cleared = withLink(links, { kind: 'file' }, null);
    expect(cleared.file).toBeNull();
    expect(cleared.components).toEqual(links.components);
    expect(withLink(cleared, { kind: 'file' }, `https://figma.com/file/${key}/Foundations?t=1`).file).toBe(
      `https://www.figma.com/design/${key}/Foundations`,
    );
  });
});
