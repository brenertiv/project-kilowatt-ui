import { describe, expect, it } from 'vitest';
import { breakpointCssVars, breakpointQueryCss, breakpoints } from './breakpoints';

describe('breakpoints', () => {
  it('exposes matching CSS variables and query thresholds', () => {
    expect(breakpointCssVars['--bp-system-md']).toBe(`${breakpoints.systemMd}px`);
    const css = breakpointQueryCss();
    expect(css).toContain(`@container system (max-width: ${breakpoints.systemMd}px)`);
    expect(css).toContain(`@container system (max-width: ${breakpoints.systemSm}px)`);
    expect(css).toContain(`@media (max-width: ${breakpoints.workspace}px)`);
    expect(css).toContain(`@container (max-width: ${breakpoints.table}px)`);
    expect(css).toContain(`@container (max-width: ${breakpoints.ticket}px)`);
    expect(css).toContain(`@container (max-width: ${breakpoints.sparkline}px)`);
    expect(css).not.toContain('gallery');
  });
});
