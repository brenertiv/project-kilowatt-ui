import { describe, expect, it } from 'vitest';
import { colorRamps, isDerivedStep, primitiveCssVars, primitiveForColor, primitives, rampLabel, rampSteps } from './primitives';
import { colorTokens, defaultDarkColors, defaultTheme } from './tokens';

describe('primitives', () => {
  it('names variables after the Figma path', () => {
    expect(primitiveCssVars['--color-brand-600']).toBe('#2EA6E1');
    expect(primitiveCssVars['--spacing-4']).toBe('16px');
    expect(primitiveCssVars['--radius-md']).toBe('8px');
    expect(primitiveCssVars['--typography-font-size-sm']).toBe('14px');
    expect(primitiveCssVars['--typography-line-height-tight']).toBe('1.2');
    expect(primitiveCssVars['--size-36']).toBe('36px');
  });

  it('gives every ramp the same eleven steps, 50 to 950', () => {
    for (const steps of Object.values(colorRamps)) {
      expect(steps.map(([step]) => step)).toEqual([...rampSteps]);
    }
    expect(new Set(primitives.map((p) => p.cssVar)).size).toBe(primitives.length);
  });

  it('marks only synthesized tints as derived and keeps Figma steps first in lookups', () => {
    expect(isDerivedStep('brand', 50)).toBe(true);
    expect(isDerivedStep('brand', 100)).toBe(false);
    expect(isDerivedStep('orange', 50)).toBe(false);
    expect(primitiveForColor('#FFFFFF')).toBe('color/slate/100');
  });

  it('resolves a hex back to its ramp step', () => {
    expect(primitiveForColor('#f3f6f9')).toBe('color/slate/300');
    expect(rampLabel('#0D212A')).toBe('navy 950');
    expect(primitiveForColor('#123456')).toBeUndefined();
  });

  it('builds surface, border, text and accent semantics from ramp steps in both modes', () => {
    for (const id of ['bg', 'surfaceSunken', 'surface', 'border', 'text', 'accent', 'accentTint', 'hover', 'track', 'solid']) {
      expect(primitiveForColor(defaultTheme[id]), `${id} light`).toBeDefined();
      expect(primitiveForColor(defaultDarkColors[id]), `${id} dark`).toBeDefined();
    }
    const fromRamps = colorTokens.filter((token) => primitiveForColor(token.defaultValue)).length;
    expect(fromRamps).toBeGreaterThanOrEqual(colorTokens.length - 8);
  });
});
