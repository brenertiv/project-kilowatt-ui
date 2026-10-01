import { defaultDarkColors, defaultTheme, type ColorScheme, type ThemeValues } from '../tokens';

export type ThemeSnapshot = {
  values: ThemeValues;
  darkColors: Record<string, string>;
};

export type ThemeState = ThemeSnapshot & {
  colorScheme: ColorScheme;
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

export function defaultThemeState(): ThemeState {
  return {
    colorScheme: 'light',
    values: { ...defaultTheme },
    darkColors: { ...defaultDarkColors },
  };
}

function isColorScheme(value: unknown): value is ColorScheme {
  return value === 'light' || value === 'dark';
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

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;

  const record = parsed as Record<string, unknown>;
  const colorScheme = isColorScheme(record.colorScheme) ? record.colorScheme : 'light';
  const version = record.version;
  const hasEnvelope = version === 2 || version === 3 || version === 4;
  const values = (hasEnvelope ? record.values : parsed) as ThemeValues | undefined;
  const darkColors = hasEnvelope ? (record.darkColors as Record<string, string> | undefined) : undefined;
  if (!values || typeof values !== 'object') return { ...fallback, colorScheme };

  return {
    colorScheme,
    ...cloneSnapshot({ values, darkColors: darkColors ?? defaultDarkColors }),
  };
}

export function serializeTheme(state: ThemeState): string {
  return JSON.stringify({
    version: 4,
    colorScheme: state.colorScheme,
    values: state.values,
    darkColors: state.darkColors,
  });
}

export function isThemeDirty(state: ThemeState) {
  return !snapshotsEqual(state, { values: defaultTheme, darkColors: defaultDarkColors });
}

export function resetTheme(state: ThemeState): ThemeState {
  return { ...defaultThemeState(), colorScheme: state.colorScheme };
}
