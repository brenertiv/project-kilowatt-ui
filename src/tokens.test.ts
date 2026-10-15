import { describe, expect, it } from 'vitest';
import {
  defaultDarkColors,
  defaultTheme,
  coreTokens,
  resolveTheme,
  semanticTokens,
  isCoreTokenId,
  themeToCssText,
  themeToCssVars,
  derivedTokens,
  fontSizeTokens,
  tokens,
  typeScale,
  type ThemeValues,
} from './tokens';
import { breakpointCssVars } from './breakpoints';
import { primitiveCssVars } from './primitives';

describe('theme tokens', () => {
  it('resolves dark colors independently of the light palette', () => {
    const light: ThemeValues = { ...defaultTheme, backgroundDefault: '#FF0000' };
    const dark = { ...defaultDarkColors, backgroundDefault: '#00FF00' };

    expect(resolveTheme(light, dark, 'light').backgroundDefault).toBe('#FF0000');
    expect(resolveTheme(light, dark, 'dark').backgroundDefault).toBe('#00FF00');
    expect(resolveTheme(light, dark, 'dark').fontSans).toBe(light.fontSans);
  });

  it('exports light and dark color blocks', () => {
    const css = themeToCssText(defaultTheme, defaultDarkColors);

    expect(css).toContain(':root {');
    expect(css).toContain('html.dark {');
    expect(css).toContain('--background-default: #edf1f5;');
    expect(css).toContain('--background-default: #09161c;');
  });

  it('documents every CSS variable themeToCssVars emits', () => {
    const vars = themeToCssVars(defaultTheme, 'light');
    const documented = new Set([
      ...tokens.map((token) => token.cssVar),
      ...derivedTokens.map((token) => token.cssVar),
      ...Object.keys(breakpointCssVars),
      ...Object.keys(primitiveCssVars),
    ]);

    expect(Object.keys(vars).sort()).toEqual([...documented].sort());
  });

  it('resolves space aliases from the editable tokens', () => {
    const vars = themeToCssVars({ ...defaultTheme, space: '10px', gap: '14px' }, 'light');

    expect(vars['--space-2']).toBe('10px');
    expect(vars['--space-3']).toBe('14px');
    expect(vars['--space-1']).toBe('4px');
    expect(vars['--radius-inner']).toBe('4px');
    expect(vars['--spacing-component-sm']).toBe('10px');
    expect(vars['--spacing-layout-md']).toBe('24px');
  });

  it('exposes sans, serif, and mono families without a font-family alias', () => {
    const customSans = '"IBM Plex Sans", system-ui, sans-serif';
    const vars = themeToCssVars({ ...defaultTheme, fontSans: customSans }, 'light');

    expect(vars['--font-sans']).toBe(customSans);
    expect(vars['--font-serif']).toBe(defaultTheme.fontSerif);
    expect(vars['--font-mono']).toBe(defaultTheme.fontMono);
    expect(vars).not.toHaveProperty('--font-family');
  });

  it('declares each type size once and derives fluid and semantic sizes from it', () => {
    const vars = themeToCssVars(defaultTheme, 'light');
    const fixed = typeScale.map((step) => vars[step.cssVar]);

    expect(fixed).toEqual([
      '0.625rem',
      '0.75rem',
      '0.875rem',
      '1rem',
      '1.125rem',
      '1.375rem',
      '1.75rem',
      '2.125rem',
      '2.75rem',
    ]);
    expect(new Set(fixed).size).toBe(fixed.length);
    expect(vars['--text-xl-fluid']).toBe('clamp(1.25rem, 1.1rem + 0.5vw, var(--text-xl))');
    expect(vars['--text-4xl-fluid']).toBe('clamp(2.25rem, 1.7rem + 1.8vw, var(--text-4xl))');
    expect(vars).not.toHaveProperty('--text-lg-fluid');

    for (const token of fontSizeTokens) {
      const source = vars[token.cssVar].match(/^var\((--text-[\w-]+)\)$/)?.[1];
      expect(source && vars[source]).toBeTruthy();
    }
    expect(vars['--font-size']).toBe('var(--text-sm)');
    expect(vars['--font-size-title']).toBe('var(--text-xl-fluid)');
  });

  it('separates core tokens from semantic tokens', () => {
    expect(coreTokens.map((token) => token.id)).toEqual([
      'backgroundDefault',
      'textPrimary',
      'secondaryMain',
      'successMain',
      'warningMain',
      'errorMain',
      'fontSans',
      'fontSerif',
      'fontMono',
      'radius',
      'controlHeight',
      'shadow',
      'space',
    ]);
    expect(semanticTokens.map((token) => token.id)).toContain('backgroundPaper');
    expect(semanticTokens.map((token) => token.id)).toContain('secondaryContrastText');
    expect(semanticTokens.map((token) => token.id)).toContain('cardPad');
    expect(isCoreTokenId('actionHover')).toBe(false);
    expect(isCoreTokenId('secondaryMain')).toBe(true);
  });
});
