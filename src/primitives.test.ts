import { describe, expect, it } from 'vitest';
import {
  cssName,
  colorRamps,
  primitiveCssVars,
  primitiveForColor,
  primitiveValue,
  primitives,
  rampLabel,
  rampNames,
  rampSteps,
  spacingScale,
} from './primitives';
import { colorTokens, defaultDarkColors, defaultTheme } from './tokens';

describe('primitives', () => {
  it('names variables after the Figma path', () => {
    expect(cssName('typography/fontSize/12')).toBe('--typography-font-size-12');
    expect(cssName('spacing/0_5')).toBe('--spacing-0-5');
    expect(primitiveCssVars['--color-brand-500']).toBe('#2ea6e1');
    expect(primitiveCssVars['--spacing-2']).toBe('16px');
    expect(primitiveCssVars['--spacing-0-5']).toBe('4px');
    expect(primitiveCssVars['--radius-md']).toBe('8px');
    expect(primitiveCssVars['--typography-font-size-14']).toBe('14px');
    expect(primitiveCssVars['--typography-font-family-sans']).toBe('Roboto');
    expect(primitiveCssVars['--typography-line-height-tight']).toBe('1.2');
    expect(primitiveCssVars['--typography-letter-spacing-wide']).toBe('0.02em');
    expect(primitiveCssVars['--size-36']).toBe('36px');
    expect(primitiveCssVars['--opacity-40']).toBe('40%');
  });

  it('keeps the steps Figma gives each ramp, without padding or renaming', () => {
    expect(rampSteps('brand')).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
    expect(rampSteps('orange')).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
    for (const ramp of rampNames) expect(colorRamps[ramp].length, ramp).toBeGreaterThanOrEqual(10);
    expect(new Set(primitives.map((p) => p.cssVar)).size).toBe(primitives.length);
  });

  it('reads the spacing scale from Figma, 8px base with half steps', () => {
    expect(spacingScale.slice(0, 5)).toEqual([
      ['0', 0],
      ['0_5', 4],
      ['1', 8],
      ['1_5', 12],
      ['2', 16],
    ]);
  });

  it('resolves a hex back to its ramp step', () => {
    expect(primitiveForColor('#FFFFFF')).toBe('color/slate/50');
    expect(primitiveForColor('#f3f6f9')).toBe('color/slate/200');
    expect(rampLabel('#0d2029')).toBe('navy 800');
    expect(primitiveForColor('#123456')).toBeUndefined();
    expect(primitiveValue('color/navy/900')).toBe('#09161c');
    expect(() => primitiveValue('color/navy/1000')).toThrow(/No primitive/);
  });

  it('builds the semantic colors from ramp steps in both modes', () => {
    for (const id of [
      'backgroundDefault',
      'backgroundLevel1',
      'backgroundPaper',
      'divider',
      'textPrimary',
      'secondaryMain',
      'secondaryTint',
      'track',
      'primaryMain',
    ]) {
      expect(primitiveForColor(defaultTheme[id]), `${id} light`).toBeDefined();
      expect(primitiveForColor(defaultDarkColors[id]), `${id} dark`).toBeDefined();
    }
    const opaque = colorTokens.filter((token) => token.defaultValue.length === 7);
    const fromRamps = opaque.filter((token) => primitiveForColor(token.defaultValue)).length;
    expect(fromRamps).toBe(opaque.length);
  });
});
