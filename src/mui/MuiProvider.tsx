import type { ReactNode } from 'react';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { createKilowattTheme } from './theme';

const theme = createKilowattTheme();

/**
 * Kilowatt's Material UI theme, with MUI managing the color scheme: it writes the
 * `--mui-*` variables and puts the `dark` class on <html> in dark mode, which the
 * token stylesheet and the plain CSS components follow too. Light by default and
 * not persisted; switch with `useKilowattTheme().setScheme`. `injectFirst` puts
 * Emotion's styles before the stylesheet so plain CSS class names keep the last word.
 */
export function MuiProvider({ children }: { children: ReactNode }) {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme} defaultMode="light" storageManager={null} disableTransitionOnChange noSsr>
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
