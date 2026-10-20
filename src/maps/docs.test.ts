// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { mapDepartures, type MapName } from './departures';

/**
 * Each map page lists exactly the CARTO departures that name its map (src/maps/departures.ts),
 * as chart pages list their amCharts departures and component pages list their MUI departures (src/components/docs.test.ts), so a page can't go stale
 * when a departure is added, removed or retargeted.
 */

const maps: MapName[] = ['SiteMap'];

/** The body of one `## heading` section. */
function section(mdx: string, heading: string) {
  return mdx.split(/^## /m).find((chunk) => chunk.startsWith(`${heading}\n`)) ?? '';
}

describe.each(maps)('%s.mdx', (map) => {
  const mdx = readFileSync(fileURLToPath(new URL(`./${map}.mdx`, import.meta.url)), 'utf8');

  it('lists exactly the CARTO departures that apply to it', () => {
    const body = section(mdx, 'CARTO departures');
    expect(body, 'missing "## CARTO departures"').not.toBe('');
    const listed = [...body.matchAll(/^- `([^`]+)`/gm)].map((match) => match[1]);
    const expected = mapDepartures.filter((departure) => departure.maps.includes(map)).map(({ id }) => id);
    expect(listed.sort()).toEqual(expected.sort());
  });

  it('puts CARTO departures right after MUI departures', () => {
    const headings = [...mdx.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
    expect(headings.indexOf('CARTO departures')).toBe(headings.indexOf('MUI departures') + 1);
  });
});
