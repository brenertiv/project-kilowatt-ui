import { describe, expect, it } from 'vitest';
import { colorTokens, defaultDarkColors, defaultTheme } from '../tokens';
import { buildSystemSnapshot, systemToJson, systemToMarkdown } from './export';

describe('design system export', () => {
  it('includes light and dark values for every color token', () => {
    const snapshot = buildSystemSnapshot(defaultTheme, defaultDarkColors);

    for (const token of colorTokens) {
      expect(snapshot.colors[token.id].light).toBe(token.defaultValue);
      expect(snapshot.colors[token.id].dark).toBe(token.darkValue ?? token.defaultValue);
      expect(snapshot.colors[token.id].cssVar).toBe(token.cssVar);
    }

    const json = systemToJson(defaultTheme, defaultDarkColors);
    expect(json).toContain('"light": "#F6F7F8"');
    expect(json).toContain('"dark": "#121316"');
  });

  it('writes a markdown heading per section', () => {
    const markdown = systemToMarkdown(defaultTheme, defaultDarkColors);

    expect(markdown).toContain('## Color');
    expect(markdown).toContain('## Contrast');
    expect(markdown).toContain('## Typography');
    expect(markdown).toContain('## Space');
    expect(markdown).toContain('## Shape');
    expect(markdown).toContain('## Layout');
  });
});
