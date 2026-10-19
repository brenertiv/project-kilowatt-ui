import { useLayoutEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import { useColorScheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { chartColors, chartThemes } from './theme';

/** What `build` receives: the chart's root and the palette's chart colors for the active scheme. */
export type ChartContext = { root: am5.Root; colors: ReturnType<typeof chartColors> };

/**
 * Runs an amCharts 5 chart in a `div` with Kilowatt's theme (Rules → Charts). It makes the
 * root, applies the theme for the active color scheme, calls `build` to add the chart, and
 * disposes of the root on unmount. amCharts applies a theme only when it builds, so the chart
 * is rebuilt when the scheme changes, and when the user's reduced-motion setting does.
 *
 * @summary Run an amCharts 5 chart with Kilowatt's theme, rebuilt when the color scheme changes.
 * @import import { useChart } from 'src/charts/useChart';
 * @param build - Adds the chart to the root. Keep it stable (`useCallback`, or a function outside the component): the chart is rebuilt whenever it changes.
 * @returns A ref for the chart's `div`, which needs a height.
 */
export function useChart(build: (context: ChartContext) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const { mode, systemMode } = useColorScheme();
  const scheme = (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useLayoutEffect(() => {
    if (!ref.current) return;
    const root = am5.Root.new(ref.current);
    root.setThemes(chartThemes(root, scheme, reducedMotion));
    build({ root, colors: chartColors(scheme) });
    return () => root.dispose();
  }, [build, scheme, reducedMotion]);

  return ref;
}
