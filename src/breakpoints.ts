/** Max-width thresholds in px. Change these to retune layout. */
export const breakpoints = {
  systemMd: 900,
  systemSm: 560,
  ticket: 320,
  sparkline: 240,
} as const;

export type BreakpointName = keyof typeof breakpoints;

export const breakpointRoles: Record<BreakpointName, string> = {
  systemMd: 'Foundations section grids collapse to two columns',
  systemSm: 'Foundations section grids stack to one column',
  ticket: 'Stack ticket rows',
  sparkline: 'Drop sparklines rather than squashing them',
};

export function breakpointVarName(name: BreakpointName) {
  return `--bp-${name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
}

export const breakpointCssVars = {
  '--bp-system-md': `${breakpoints.systemMd}px`,
  '--bp-system-sm': `${breakpoints.systemSm}px`,
  '--bp-ticket': `${breakpoints.ticket}px`,
  '--bp-sparkline': `${breakpoints.sparkline}px`,
} as const;

const STYLE_ID = 'kilowatt-breakpoints';

/**
 * @media / @container cannot read CSS variables, so queries are emitted from
 * `breakpoints` and kept in sync with `--bp-*` on :root.
 */
export function breakpointQueryCss(): string {
  const { systemMd, systemSm, ticket, sparkline } = breakpoints;

  return `@container (max-width: ${ticket}px) {
  .ticket-row {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "id status"
      "title title";
  }
}

@container (max-width: ${sparkline}px) {
  .metric-chart {
    display: none;
  }

  .overview-stats {
    grid-template-columns: 1fr;
  }

  .overview-chart .chart-host {
    display: none;
  }

  .overview-chart {
    flex: 0 0 auto;
  }
}

@container system (max-width: ${systemMd}px) {
  .system-swatches,
  .system-type-list,
  .system-breakpoint-list,
  .system-icon-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container system (max-width: ${systemSm}px) {
  .system-swatches,
  .system-type-list,
  .system-breakpoint-list,
  .system-icon-grid,
  .system-shape-grid,
  .system-contrast-list {
    grid-template-columns: 1fr;
  }

  .system-space-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .system-space-track {
    grid-column: 1 / -1;
  }
}

`;
}

export function installBreakpointStyles() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  const vars = Object.entries(breakpointCssVars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  el.textContent = `:root {\n${vars}\n}\n\n${breakpointQueryCss()}`;
}
