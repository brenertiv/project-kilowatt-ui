import { useMemo, type ReactNode } from 'react';
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useTheme } from '../theme/ThemeProvider';
import { createKilowattTheme } from './theme';

/**
 * Hands the resolved token values to Material UI. Sits inside the app
 * ThemeProvider so it rebuilds on every token edit and scheme switch.
 * `injectFirst` puts Emotion's styles before the stylesheet so plain CSS
 * class names keep the last word.
 */
export function MuiProvider({ children }: { children: ReactNode }) {
  const { values, colorScheme } = useTheme();
  const theme = useMemo(() => createKilowattTheme(values, colorScheme), [values, colorScheme]);
  return (
    <StyledEngineProvider injectFirst>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </StyledEngineProvider>
  );
}
