import { describe, expect, it } from 'vitest';
import { breakpointCssVars, breakpointQueryCss, breakpoints } from './breakpoints';

describe('breakpoints', () => {
  it('exposes matching CSS variables and query thresholds', () => {
    expect(breakpointCssVars['--bp-gallery-md']).toBe(`${breakpoints.galleryMd}px`);
    const css = breakpointQueryCss();
    expect(css).toContain(`@container gallery (max-width: ${breakpoints.galleryMd}px)`);
    expect(css).toContain('--gallery-cols: 6');
    expect(css).toContain('--gallery-span: 3');
    expect(css).not.toMatch(
      new RegExp(`@container gallery \\(max-width: ${breakpoints.galleryMd}px\\)[^{]*\\{[^}]*--gallery-span-wide`),
    );
    expect(css).toContain(`@container gallery (max-width: ${breakpoints.gallerySm}px)`);
    expect(css).toContain('--gallery-span-wide: 2');
    expect(css).toContain(`@media (max-width: ${breakpoints.workspace}px)`);
    expect(css).toContain(`@container (max-width: ${breakpoints.table}px)`);
    expect(css).toContain(`@container (max-width: ${breakpoints.ticket}px)`);
    expect(css).toContain(`@container (max-width: ${breakpoints.sparkline}px)`);
  });
});
