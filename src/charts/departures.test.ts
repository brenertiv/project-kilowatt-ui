// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type * as am5 from '@amcharts/amcharts5';
import { describe, expect, it } from 'vitest';
import { createSchemeTheme } from '../mui/theme';
import { chartDepartures, type ChartThemeContext } from './departures';

const source = (file: string) => readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');

/** A stand-in for an amCharts root and theme that records what a departure sets, so the list can be checked in Node. */
function recorder() {
  const rules: string[] = [];
  const rootSettings: string[] = [];
  const settings = (key: string) => ({ setAll: () => rules.push(key), set: () => rules.push(key) });
  const theme = { rule: (name: string, tags: string[] = []) => settings([name, ...tags].join('.')) } as unknown as am5.Theme;
  const root = { numberFormatter: { set: (key: string) => rootSettings.push(key) } } as unknown as am5.Root;
  const animated = {} as am5.Theme;
  const context = (reducedMotion: boolean): ChartThemeContext => ({
    root,
    theme,
    themes: [theme],
    mui: createSchemeTheme('light'),
    color: (value) => value as unknown as am5.Color,
    card: '#fff',
    reducedMotion,
    animated: () => animated,
  });
  return { rules, rootSettings, context, animated };
}

describe('chart departures', () => {
  it('have unique ids, a reason and the charts they change', () => {
    const ids = chartDepartures.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const departure of chartDepartures) {
      expect(departure.why.length, departure.id).toBeGreaterThan(40);
      expect(departure.charts.length, departure.id).toBeGreaterThan(0);
    }
  });

  it('set something when they are theme entries, and describe a convention otherwise', () => {
    for (const departure of chartDepartures) {
      if (departure.kind === 'theme') {
        expect(departure.apply, `${departure.id} has no apply`).toBeDefined();
        expect(departure.convention, departure.id).toBeUndefined();
        const { rules, rootSettings, context } = recorder();
        const motion = context(false);
        departure.apply!(motion);
        const changed = rules.length + rootSettings.length + (motion.themes.length - 1);
        expect(changed, `${departure.id} sets nothing`).toBeGreaterThan(0);
      } else {
        expect(departure.apply, departure.id).toBeUndefined();
        expect(departure.convention, `${departure.id} has no convention`).toBeDefined();
        expect(departure.check, `${departure.id} has no check`).toBeDefined();
      }
    }
  });

  it('leave out the animation theme under reduced motion', () => {
    const { context, animated } = recorder();
    const reduced = context(true);
    const motion = context(false);
    for (const departure of chartDepartures) {
      departure.apply?.(reduced);
      departure.apply?.(motion);
    }
    expect(reduced.themes).not.toContain(animated);
    expect(motion.themes[0]).toBe(animated);
  });

  it('are the only rules the chart theme sets', () => {
    // chartThemes is built from the theme entries; a rule set directly in theme.ts would skip the list and its docs.
    expect(source('./theme.ts')).not.toMatch(/\.rule\(/);
    expect(source('./theme.ts')).toMatch(/for \(const departure of chartDepartures\) departure\.apply\?\.\(context\)/);
  });

  it.each(chartDepartures.filter(({ kind }) => kind === 'convention').flatMap(({ id, charts, check }) => charts.map((chart) => ({ id, chart, check }))))(
    '$chart follows $id',
    ({ chart, check }) => {
      expect(source(`./${chart}.tsx`)).toMatch(check!);
    },
  );
});
