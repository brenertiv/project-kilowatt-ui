import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import { format } from 'date-fns';
import { formatUnit, type Unit } from '../lib/format';
import { useChartFrame } from './ChartFrame';
import { downsample, toRows, type ChartAnnotation, type ChartData } from './types';
import { useChartRoot } from './useChartRoot';
import { addCursor, addSharedTooltip, createValueAxis, createXYChart } from './xy';

/** Spacing of time-series samples. */
export type TimeUnit = 'minute' | 'hour' | 'day' | 'week' | 'month';

export type TimeSeriesChartProps = {
  /** The same `ChartData` passed to the enclosing `ChartFrame`. Each point's `x` is an ISO date or epoch ms; a null `y` breaks the line. */
  data: ChartData;
  /** Spacing of the underlying samples. Drives axis labelling and gap detection. */
  interval: TimeUnit;
  /** Formats the value axis, and tooltips for series without their own `unit`. Defaults to `count` formatting. */
  unit?: Unit;
  /** Draw a 10% wash under each line. Defaults to false. Leave off when washes would overlap and muddy each other. */
  area?: boolean;
  /** Start the value axis at zero. Defaults to true: lines rarely justify a cropped baseline. Set false only when the variation is the story. */
  zeroBased?: boolean;
  /** Labelled markers on single points, e.g. the daily peak. Use sparingly: one or two per chart. Defaults to none. */
  annotations?: ChartAnnotation[];
  /** Cap on points per series before drawing; longer series are thinned evenly, keeping the last point. Defaults to 500. */
  maxPoints?: number;
  /** Accessible name for the plot, e.g. "Demand by hour". Required: the plot is an image to assistive tech. */
  ariaLabel: string;
};

const axisFormats: Record<TimeUnit, string> = {
  minute: 'HH:mm',
  hour: 'ha',
  day: 'MMM d',
  week: 'MMM d',
  month: 'MMM yyyy',
};

function toEpoch(x: string | number) {
  return typeof x === 'number' ? x : new Date(x).getTime();
}

/**
 * Lines over a date axis: one y axis, 2px strokes, a crosshair with one tooltip listing every
 * series, and selective direct labels through `annotations`. Use it for a measure over time, such as
 * hourly demand against a baseline; for categories use `CategoryBarChart`, and for a single number
 * use `StatCard`. Render it inside `<ChartFrame>` (it throws otherwise); colors come from series ids
 * via the token palette, so never pass colors.
 *
 * @summary Line chart over time, inside ChartFrame, with a shared crosshair tooltip.
 * @import import { TimeSeriesChart } from 'src/charts/TimeSeriesChart';
 */
export function TimeSeriesChart({
  data,
  interval,
  unit,
  area = false,
  zeroBased = true,
  annotations = [],
  maxPoints = 500,
  ariaLabel,
}: TimeSeriesChartProps) {
  const { hidden, colors } = useChartFrame();
  const seriesRef = useRef(new Map<string, am5xy.LineSeries>());

  const hostRef = useChartRoot(
    ({ root, values }) => {
      const chart = createXYChart(root);
      const xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          baseInterval: { timeUnit: interval, count: 1 },
          renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 56 }),
          dateFormats: { [interval]: axisFormats[interval] },
          periodChangeDateFormats: { [interval]: axisFormats[interval] },
        }),
      );
      xAxis.get('renderer').grid.template.set('forceHidden', true);
      const yAxis = createValueAxis(root, chart, unit, { min: zeroBased ? 0 : undefined });

      const rows = toRows({
        ...data,
        series: data.series.map((series) => downsample(series, maxPoints)),
      }).map((row) => ({ ...row, x: toEpoch(row.x as string | number) }));

      const built = data.series.map((series) => {
        const color = am5.color(colors[series.id]);
        const item = chart.series.push(
          am5xy.LineSeries.new(root, {
            name: series.label,
            xAxis,
            yAxis,
            valueXField: 'x',
            valueYField: series.id,
            stroke: color,
            fill: color,
            connect: false,
            minBulletDistance: 12,
          }),
        );
        if (area) item.fills.template.setAll({ visible: true, fillOpacity: 0.1 });
        item.data.setAll(rows);
        seriesRef.current.set(series.id, item);
        if (hidden.has(series.id)) item.hide(0);
        return { id: series.id, label: series.label, unit: series.unit ?? unit, color: colors[series.id], item };
      });

      for (const note of annotations) {
        const target = built.find((entry) => entry.id === note.seriesId);
        if (!target) continue;
        const x = toEpoch(note.x);
        target.item.bullets.push((bulletRoot, _series, dataItem) => {
          if ((dataItem.dataContext as { x?: number } | undefined)?.x !== x) return undefined;
          const marker = am5.Container.new(bulletRoot, {});
          marker.children.push(am5.Circle.new(bulletRoot, { fill: am5.color(target.color) }));
          marker.children.push(
            am5.Label.new(bulletRoot, {
              text: note.label,
              centerX: am5.p50,
              centerY: am5.p100,
              dy: -8,
              fill: am5.color(values.textPrimary),
              fontWeight: '500',
            }),
          );
          return am5.Bullet.new(bulletRoot, { sprite: marker });
        });
      }

      addCursor(root, chart, xAxis);
      addSharedTooltip(
        root,
        chart,
        xAxis,
        built,
        (x) => format(new Date(typeof x === 'number' ? x : toEpoch(x)), interval === 'month' ? 'MMM yyyy' : 'MMM d, HH:mm'),
        values,
      );

      return () => {
        seriesRef.current.clear();
      };
    },
    [data, interval, unit, area, zeroBased, annotations, maxPoints, colors],
  );

  useEffect(() => {
    for (const [id, series] of seriesRef.current) {
      if (hidden.has(id)) series.hide();
      else series.show();
    }
  }, [hidden]);

  return <div ref={hostRef} className="chart-host chart-plot" role="img" aria-label={ariaLabel} />;
}

/** A plain-text summary of each series' range, e.g. for a longer accessible description. */
export function describeSeries(data: ChartData, unit: Unit = 'count') {
  return data.series
    .map((series) => {
      const ys = series.points.map((point) => point.y).filter((y): y is number => y !== null);
      if (ys.length === 0) return `${series.label}: no data`;
      return `${series.label} from ${formatUnit(Math.min(...ys), unit)} to ${formatUnit(Math.max(...ys), unit)}`;
    })
    .join('; ');
}
