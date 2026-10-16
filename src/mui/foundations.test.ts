import { describe, expect, it } from 'vitest';
import { foundationPages, sourceOf } from './foundations';

describe('foundations', () => {
  it('render every page from the theme', () => {
    for (const page of foundationPages) expect(page.markdown().length, page.name).toBeGreaterThan(0);
  });

  it('label each value with its source', () => {
    expect(sourceOf('typography.fontSize')).toBe('MUI default');
    expect(sourceOf('palette.primary.main')).toBe('Departure: `primary-navy`');
    expect(sourceOf('palette.error.main')).toBe('Departure: `intents-on-surfaces`');
    expect(sourceOf('shape.borderRadius')).toBe('Departure: `shape-radius`');
  });
});
