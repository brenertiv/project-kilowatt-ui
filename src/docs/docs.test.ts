import { describe, expect, it } from 'vitest';
import { docs, parseDoc, slugify } from './docs';

describe('docs registry', () => {
  it('slugifies headings into stable anchors', () => {
    expect(slugify('Space and shape')).toBe('space-and-shape');
    expect(slugify('Changing the `system`!')).toBe('changing-the-system');
  });

  it('parses the title and section index from a markdown file', () => {
    const doc = parseDoc('/docs/example-rules.md', '# Example\n\nIntro.\n\n## First\n\ntext\n\n## Second part\n');
    expect(doc.slug).toBe('example-rules');
    expect(doc.title).toBe('Example');
    expect(doc.sections).toEqual([
      { id: 'first', label: 'First' },
      { id: 'second-part', label: 'Second part' },
    ]);
  });

  it('ships the design system rules', () => {
    const rules = docs.find((doc) => doc.slug === 'design-system-rules');
    expect(rules?.title).toBe('Design System Rules');
    expect(rules?.sections.map((section) => section.label)).toContain('Charts');
  });
});
