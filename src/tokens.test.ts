import { describe, expect, it } from 'vitest';
import {
  defaultDarkColors,
  defaultTheme,
  primitiveTokens,
  resolveTheme,
  semanticTokens,
  isPrimitiveTokenId,
  themeToCssText,
  themeToCssVars,
  derivedTokens,
  tokens,
  type ThemeValues,
} from './tokens';
import { breakpointCssVars } from './breakpoints';

describe('theme tokens', () => {
  it('resolves dark colors independently of the light palette', () => {
    const light: ThemeValues = { ...defaultTheme, bg: '#FF0000' };
    const dark = { ...defaultDarkColors, bg: '#00FF00' };

    expect(resolveTheme(light, dark, 'light').bg).toBe('#FF0000');
    expect(resolveTheme(light, dark, 'dark').bg).toBe('#00FF00');
    expect(resolveTheme(light, dark, 'dark').fontSize).toBe(light.fontSize);
  });

  it('exports light and dark color blocks', () => {
    const css = themeToCssText(defaultTheme, defaultDarkColors);

    expect(css).toContain(':root {');
    expect(css).toContain('html.dark {');
    expect(css).toContain('--color-bg: #F6F7F8;');
    expect(css).toContain('--color-bg: #121316;');
  });

  it('documents every CSS variable themeToCssVars emits', () => {
    const vars = themeToCssVars(defaultTheme, 'light');
    const documented = new Set([
      ...tokens.map((token) => token.cssVar),
      ...derivedTokens.map((token) => token.cssVar),
      ...Object.keys(breakpointCssVars),
    ]);

    expect(Object.keys(vars).sort()).toEqual([...documented].sort());
  });

  it('resolves space aliases from the editable tokens', () => {
    const vars = themeToCssVars({ ...defaultTheme, space: '10px', gap: '14px' }, 'light');

    expect(vars['--space-2']).toBe('10px');
    expect(vars['--space-3']).toBe('14px');
    expect(vars['--space-1']).toBe('4px');
    expect(vars['--radius-inner']).toBe('6px');
  });

  it('separates primary variables from semantic tokens', () => {
    expect(primitiveTokens.map((token) => token.id)).toEqual([
      'bg',
      'text',
      'accent',
      'positive',
      'fontFamily',
      'radius',
      'controlHeight',
      'shadow',
      'space',
    ]);
    expect(semanticTokens.map((token) => token.id)).toContain('surface');
    expect(semanticTokens.map((token) => token.id)).toContain('onAccent');
    expect(semanticTokens.map((token) => token.id)).toContain('fontSize');
    expect(semanticTokens.map((token) => token.id)).toContain('cardPad');
    expect(isPrimitiveTokenId('hover')).toBe(false);
    expect(isPrimitiveTokenId('accent')).toBe(true);
  });
});
