import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import initial from './links.json';
import { withFileLink } from './links';
import { normalizeFigmaLinks, serializeFigmaLinks } from './url';
import { figmaDesign } from '../stories/figma';

const key = 'AbC123xyz';

describe('links.json', () => {
  it('is a valid registry written in canonical form', () => {
    const links = normalizeFigmaLinks(initial);
    const onDisk = readFileSync(join(process.cwd(), 'src/figma/links.json'), 'utf8');
    expect(onDisk).toBe(serializeFigmaLinks(links));
  });
});

describe('withFileLink', () => {
  it('sets and clears the file link in canonical form', () => {
    const linked = withFileLink({ file: null }, `https://figma.com/file/${key}/Foundations?t=1`);
    expect(linked.file).toBe(`https://www.figma.com/design/${key}/Foundations`);
    expect(withFileLink(linked, null).file).toBeNull();
  });
});

describe('figmaDesign', () => {
  it('gives the Design panel a canonical node link', () => {
    expect(figmaDesign(`https://figma.com/file/${key}/Foundations?node-id=12%3A345&t=x`)).toEqual({
      type: 'figma',
      url: `https://www.figma.com/design/${key}/Foundations?node-id=12-345`,
    });
  });

  it('rejects links that are not a component node', () => {
    expect(() => figmaDesign('https://example.com')).toThrow(/Not a Figma link/);
    expect(() => figmaDesign(`https://www.figma.com/design/${key}/Foundations`)).toThrow(/node/);
  });
});
