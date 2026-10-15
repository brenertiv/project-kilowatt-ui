import { describe, expect, it } from 'vitest';
import { measureContrast } from '../designSystem/contrast';
import { defaultDarkColors, defaultTheme } from '../tokens';
import { isThemeDirty, parseStoredTheme, resetTheme, serializeTheme } from './presets';

describe('theme state', () => {
  it('starts from the Foundations palette', () => {
    const state = parseStoredTheme(null);

    expect(state.colorScheme).toBe('light');
    expect(state.values.backgroundDefault).toBe('#edf1f5');
    expect(state.values.secondaryMain).toBe('#2ea6e1');
    expect(state.values.secondaryContrastText).toBe('#09161c');
    expect(state.values.successMain).toBe('#0a8864');
    expect(state.values.errorMain).toBe('#c51f1c');
    expect(state.values.warningMain).toBe('#fb9c3a');
    expect(state.darkColors.backgroundDefault).toBe('#09161c');
    expect(state.darkColors.divider).toBe('#1b3e4f');
    expect(state.darkColors.secondaryMain).toBe('#51b5e6');
    expect(state.darkColors.errorMain).toBe('#fb594c');
    expect(state.darkColors.warningMain).toBe('#ffb44c');
    expect(measureContrast(state.values.warningMain, state.values.backgroundPaper, 'normal')?.level).toBe('fail');
    expect(measureContrast(state.values.errorMain, state.values.backgroundPaper, 'normal')?.level).not.toBe('fail');
    expect(measureContrast(state.values.textPrimary, state.values.backgroundPaper, 'normal')?.level).not.toBe('fail');
    expect(measureContrast(state.values.textSecondary, state.values.backgroundPaper, 'normal')?.level).not.toBe('fail');
    expect(measureContrast(state.values.secondaryContrastText, state.values.secondaryMain, 'ui')?.level).not.toBe(
      'fail',
    );
    expect(measureContrast(state.darkColors.textPrimary, state.darkColors.backgroundPaper, 'normal')?.level).not.toBe(
      'fail',
    );
    expect(
      measureContrast(state.darkColors.secondaryContrastText, state.darkColors.secondaryMain, 'ui')?.level,
    ).not.toBe('fail');
    expect(isThemeDirty(state)).toBe(false);
  });

  it('round-trips edited tokens through storage', () => {
    const edited = {
      ...parseStoredTheme(null),
      colorScheme: 'dark' as const,
      values: { ...defaultTheme, secondaryMain: '#111111' },
      darkColors: { ...defaultDarkColors, secondaryMain: '#EEEEEE' },
    };

    const restored = parseStoredTheme(serializeTheme(edited));

    expect(restored.colorScheme).toBe('dark');
    expect(restored.values.secondaryMain).toBe('#111111');
    expect(restored.darkColors.secondaryMain).toBe('#EEEEEE');
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
      values: { ...defaultTheme, secondaryMain: '#FF0000' },
      darkColors: { ...defaultDarkColors, secondaryMain: '#00FF00' },
    });

    const state = parseStoredTheme(stored);

    expect(state.colorScheme).toBe('dark');
    expect(state.values.secondaryMain).toBe('#FF0000');
    expect(state.darkColors.secondaryMain).toBe('#00FF00');
    expect(state).not.toHaveProperty('activePresetId');
    expect(state).not.toHaveProperty('customPresets');
    expect(isThemeDirty(state)).toBe(true);
  });

  it('reset returns edited tokens to Foundations', () => {
    const edited = {
      ...parseStoredTheme(null),
      colorScheme: 'dark' as const,
      values: { ...defaultTheme, radius: '20px', secondaryMain: '#111111' },
    };

    const reset = resetTheme(edited);

    expect(reset.colorScheme).toBe('dark');
    expect(reset.values.radius).toBe(defaultTheme.radius);
    expect(reset.values.secondaryMain).toBe('#2ea6e1');
    expect(reset.darkColors.backgroundDefault).toBe('#09161c');
    expect(isThemeDirty(reset)).toBe(false);
  });

  it('migrates a stored fontFamily onto Font Sans', () => {
    const fontKeys = ['fontSans', 'fontSerif', 'fontMono'];
    const legacyTokens = Object.fromEntries(Object.entries(defaultTheme).filter(([key]) => !fontKeys.includes(key)));
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
