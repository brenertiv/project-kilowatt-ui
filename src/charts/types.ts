import type { Unit } from '../lib/format';

/** One observation. `x` is an ISO date or epoch ms for time series, a category name otherwise. */
export type ChartPoint = {
  x: string | number;
  y: number | null;
};

/** How a series should be drawn relative to the others. */
export type SeriesRole =
  /** A normal categorical series: takes the next palette slot. */
  | 'default'
  /** A baseline or comparison: drawn in the neutral track color so the story series stays loud. */
  | 'comparison';

/** One named line, bar group, slice or heatmap row. */
export type ChartSeries = {
  /** Stable identity. Color follows this id, never the series' position, so filtering never repaints the rest. */
  id: string;
  /** Reader-facing name, shown in the legend, tooltip and table header. */
  label: string;
  /** How this series' values are formatted in tooltips and the table. Falls back to the chart's `unit`, then to `count`. */
  unit?: Unit;
  /** The observations, in x order. A `y` of `null` is a missing reading, not zero. */
  points: ChartPoint[];
  /** `'comparison'` draws a baseline in the neutral track color. Defaults to `'default'`, the next palette slot. */
  role?: SeriesRole;
};

/**
 * The one data shape every chart kind and `ChartFrame` take. Pass the same object to the frame and
 * to the chart inside it. At most seven non-comparison series: the palette has seven slots.
 */
export type ChartData = {
  /** The series to draw. Every `y` being `null` puts the frame in its empty state. */
  series: ChartSeries[];
  /** Name of the x dimension, used as the first table header. Defaults to "Date" or "Category" by the frame's `xKind`. */
  xLabel?: string;
};

/** A labelled x position the chart should call out, e.g. the peak. */
export type ChartAnnotation = {
  /** The x of the point to mark. Must match a point's `x` in that series; a time series compares them as the same instant. */
  x: string | number;
  /** The `id` of the series the marker sits on. Unknown ids are skipped. */
  seriesId: string;
  /** Short text drawn above the marker, e.g. "Peak". */
  label: string;
};

export function seriesIds(data: ChartData): string[] {
  return data.series.map((series) => series.id);
}

/** The ordered union of x values across every series, so the table and axis agree. */
export function xValues(data: ChartData): (string | number)[] {
  const seen = new Set<string | number>();
  for (const series of data.series) {
    for (const point of series.points) seen.add(point.x);
  }
  return [...seen];
}

/** Rows keyed by x with one field per series id. The shape amCharts XY series read. */
export function toRows(data: ChartData): Record<string, string | number | null>[] {
  const byX = new Map<string | number, Record<string, string | number | null>>();
  for (const x of xValues(data)) byX.set(x, { x });
  for (const series of data.series) {
    for (const point of series.points) {
      const row = byX.get(point.x);
      if (row) row[series.id] = point.y;
    }
  }
  return [...byX.values()];
}

/** Caps points per series so a chart never receives more than it can draw legibly. */
export function downsample(series: ChartSeries, maxPoints: number): ChartSeries {
  if (series.points.length <= maxPoints) return series;
  const stride = Math.ceil(series.points.length / maxPoints);
  const points = series.points.filter((_, index) => index % stride === 0 || index === series.points.length - 1);
  return { ...series, points };
}
