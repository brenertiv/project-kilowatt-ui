import { useColorScheme } from '@mui/material/styles';
import type { ColorScheme } from './departures';

/**
 * The color scheme on screen, with `system` resolved to `light` or `dark`. It's undefined until
 * MUI knows the scheme, on the first render, so whatever draws once per scheme (a chart, a map)
 * can wait instead of drawing the wrong one. Stays undefined outside `MuiProvider`.
 */
export function useResolvedScheme(): ColorScheme | undefined {
  const { mode, systemMode } = useColorScheme();
  return mode === 'system' ? systemMode : mode;
}
