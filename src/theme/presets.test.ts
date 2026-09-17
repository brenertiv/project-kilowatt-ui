import { describe, expect, it } from 'vitest';
import { defaultDarkColors, defaultTheme } from '../tokens';
import {
  KILOWATT_PRESET_ID,
  applyPreset,
  deletePreset,
  isPresetDirty,
  parseStoredTheme,
  resetActivePreset,
  saveActivePreset,
  savePresetAs,
  serializeTheme,
} from './presets';

describe('theme presets', () => {
  it('migrates a v2 store onto Kilowatt as an unsaved working copy', () => {
    const stored = JSON.stringify({
      version: 2,
      colorScheme: 'dark',
      values: { ...defaultTheme, accent: '#FF0000' },
      darkColors: { ...defaultDarkColors, accent: '#00FF00' },
    });

    const state = parseStoredTheme(stored);

    expect(state.colorScheme).toBe('dark');
    expect(state.activePresetId).toBe(KILOWATT_PRESET_ID);
    expect(state.values.accent).toBe('#FF0000');
    expect(state.darkColors.accent).toBe('#00FF00');
    expect(isPresetDirty(state)).toBe(true);
  });

  it('applies a built-in preset and round-trips through storage', () => {
    const teal = applyPreset(parseStoredTheme(null), 'teal');
    const restored = parseStoredTheme(serializeTheme(teal));

    expect(restored.activePresetId).toBe('teal');
    expect(restored.values.accent).toBe('#0B7A75');
    expect(restored.darkColors.accent).toBe('#3DCDC4');
    expect(isPresetDirty(restored)).toBe(false);
  });

  it('saves a custom preset, updates it, and restores Kilowatt on delete', () => {
    const named = savePresetAs(parseStoredTheme(null), ' Night ops ', 'preset-1');
    expect(named.activePresetId).toBe('preset-1');
    expect(named.customPresets[0].name).toBe('Night ops');

    const edited = { ...named, values: { ...named.values, accent: '#111111' } };
    expect(isPresetDirty(edited)).toBe(true);

    const saved = saveActivePreset(edited);
    expect(saved.customPresets[0].values.accent).toBe('#111111');
    expect(isPresetDirty(saved)).toBe(false);

    const deleted = deletePreset(saved, 'preset-1');
    expect(deleted.customPresets).toHaveLength(0);
    expect(deleted.activePresetId).toBe(KILOWATT_PRESET_ID);
    expect(deleted.values.accent).toBe(defaultTheme.accent);
  });

  it('reset restores the selected preset instead of wiping custom saves', () => {
    const named = savePresetAs(
      { ...parseStoredTheme(null), values: { ...defaultTheme, radius: '20px' } },
      'Soft',
      'preset-2',
    );
    const dirtied = { ...named, values: { ...named.values, radius: '0px' } };

    expect(resetActivePreset(dirtied).values.radius).toBe('20px');
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
