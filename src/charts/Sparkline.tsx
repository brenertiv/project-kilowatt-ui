import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { referenceLines, seriesColors, tooltipNumberFormat, type ChartInset, type ReferenceLine, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

export type SparklineProps = SeriesColor & {
  /** The rows to plot, oldest first, each with a UTC timestamp in `dateField` and a number in `field`. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, number>[];
  /** The field in each row that holds the values. */
  field: string;
  /** What the values are, in sentence case, shown in the tooltip: `Maintenance score`. */
  name: string;
  /** The unit of the values, shown in the tooltip after each value: `pts`, `kWh`. The headline number above the sparkline carries it too. */
  unit: string;
  /** Up to two targets or benchmarks, each a dashed line labeled with its name and value. Keep it stable, like `data`. Default none. */
  references?: ReferenceLine[];
  /** One sentence on the trend, with the numbers that matter. It isn't shown: it's the figure's accessible name, the sparkline's text alternative for screen readers. */
  summary: string;
  /** The field in each row that holds the UTC timestamp. Default `'date'`. */
  dateField?: string;
  /** The time between rows, which sets how the tooltip writes the date. Default `'day'`. */
  interval?: 'hour' | 'day' | 'month';
  /** The bottom of the value range, for a measure with fixed bounds: `0` for a score. Default: it fits the data. */
  min?: number;
  /** The top of the value range, for a measure with fixed bounds: `100` for a score. Default: it fits the data. */
  max?: number;
  /** The plot's height in pixels. Default `56`. */
  height?: number;
  /** The padding at the sparkline's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title. Default `2`. */
  inset?: ChartInset;
};

const noReferences: ReferenceLine[] = [];

/** How the tooltip writes a row's date, by interval, in amCharts' date format. */
const dateFormats = { hour: 'MMM d, h a', day: 'MMM d', month: 'MMM yyyy' } as const;

/**
 * A sparkline: one measure's trend in a small space, under the headline number it explains, in
 * Kilowatt's chart theme (Rules → Charts). It's a reference implementation that Enertiv's app rebuilds.
 * It has no axes, gridlines or legend, since the headline number above it carries the value and unit;
 * the latest point is marked, every point has a full-value tooltip, and up to two dashed references
 * (a benchmark, a certification threshold) give it scale. The line takes the first `chart.series`
 * color, or a `slot`, or `neutral`. It sits in a `figure` named by `summary`.
 *
 * @summary A small trend line with no axes, under a headline number, its latest point marked.
 * @import import { Sparkline } from 'src/charts/Sparkline';
 */
export function Sparkline({
  data,
  field,
  name,
  unit,
  references = noReferences,
  summary,
  dateField = 'date',
  interval = 'day',
  min,
  max,
  slot,
  neutral,
  height = 56,
  inset = 2,
}: SparklineProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      root.utc = true;
      if (references.length > 2) console.warn('A Sparkline has more than two references; past two, it has no room to label them.');
      // Room at the right for the latest point's marker, which sits on the plot's edge.
      const chart = root.container.children.push(am5xy.XYChart.new(root, { paddingLeft: 0, paddingRight: 6, paddingTop: 6, paddingBottom: 6 }));
      const xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, { baseInterval: { timeUnit: interval, count: 1 }, renderer: am5xy.AxisRendererX.new(root, {}) }),
      );
      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, { min, max, strictMinMax: min !== undefined && max !== undefined, renderer: am5xy.AxisRendererY.new(root, {}) }),
      );
      // No axes, gridlines or labels: the headline number above carries the value and unit, and the tooltip the exact reading.
      for (const axis of [xAxis, yAxis] as am5xy.Axis<am5xy.AxisRenderer>[]) {
        axis.get('renderer').labels.template.set('forceHidden', true);
        axis.get('renderer').grid.template.set('forceHidden', true);
      }
      // Labeled at the left, clear of the latest point's marker at the right.
      referenceLines(root, chart, yAxis, references, unit, colors);
      const [stroke] = seriesColors([{ slot, neutral }], colors);
      const line = chart.series.push(
        am5xy.LineSeries.new(root, {
          name,
          xAxis,
          yAxis,
          valueXField: dateField,
          valueYField: field,
          stroke,
          fill: stroke,
          tooltip: am5.Tooltip.new(root, {
            labelText: `${name}, {valueX.formatDate('${dateFormats[interval]}')}: {valueY.formatNumber('${tooltipNumberFormat}')} ${unit}`,
          }),
        }),
      );
      line.strokes.template.set('strokeWidth', 2);
      // The latest reading, the one the headline number reports, is marked.
      const last = data.length ? data[data.length - 1][dateField] : undefined;
      line.bullets.push((bulletRoot, _series, dataItem) =>
        (dataItem.dataContext as Record<string, number>)[dateField] === last
          ? am5.Bullet.new(bulletRoot, { sprite: am5.Circle.new(bulletRoot, { radius: 4, fill: stroke, stroke: colors.surface, strokeWidth: 2 }) })
          : undefined,
      );
      chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }));
      chart.get('cursor')?.lineY.set('forceHidden', true);
      line.data.setAll(data);
    },
    [data, field, name, unit, references, dateField, interval, min, max, slot, neutral],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
