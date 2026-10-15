import { describe, expect, it } from 'vitest';
import { normalizeFigmaLinks, normalizeNodeId, parseFigmaUrl, serializeFigmaLinks } from './url';

const key = 'AbC123xyz';

describe('parseFigmaUrl', () => {
  it('reads a design link with a selection', () => {
    const link = parseFigmaUrl(
      `https://www.figma.com/design/${key}/Enertiv-UI-Foundations-0.0?node-id=12-345&t=abc123-0&m=dev`,
    );
    expect(link).toEqual({
      kind: 'design',
      fileKey: key,
      fileName: 'Enertiv UI Foundations 0.0',
      nodeId: '12:345',
      url: `https://www.figma.com/design/${key}/Enertiv-UI-Foundations-0.0?node-id=12-345`,
    });
  });

  it('reads a whole-file link and legacy /file/ links', () => {
    expect(parseFigmaUrl(`https://figma.com/design/${key}/Foundations`)).toMatchObject({
      nodeId: null,
      fileName: 'Foundations',
    });
    expect(parseFigmaUrl(`https://www.figma.com/file/${key}/Foundations?node-id=1%3A2`)).toMatchObject({
      kind: 'design',
      nodeId: '1:2',
      url: `https://www.figma.com/design/${key}/Foundations?node-id=1-2`,
    });
  });

  it('keeps FigJam, prototype, slides and make links', () => {
    expect(parseFigmaUrl(`https://www.figma.com/board/${key}/Flows`)?.kind).toBe('board');
    expect(parseFigmaUrl(`https://www.figma.com/proto/${key}/Demo?node-id=3-4`)?.kind).toBe('proto');
    expect(parseFigmaUrl(`https://www.figma.com/slides/${key}/Deck`)?.kind).toBe('slides');
    expect(parseFigmaUrl(`https://www.figma.com/make/${key}/App`)?.kind).toBe('make');
  });

  it('rejects anything that is not a Figma file link', () => {
    expect(parseFigmaUrl('')).toBeNull();
    expect(parseFigmaUrl('not a url')).toBeNull();
    expect(parseFigmaUrl('https://example.com/design/abc/Name')).toBeNull();
    expect(parseFigmaUrl('http://www.figma.com/design/abc/Name')).toBeNull();
    expect(parseFigmaUrl('https://www.figma.com/')).toBeNull();
    expect(parseFigmaUrl('https://www.figma.com/files/recent')).toBeNull();
    expect(parseFigmaUrl(`https://www.figma.com/design/${key}/Name?node-id=oops`)).toBeNull();
    expect(parseFigmaUrl(`https://www.figma.com/design/not%20a%20key/Name`)).toBeNull();
  });

  it('normalizes node ids', () => {
    expect(normalizeNodeId('1-2')).toBe('1:2');
    expect(normalizeNodeId('1:2')).toBe('1:2');
    expect(normalizeNodeId('1%3A2')).toBe('1:2');
    expect(normalizeNodeId('a-b')).toBeNull();
  });
});

describe('normalizeFigmaLinks', () => {
  it('canonicalizes the file link', () => {
    const links = normalizeFigmaLinks({ file: `https://figma.com/file/${key}/Foundations?t=zzz` });
    expect(links).toEqual({ file: `https://www.figma.com/design/${key}/Foundations` });
  });

  it('treats a missing or empty file as unlinked', () => {
    expect(normalizeFigmaLinks({})).toEqual({ file: null });
    expect(normalizeFigmaLinks({ file: '' }).file).toBeNull();
  });

  it('accepts the old empty components map and refuses component links', () => {
    expect(normalizeFigmaLinks({ file: null, components: {} })).toEqual({ file: null });
    expect(() =>
      normalizeFigmaLinks({ components: { button: `https://www.figma.com/design/${key}/N?node-id=1-1` } }),
    ).toThrow(/parameters\.design/);
  });

  it('names the bad entry when it rejects', () => {
    expect(() => normalizeFigmaLinks(null)).toThrow(/object/);
    expect(() => normalizeFigmaLinks({ file: 'https://example.com' })).toThrow(/^file: not a Figma link/);
  });

  it('serializes with a trailing newline for the committed file', () => {
    expect(serializeFigmaLinks({ file: null })).toBe('{\n  "file": null\n}\n');
  });
});
