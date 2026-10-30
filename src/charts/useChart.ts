import { useLayoutEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { ColorScheme } from '../mui/departures';
import { useResolvedScheme } from '../mui/useResolvedScheme';
import { chartColors, chartThemes } from './theme';

// The license removes the amCharts logo. It comes from .env.local (see .env.example); without it charts still render, with the logo.
const license = import.meta.env.VITE_AMCHARTS_LICENSE;
if (license) am5.addLicense(license);

/** What `build` receives: the chart's root, the active scheme and the palette's chart colors for it. */
export type ChartContext = { root: am5.Root; scheme: ColorScheme; colors: ReturnType<typeof chartColors> };

/**
 * Runs an amCharts 5 chart in a `div` with Kilowatt's theme (Rules → Charts). It makes the
 * root, applies the theme for the active color scheme (Foundations → amCharts departures), calls
 * `build` to add the chart, and disposes of the root on unmount. amCharts applies a theme only when it builds, so the chart
 * is rebuilt when the scheme changes, and when the user's reduced-motion setting does. It waits
 * for the scheme on the first render, so a chart never builds in the wrong one.
 *
 * @summary Run an amCharts 5 chart with Kilowatt's theme, rebuilt when the color scheme changes.
 * @import import { useChart } from 'src/charts/useChart';
 * @param build - Adds the chart to the root. Keep it stable (`useCallback`, or a function outside the component): the chart is rebuilt whenever it changes.
 * @returns A ref for the chart's `div`, which needs a height.
 */
export function useChart(build: (context: ChartContext) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const scheme = useResolvedScheme();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useLayoutEffect(() => {
    if (!ref.current || !scheme) return;
    const root = am5.Root.new(ref.current);
    root.setThemes(chartThemes(root, scheme, reducedMotion));
    build({ root, scheme, colors: chartColors(scheme) });
    return () => root.dispose();
  }, [build, scheme, reducedMotion]);

  return ref;
}
