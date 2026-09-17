/** Max-width thresholds in px. Change these to retune layout. */
export const breakpoints = {
  galleryMd: 900,
  gallerySm: 560,
  workspace: 640,
  table: 480,
  ticket: 320,
  sparkline: 240,
} as const;

export type BreakpointName = keyof typeof breakpoints;

export const breakpointRoles: Record<BreakpointName, string> = {
  galleryMd: 'Gallery grid collapses from 12 to 6 columns',
  gallerySm: 'Gallery grid collapses from 6 to 2 columns',
  workspace: 'Top bar stacks brand, utilities, and navigation',
  table: 'Hide a secondary table column; wrap cells',
  ticket: 'Stack ticket rows',
  sparkline: 'Drop sparklines rather than squashing them',
};

export function breakpointVarName(name: BreakpointName) {
  return `--bp-${name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
}

export const breakpointCssVars = {
  '--bp-gallery-md': `${breakpoints.galleryMd}px`,
  '--bp-gallery-sm': `${breakpoints.gallerySm}px`,
  '--bp-workspace': `${breakpoints.workspace}px`,
  '--bp-table': `${breakpoints.table}px`,
  '--bp-ticket': `${breakpoints.ticket}px`,
  '--bp-sparkline': `${breakpoints.sparkline}px`,
} as const;

const STYLE_ID = 'kilowatt-breakpoints';

/**
 * @media / @container cannot read CSS variables, so queries are emitted from
 * `breakpoints` and kept in sync with `--bp-*` on :root.
 */
export function breakpointQueryCss(): string {
  const { galleryMd, gallerySm, workspace, table, ticket, sparkline } = breakpoints;

  return `@container (max-width: ${ticket}px) {
  .ticket-row {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "id status"
      "title title";
  }

  .ticket-row .ui-description {
    white-space: normal;
  }
}

@container (max-width: ${table}px) {
  .ui-table th:nth-child(3),
  .ui-table td:nth-child(3) {
    display: none;
  }

  .ui-table th,
  .ui-table td {
    white-space: normal;
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

@container gallery (max-width: ${galleryMd}px) {
  .gallery-grid {
    --gallery-cols: 6;
    --gallery-span: 3;
  }
}

@container gallery (max-width: ${gallerySm}px) {
  .gallery-grid {
    --gallery-cols: 2;
    --gallery-span: 1;
    --gallery-span-wide: 2;
  }
}

@container system (max-width: ${galleryMd}px) {
  .system-swatches,
  .system-type-list,
  .system-breakpoint-list,
  .system-icon-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container system (max-width: ${gallerySm}px) {
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

@media (max-width: ${workspace}px) {
  .topbar {
    height: auto;
    min-height: 56px;
    padding-block: var(--space-2);
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "brand theme"
      "nav nav";
  }

  .brand {
    grid-area: brand;
  }

  .topbar-nav {
    grid-area: nav;
    justify-self: stretch;
  }

  .topbar-nav-link {
    flex: 1;
  }

  .topbar-actions {
    grid-area: theme;
  }

  .gallery-head,
  .system-head {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .system-exports {
    width: 100%;
  }

  .system-toc {
    flex-wrap: wrap;
  }

  .search {
    width: 100%;
  }

  .ui-input {
    font-size: 16px;
  }

  .editor-panel-grid {
    grid-template-columns: 1fr;
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
