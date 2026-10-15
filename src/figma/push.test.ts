import { describe, expect, it } from 'vitest';
import { tokens, type Token } from '../tokens';
import { codeVariableName, pushEntries, pushPlan, pushScript } from './push';
import type { FigmaSnapshot } from './snapshot';

const stub = (id: string, cssVar: string, light: string, dark: string): Token => ({
  id,
  cssVar,
  label: id,
  group: 'Color',
  type: 'color',
  primitive: { light, dark },
  defaultValue: '#000000',
  darkValue: '#ffffff',
});

const entries = pushEntries([
  stub('chart1', '--chart-1', 'color/brand/400', 'color/brand/600'),
  stub('track', '--track', 'color/slate/700', 'color/navy/600'),
  { id: 'fontSans', cssVar: '--font-sans', label: 'Font', group: 'Typography', type: 'font', defaultValue: 'Roboto' },
  {
    id: 'textPrimary',
    cssVar: '--text-primary',
    label: 'Text',
    group: 'Color',
    type: 'color',
    figma: 'color/text/primary',
    defaultValue: '#000000',
  },
]);

const snapshot: FigmaSnapshot = {
  fileKey: 'k',
  fetchedAt: '2026-10-14T00:00:00.000Z',
  collections: {
    primitives: {
      modes: ['Value'],
      variables: {
        'color/brand/400': { type: 'COLOR', values: { Value: '#51b5e6' } },
        'color/brand/600': { type: 'COLOR', values: { Value: '#2585b4' } },
        'color/brand/700': { type: 'COLOR', values: { Value: '#1c6487' } },
      },
    },
    code: {
      modes: ['Light', 'Dark'],
      variables: {
        'chart/1': {
          type: 'COLOR',
          values: { Light: { alias: 'primitives/color/brand/400' }, Dark: { alias: 'primitives/color/brand/700' } },
        },
        'chart/9': { type: 'COLOR', values: { Light: '#000000', Dark: '#000000' } },
      },
    },
  },
};

describe('push to Figma', () => {
  it('names code variables after the CSS variable and keeps only code-owned colors', () => {
    expect(codeVariableName(stub('x', '--utility-electricity', 'a', 'b'))).toBe('utility/electricity');
    expect(entries.map((entry) => entry.name)).toEqual(['chart/1', 'track']);
  });

  it('compares each entry with the snapshot and lists leftovers', () => {
    const plan = pushPlan(entries, snapshot);
    expect(plan.entries.map((entry) => [entry.name, entry.status])).toEqual([
      ['chart/1', 'changed'],
      ['track', 'missing'],
    ]);
    expect(plan.entries[0].figmaDark).toBe('color/brand/700');
    expect(plan.extras).toEqual(['chart/9']);
    expect(plan.pending).toBe(2);
    expect(
      pushPlan(entries, { ...snapshot, collections: { primitives: snapshot.collections.primitives } }).entries.every(
        (e) => e.status === 'missing',
      ),
    ).toBe(true);
  });

  it('emits a script with one row per entry that aliases primitives', () => {
    const script = pushScript(entries);
    expect(script).toContain('["chart/1","color/brand/400","color/brand/600"]');
    expect(script).toContain('["track","color/slate/700","color/navy/600"]');
    expect(script).toContain('createVariableAlias');
    expect(script).toContain("renameMode(code.modes[0].modeId, 'Light')");
  });

  it('declares every code-owned token of the system as a primitive step in both modes', () => {
    const real = pushEntries(tokens);
    expect(real.length).toBeGreaterThanOrEqual(19);
    for (const entry of real) {
      expect(entry.light, entry.name).toMatch(/^color\//);
      expect(entry.dark, entry.name).toMatch(/^color\//);
    }
  });
});
