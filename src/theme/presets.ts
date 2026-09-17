import { defaultDarkColors, defaultTheme, type ColorScheme, type ThemeValues } from '../tokens';

export const KILOWATT_PRESET_ID = 'kilowatt';

export type ThemeSnapshot = {
  values: ThemeValues;
  darkColors: Record<string, string>;
};

export type ThemePreset = ThemeSnapshot & {
  id: string;
  name: string;
  builtIn: boolean;
};

export type ThemeState = ThemeSnapshot & {
  colorScheme: ColorScheme;
  activePresetId: string;
  customPresets: ThemePreset[];
};

type StoredCustomPreset = {
  id: string;
  name: string;
  values: ThemeValues;
  darkColors: Record<string, string>;
};

type StoredThemeV3 = {
  version: 3;
  colorScheme: ColorScheme;
  activePresetId: string;
  values: ThemeValues;
  darkColors: Record<string, string>;
  customPresets: StoredCustomPreset[];
};

type LegacyThemeValues = ThemeValues & { fontFamily?: string };

function hydrateValues(raw: ThemeValues | LegacyThemeValues | undefined): ThemeValues {
  const incoming = raw ?? {};
  const merged = { ...defaultTheme, ...incoming };
  if (incoming.fontFamily && incoming.fontSans === undefined) {
    merged.fontSans = incoming.fontFamily;
  }
  return Object.fromEntries(
    Object.keys(defaultTheme).map((id) => [
      id,
      merged[id as keyof ThemeValues] ?? defaultTheme[id as keyof ThemeValues],
    ]),
  ) as ThemeValues;
}

export function cloneSnapshot(snapshot: ThemeSnapshot): ThemeSnapshot {
  return {
    values: hydrateValues(snapshot.values),
    darkColors: { ...defaultDarkColors, ...snapshot.darkColors },
  };
}

export function snapshotsEqual(a: ThemeSnapshot, b: ThemeSnapshot) {
  return JSON.stringify(cloneSnapshot(a)) === JSON.stringify(cloneSnapshot(b));
}

export function getBuiltInPresets(): ThemePreset[] {
  return [
    {
      id: KILOWATT_PRESET_ID,
      name: 'Kilowatt',
      builtIn: true,
      ...cloneSnapshot({ values: defaultTheme, darkColors: defaultDarkColors }),
    },
    {
      id: 'teal',
      name: 'Teal',
      builtIn: true,
      values: { ...defaultTheme, accent: '#0B7A75', accentTint: '#E6F4F3' },
      darkColors: { ...defaultDarkColors, accent: '#3DCDC4', accentTint: '#143230' },
    },
  ];
}

export function listPresets(customPresets: ThemePreset[]) {
  return [...getBuiltInPresets(), ...customPresets];
}

export function findPreset(customPresets: ThemePreset[], id: string) {
  return listPresets(customPresets).find((preset) => preset.id === id);
}

export function defaultThemeState(): ThemeState {
  const kilowatt = getBuiltInPresets()[0];
  return {
    colorScheme: 'light',
    activePresetId: kilowatt.id,
    customPresets: [],
    values: { ...kilowatt.values },
    darkColors: { ...kilowatt.darkColors },
  };
}

function isColorScheme(value: unknown): value is ColorScheme {
  return value === 'light' || value === 'dark';
}

function hydrateCustomPreset(raw: StoredCustomPreset): ThemePreset | null {
  if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
  const name = raw.name.trim();
  if (!raw.id || !name) return null;
  const snapshot = cloneSnapshot({ values: raw.values, darkColors: raw.darkColors });
  return { id: raw.id, name, builtIn: false, ...snapshot };
}

export function parseStoredTheme(raw: string | null): ThemeState {
  const fallback = defaultThemeState();
  if (!raw) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }

  if (!parsed || typeof parsed !== 'object') return fallback;

  const record = parsed as Record<string, unknown>;
  const colorScheme = isColorScheme(record.colorScheme) ? record.colorScheme : 'light';

  if (record.version === 3) {
    const customPresets = Array.isArray(record.customPresets)
      ? record.customPresets
          .map((item) => hydrateCustomPreset(item as StoredCustomPreset))
          .filter((item): item is ThemePreset => item !== null)
      : [];
    const snapshot = cloneSnapshot({
      values: (record.values as ThemeValues) ?? fallback.values,
      darkColors: (record.darkColors as Record<string, string>) ?? fallback.darkColors,
    });
    const activePresetId =
      typeof record.activePresetId === 'string' && findPreset(customPresets, record.activePresetId)
        ? record.activePresetId
        : KILOWATT_PRESET_ID;
    return { colorScheme, activePresetId, customPresets, ...snapshot };
  }

  const values = record.version === 2 ? (record.values as ThemeValues) : (parsed as ThemeValues);
  const darkColors = record.version === 2 ? (record.darkColors as Record<string, string>) : undefined;
  return {
    colorScheme,
    activePresetId: KILOWATT_PRESET_ID,
    customPresets: [],
    ...cloneSnapshot({ values, darkColors: darkColors ?? defaultDarkColors }),
  };
}

export function serializeTheme(state: ThemeState): string {
  const payload: StoredThemeV3 = {
    version: 3,
    colorScheme: state.colorScheme,
    activePresetId: state.activePresetId,
    values: state.values,
    darkColors: state.darkColors,
    customPresets: state.customPresets.map(({ id, name, values, darkColors }) => ({ id, name, values, darkColors })),
  };
  return JSON.stringify(payload);
}

export function isPresetDirty(state: ThemeState) {
  const preset = findPreset(state.customPresets, state.activePresetId);
  if (!preset) return true;
  return !snapshotsEqual(state, preset);
}

export function applyPreset(state: ThemeState, id: string): ThemeState {
  const preset = findPreset(state.customPresets, id);
  if (!preset) return state;
  const snapshot = cloneSnapshot(preset);
  return { ...state, activePresetId: preset.id, values: snapshot.values, darkColors: snapshot.darkColors };
}

export function saveActivePreset(state: ThemeState): ThemeState {
  const preset = findPreset(state.customPresets, state.activePresetId);
  if (!preset || preset.builtIn) return state;
  const snapshot = cloneSnapshot(state);
  return {
    ...state,
    customPresets: state.customPresets.map((item) => (item.id === preset.id ? { ...item, ...snapshot } : item)),
  };
}

export function savePresetAs(state: ThemeState, name: string, id: string): ThemeState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  const snapshot = cloneSnapshot(state);
  const next: ThemePreset = { id, name: trimmed, builtIn: false, ...snapshot };
  return { ...state, activePresetId: id, customPresets: [...state.customPresets, next] };
}

export function deletePreset(state: ThemeState, id: string): ThemeState {
  const preset = state.customPresets.find((item) => item.id === id);
  if (!preset) return state;
  const customPresets = state.customPresets.filter((item) => item.id !== id);
  if (state.activePresetId !== id) return { ...state, customPresets };
  return applyPreset({ ...state, customPresets }, KILOWATT_PRESET_ID);
}

export function resetActivePreset(state: ThemeState): ThemeState {
  return applyPreset(state, state.activePresetId);
}
