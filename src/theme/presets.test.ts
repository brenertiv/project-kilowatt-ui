import { describe, expect, it } from 'vitest';
import { measureContrast } from '../designSystem/contrast';
import { defaultDarkColors, defaultTheme } from '../tokens';
import { isThemeDirty, parseStoredTheme, resetTheme, serializeTheme } from './presets';

describe('theme state', () => {
  it('starts from the Foundations palette', () => {
    const state = parseStoredTheme(null);

    expect(state.colorScheme).toBe('light');
    expect(state.values.bg).toBe('#F9FAFC');
    expect(state.values.accent).toBe('#2EA6E1');
    expect(state.values.onAccent).toBe('#0D212A');
    expect(state.values.positive).toBe('#008459');
    expect(state.values.negative).toBe('#D61A1A');
    expect(state.values.warning).toBe('#E16A2E');
    expect(state.darkColors.bg).toBe('#0D212A');
    expect(state.darkColors.border).toBe('#1B3E4F');
    expect(state.darkColors.accent).toBe('#51B5E6');
    expect(state.darkColors.negative).toBe('#FF7A7A');
    expect(state.darkColors.warning).toBe('#F48E36');
    expect(measureContrast(state.values.warning, state.values.surface, 'normal')?.level).toBe('fail');
    expect(measureContrast(state.darkColors.warning, state.darkColors.surface, 'normal')?.level).not.toBe('fail');
    expect(measureContrast(state.values.negative, state.values.surface, 'normal')?.level).not.toBe('fail');
    expect(measureContrast(state.darkColors.negative, state.darkColors.surface, 'normal')?.level).not.toBe('fail');
    expect(measureContrast(state.values.text, state.values.surface, 'normal')?.level).not.toBe('fail');
    expect(measureContrast(state.values.textSecondary, state.values.surface, 'normal')?.level).not.toBe('fail');
    expect(measureContrast(state.values.onAccent, state.values.accent, 'ui')?.level).not.toBe('fail');
    expect(measureContrast(state.darkColors.text, state.darkColors.surface, 'normal')?.level).not.toBe('fail');
    expect(measureContrast(state.darkColors.onAccent, state.darkColors.accent, 'ui')?.level).not.toBe('fail');
    expect(isThemeDirty(state)).toBe(false);
  });

  it('round-trips edited tokens through storage', () => {
    const edited = {
      ...parseStoredTheme(null),
      colorScheme: 'dark' as const,
      values: { ...defaultTheme, accent: '#111111' },
      darkColors: { ...defaultDarkColors, accent: '#EEEEEE' },
    };

    const restored = parseStoredTheme(serializeTheme(edited));

    expect(restored.colorScheme).toBe('dark');
    expect(restored.values.accent).toBe('#111111');
    expect(restored.darkColors.accent).toBe('#EEEEEE');
    expect(restored).not.toHaveProperty('activePresetId');
    expect(restored).not.toHaveProperty('customPresets');
    expect(isThemeDirty(restored)).toBe(true);
  });

  it('keeps token values from an old preset payload and drops preset ids', () => {
    const stored = JSON.stringify({
      version: 3,
      colorScheme: 'dark',
      activePresetId: 'teal',
      customPresets: [{ id: 'night', name: 'Night ops', values: defaultTheme, darkColors: defaultDarkColors }],
      values: { ...defaultTheme, accent: '#FF0000' },
      darkColors: { ...defaultDarkColors, accent: '#00FF00' },
    });

    const state = parseStoredTheme(stored);

    expect(state.colorScheme).toBe('dark');
    expect(state.values.accent).toBe('#FF0000');
    expect(state.darkColors.accent).toBe('#00FF00');
    expect(state).not.toHaveProperty('activePresetId');
    expect(state).not.toHaveProperty('customPresets');
    expect(isThemeDirty(state)).toBe(true);
  });

  it('reset returns edited tokens to Foundations', () => {
    const edited = {
      ...parseStoredTheme(null),
      colorScheme: 'dark' as const,
      values: { ...defaultTheme, radius: '20px', accent: '#111111' },
    };

    const reset = resetTheme(edited);

    expect(reset.colorScheme).toBe('dark');
    expect(reset.values.radius).toBe(defaultTheme.radius);
    expect(reset.values.accent).toBe('#2EA6E1');
    expect(reset.darkColors.bg).toBe('#0D212A');
    expect(isThemeDirty(reset)).toBe(false);
  });

  it('migrates a stored fontFamily onto Font Sans', () => {
    const { fontSans: _sans, fontSerif: _serif, fontMono: _mono, ...legacyTokens } = defaultTheme;
    const stored = JSON.stringify({
      version: 2,
      values: { ...legacyTokens, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' },
      darkColors: defaultDarkColors,
    });

    const state = parseStoredTheme(stored);

    expect(state.values.fontSans).toBe('"IBM Plex Sans", system-ui, sans-serif');
    expect(state.values.fontSerif).toBe(defaultTheme.fontSerif);
    expect(state.values.fontMono).toBe(defaultTheme.fontMono);
    expect(Object.keys(state.values)).not.toContain('fontFamily');
  });
});
