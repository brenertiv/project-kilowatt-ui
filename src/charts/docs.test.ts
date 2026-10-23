// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { chartDepartures, type ChartName } from './departures';

/**
 * Each chart page lists exactly the amCharts departures that name its chart (src/charts/departures.ts),
 * as component pages list their MUI departures (src/components/docs.test.ts), so a page can't go stale
 * when a departure is added, removed or retargeted.
 */

const charts: ChartName[] = ['LineChart', 'ColumnChart', 'DonutChart', 'Sparkline', 'Heatmap', 'IntervalChart'];

/** The body of one `## heading` section. */
function section(mdx: string, heading: string) {
  return mdx.split(/^## /m).find((chunk) => chunk.startsWith(`${heading}\n`)) ?? '';
}

describe.each(charts)('%s.mdx', (chart) => {
  const mdx = readFileSync(fileURLToPath(new URL(`./${chart}.mdx`, import.meta.url)), 'utf8');

  it('lists exactly the amCharts departures that apply to it', () => {
    const body = section(mdx, 'amCharts departures');
    expect(body, 'missing "## amCharts departures"').not.toBe('');
    const listed = [...body.matchAll(/^- `([^`]+)`/gm)].map((match) => match[1]);
    const expected = chartDepartures.filter((departure) => departure.charts.includes(chart)).map(({ id }) => id);
    expect(listed.sort()).toEqual(expected.sort());
  });

  it('puts amCharts departures right after MUI departures', () => {
    const headings = [...mdx.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
    expect(headings.indexOf('amCharts departures')).toBe(headings.indexOf('MUI departures') + 1);
  });
});
