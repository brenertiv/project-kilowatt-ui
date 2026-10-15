import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import * as am5 from '@amcharts/amcharts5';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorScheme, ThemeValues } from '../tokens';
import { createChartTheme } from './theme';

export type ChartContext = {
  root: am5.Root;
  values: ThemeValues;
  scheme: ColorScheme;
  /**
   * True when the user prefers reduced motion. The root's theme already makes state changes and
   * tooltips instant; charts also pass `motionDuration(reduceMotion)` to any `show`/`hide` they call.
   */
  reduceMotion: boolean;
};

export type ChartSetup = (context: ChartContext) => void | (() => void);

/** The duration to pass to amCharts `show`/`hide`: 0 under reduced motion, otherwise the theme's default. */
export function motionDuration(reduceMotion: boolean): number | undefined {
  return reduceMotion ? 0 : undefined;
}

/**
 * Owns an amCharts root for a host element: creates it with the token theme,
 * resizes it with the host, and disposes on unmount. The setup callback builds
 * the chart and may return its own cleanup.
 *
 * The root is rebuilt when theme values change, so colors and fonts follow the
 * dark-mode switch without per-chart listeners.
 */
export function useChartRoot(setup: ChartSetup, deps: readonly unknown[] = []): RefObject<HTMLDivElement | null> {
  const hostRef = useRef<HTMLDivElement>(null);
  const setupRef = useRef(setup);
  useLayoutEffect(() => {
    setupRef.current = setup;
  });
  const { values, colorScheme } = useTheme();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const root = am5.Root.new(host);
    // Hiding the logo is only permitted under a commercial amCharts license.
    root._logo?.dispose();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.setThemes([createChartTheme(values, { reduceMotion }).new(root)]);
    root.numberFormatter.setAll({ numberFormat: '#,###.#' });

    const cleanup = setupRef.current({ root, values, scheme: colorScheme, reduceMotion });

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => root.resize());
    });
    observer.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      cleanup?.();
      root.dispose();
    };
    // Rebuild when the theme or the caller's inputs change; setupRef carries the latest closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, colorScheme, ...deps]);

  return hostRef;
}
