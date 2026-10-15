import { useColorScheme } from '@mui/material/styles';
import { defaultDarkColors, defaultTheme, schemeValues, type ColorScheme } from '../tokens';

/**
 * The current color scheme and its token values, for code that can't read CSS
 * variables: canvas charts and the token tables. MUI owns the scheme (see
 * MuiProvider); this reads it and switches it.
 */
export function useKilowattTheme() {
  const { mode, systemMode, setMode } = useColorScheme();
  const scheme: ColorScheme = (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';
  return {
    scheme,
    /** Switches the scheme. MUI's setter, so it keeps its identity across renders. */
    setScheme: setMode as (next: ColorScheme) => void,
    /** Every token resolved for the current scheme. */
    values: schemeValues[scheme],
    /** The light values and the dark color overrides, for tables that show both schemes. */
    lightValues: defaultTheme,
    darkColors: defaultDarkColors,
  };
}
