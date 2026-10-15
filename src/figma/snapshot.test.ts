import { describe, expect, it } from 'vitest';
import {
  figmaAliasTarget,
  figmaColor,
  figmaNumber,
  figmaSnapshot,
  figmaString,
  figmaVariables,
  resolveFigma,
  type FigmaSnapshot,
} from './snapshot';

const sample: FigmaSnapshot = {
  fileKey: 'abc',
  fetchedAt: '2026-10-14T00:00:00.000Z',
  collections: {
    primitives: {
      modes: ['Value'],
      variables: {
        'color/navy/900': { type: 'COLOR', values: { Value: '#09161c' } },
        'color/slate/100': { type: 'COLOR', values: { Value: '#f9fafc' } },
        'color/transparent': { type: 'COLOR', values: { Value: '#ffffff00' } },
        'spacing/1': { type: 'FLOAT', values: { Value: 8 } },
        'typography/fontFamily/sans': { type: 'STRING', values: { Value: 'Roboto' } },
      },
    },
    color: {
      modes: ['Light', 'Dark'],
      variables: {
        'text/primary': {
          type: 'COLOR',
          values: { Light: { alias: 'primitives/color/navy/900' }, Dark: { alias: 'primitives/color/slate/100' } },
        },
        'action/hover': {
          type: 'COLOR',
          values: {
            Light: { alias: 'primitives/color/navy/900', opacity: 8 },
            Dark: { alias: 'primitives/color/slate/100', opacity: 8 },
          },
        },
        'legacy/text': {
          type: 'COLOR',
          values: { Light: { alias: 'color/text/primary' }, Dark: { alias: 'color/text/primary' } },
        },
        loop: { type: 'COLOR', values: { Light: { alias: 'color/loop' }, Dark: { alias: 'color/loop' } } },
      },
    },
  },
};

describe('figma snapshot reader', () => {
  it('resolves raw values and follows aliases per mode', () => {
    expect(figmaColor('primitives/color/navy/900', undefined, sample)).toBe('#09161c');
    expect(figmaColor('color/text/primary', 'Light', sample)).toBe('#09161c');
    expect(figmaColor('color/text/primary', 'Dark', sample)).toBe('#f9fafc');
    expect(figmaColor('color/legacy/text', 'Dark', sample)).toBe('#f9fafc');
    expect(figmaNumber('primitives/spacing/1', 'Dark', sample)).toBe(8);
    expect(figmaString('primitives/typography/fontFamily/sans', undefined, sample)).toBe('Roboto');
  });

  it('multiplies alias opacity into the alpha channel', () => {
    expect(figmaColor('color/action/hover', 'Light', sample)).toBe('#09161c14');
    expect(figmaColor('primitives/color/transparent', undefined, sample)).toBe('#ffffff00');
  });

  it('names the alias chain target', () => {
    expect(figmaAliasTarget('color/legacy/text', 'Dark', sample)).toBe('primitives/color/slate/100');
    expect(figmaAliasTarget('primitives/color/navy/900', undefined, sample)).toBeUndefined();
  });

  it('lists variables by prefix', () => {
    expect(figmaVariables('primitives', 'color/', sample).map(([name]) => name)).toEqual([
      'color/navy/900',
      'color/slate/100',
      'color/transparent',
    ]);
    expect(figmaVariables('missing', '', sample)).toEqual([]);
  });

  it('fails loudly on missing paths, type mismatches and loops', () => {
    expect(() => resolveFigma('color/nope', 'Light', sample)).toThrow(/not in the snapshot/);
    expect(() => resolveFigma('nope', 'Light', sample)).toThrow(/collection prefix/);
    expect(() => figmaNumber('color/text/primary', 'Light', sample)).toThrow(/not a number/);
    expect(() => figmaColor('primitives/spacing/1', undefined, sample)).toThrow(/not a color/);
    expect(() => resolveFigma('color/loop', 'Light', sample)).toThrow(/alias loop/);
  });

  it('ships a snapshot of the linked file with the collections the system reads', () => {
    expect(figmaSnapshot.fileKey).toBeTruthy();
    expect(Object.keys(figmaSnapshot.collections)).toEqual(expect.arrayContaining(['primitives', 'color']));
    expect(figmaSnapshot.collections.color.modes).toEqual(['Light', 'Dark']);
  });
});
