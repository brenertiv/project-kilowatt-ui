import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  colorTokens,
  isPrimitiveTokenId,
  resolveTheme,
  themeToCssText,
  themeToCssVars,
  type ColorScheme,
  type ThemeValues,
} from '../tokens';
import { isThemeDirty, parseStoredTheme, resetTheme, serializeTheme, type ThemeState } from './presets';

const STORAGE_KEY = 'kilowatt-theme';

function loadTheme(): ThemeState {
  try {
    return parseStoredTheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    return parseStoredTheme(null);
  }
}

function persist(state: ThemeState) {
  localStorage.setItem(STORAGE_KEY, serializeTheme(state));
}

function applyCssVars(values: ThemeValues, scheme: ColorScheme) {
  const root = document.documentElement;
  const vars = themeToCssVars(values, scheme);
  const next = new Set(Object.keys(vars));
  for (let index = root.style.length - 1; index >= 0; index -= 1) {
    const name = root.style.item(index);
    if (name.startsWith('--') && !next.has(name)) {
      root.style.removeProperty(name);
    }
  }
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
  root.classList.toggle('dark', scheme === 'dark');
  root.style.setProperty('color-scheme', scheme);
}

function withoutThemeTransitions(apply: () => void) {
  const root = document.documentElement;
  root.classList.add('theme-changing');
  apply();
  void root.offsetHeight;
  requestAnimationFrame(() => {
    root.classList.remove('theme-changing');
  });
}

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  values: ThemeValues;
  lightValues: ThemeValues;
  darkColors: Record<string, string>;
  setToken: (id: string, value: string) => void;
  dirty: boolean;
  reset: () => void;
  exportCss: () => string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(loadTheme);
  const previousScheme = useRef(state.colorScheme);
  const activeValues = useMemo(
    () => resolveTheme(state.values, state.darkColors, state.colorScheme),
    [state.values, state.darkColors, state.colorScheme],
  );
  const dirty = isThemeDirty(state);

  useLayoutEffect(() => {
    const apply = () => applyCssVars(activeValues, state.colorScheme);
    if (previousScheme.current !== state.colorScheme) {
      previousScheme.current = state.colorScheme;
      withoutThemeTransitions(apply);
      return;
    }
    apply();
  }, [activeValues, state.colorScheme]);

  function commit(next: ThemeState) {
    persist(next);
    setState(next);
  }

  function setColorScheme(colorScheme: ColorScheme) {
    setState((current) => {
      const next = { ...current, colorScheme };
      persist(next);
      return next;
    });
  }

  function setToken(id: string, value: string) {
    if (!isPrimitiveTokenId(id)) return;
    setState((current) => {
      const isColor = colorTokens.some((token) => token.id === id);
      const next: ThemeState =
        isColor && current.colorScheme === 'dark'
          ? { ...current, darkColors: { ...current.darkColors, [id]: value } }
          : { ...current, values: { ...current.values, [id]: value } };
      persist(next);
      return next;
    });
  }

  function exportCss() {
    return themeToCssText(state.values, state.darkColors);
  }

  return (
    <ThemeContext.Provider
      value={{
        colorScheme: state.colorScheme,
        setColorScheme,
        values: activeValues,
        lightValues: state.values,
        darkColors: state.darkColors,
        setToken,
        dirty,
        reset: () => commit(resetTheme(state)),
        exportCss,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
