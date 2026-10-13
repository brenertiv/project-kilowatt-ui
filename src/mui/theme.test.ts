import { describe, expect, it } from 'vitest';
import { defaultDarkColors, defaultTheme, resolveTheme } from '../tokens';
import { createKilowattTheme } from './theme';

describe('createKilowattTheme', () => {
  it('maps the core tokens onto the Material palette', () => {
    const theme = createKilowattTheme(defaultTheme, 'light');
    expect(theme.palette.mode).toBe('light');
    expect(theme.palette.primary.main.toLowerCase()).toBe(defaultTheme.accent.toLowerCase());
    expect(theme.palette.background.default.toLowerCase()).toBe(defaultTheme.bg.toLowerCase());
    expect(theme.palette.background.paper.toLowerCase()).toBe(defaultTheme.surface.toLowerCase());
    expect(theme.palette.text.primary.toLowerCase()).toBe(defaultTheme.text.toLowerCase());
    expect(theme.palette.divider.toLowerCase()).toBe(defaultTheme.border.toLowerCase());
  });

  it('follows the dark values when the scheme is dark', () => {
    const values = resolveTheme(defaultTheme, defaultDarkColors, 'dark');
    const theme = createKilowattTheme(values, 'dark');
    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.background.default.toLowerCase()).toBe(values.bg.toLowerCase());
    expect(theme.palette.text.primary.toLowerCase()).toBe(values.text.toLowerCase());
  });

  it('reads type, shape and motion from tokens', () => {
    const theme = createKilowattTheme(defaultTheme, 'light');
    expect(theme.typography.fontFamily).toBe(defaultTheme.fontSans);
    expect(theme.typography.h1.fontWeight).toBe(400);
    expect(theme.typography.button.textTransform).toBe('none');
    expect(theme.shape.borderRadius).toBe(Number.parseFloat(defaultTheme.radiusControl));
    expect(theme.spacing(4)).toBe('16px');
    expect(theme.transitions.duration.standard).toBe(150);
    expect(theme.transitions.easing.easeOut).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });

  it('rebuilds from edited values', () => {
    const theme = createKilowattTheme({ ...defaultTheme, accent: '#ff0000', radiusControl: '12px' }, 'light');
    expect(theme.palette.primary.main).toBe('#ff0000');
    expect(theme.shape.borderRadius).toBe(12);
  });
});
