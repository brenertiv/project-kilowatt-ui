import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import {
  axisUnit,
  legend,
  referenceLines,
  seriesColors,
  tooltipNumberFormat,
  type ChartInset,
  type ChartStatus,
  type ReferenceLine,
  type SeriesColor,
} from './theme';

export type { ReferenceLine } from './theme';
import { useChart, type ChartContext } from './useChart';

/** A band of values that means one status, such as a score from 80 to 100 being excellent. */
export type StatusBand = {
  /** Where the band starts, inclusive. */
  from: number;
  /** Where the band ends. */
  to: number;
  /** The intent the line takes inside the band: `success`, `info`, `warning` or `error`. */
  status: ChartStatus;
  /** The band's name, shown in the tooltip after the value: `Excellent`. */
  label: string;
};

/** One line: the data field it plots, its name in the legend and tooltip, and how it takes its color. */
export type LineSeries = SeriesColor & {
  /** The field in each data row that holds this line's values. */
  field: string;
  /** The line's name in the legend and tooltip, in sentence case. */
  name: string;
  /** Draws the line dashed: a variant of another line (a forecast, the previous period), which keeps its hue. Default `false`. */
  dashed?: boolean;
  /** Plots the line on the right value axis, in `rightUnit`: the second unit of a two-unit chart. Default `false`. */
  right?: boolean;
  /** The UTC timestamp from which the line's values are projected rather than measured: from there on it's drawn dashed in the same hue, and its tooltip says "projected". Default none. */
  projectedFrom?: number;
  /** What the tooltip says about the stretch from `projectedFrom`: `incomplete` for a month still being billed. Default `'projected'`. */
  projectedNote?: string;
  /** Marks points with a dot: `'last'` for the latest reading, `'all'` for sparse data where each point matters. Default none. */
  markers?: 'last' | 'all';
  /** Colors the line by status instead of by series, band by band, and names the band in the tooltip: a score read against excellent, fair and poor. A chart with bands has no other colored line. Default none. */
  bands?: StatusBand[];
};

/** A stretch of time to mark on the plot, such as the window a finding is about: a band in `action.hover` with its name. */
export type TimeRange = {
  /** Where the band starts, as a UTC timestamp on the date axis. */
  from: number;
  /** Where the band ends, as a UTC timestamp on the date axis. */
  to: number;
  /** What the band marks, written inside it at the top: `Possible leak`. Say it in the chart's `summary` too. */
  label: string;
};

export type LineChartProps = {
  /** The rows to plot, oldest first, each with a UTC timestamp in `dateField` and a number per series. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, number>[];
  /** The lines, in legend order. Up to six colored lines, plus any `neutral` ones. Keep it stable, like `data`. */
  series: LineSeries[];
  /** The unit of the values, shown above the value axis and in the tooltip: `kWh`, `°F`. The axis sits on the right, or on the left when the chart has a `rightUnit`. */
  unit: string;
  /** The unit of the `right` lines, for a chart with two units: it adds a right value axis with this unit above it, and every line's legend name carries its unit. Default none. */
  rightUnit?: string;
  /** Targets and benchmarks on the value axis in `unit`, each a dashed line labeled with its name and value. Keep it stable, like `data`. Default none. */
  references?: ReferenceLine[];
  /** Stretches of time to mark as bands behind the lines (Rules → Charts: range bands are `action.hover`), each named inside at the top right. Keep it stable, like `data`. Default none. */
  ranges?: TimeRange[];
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The field in each row that holds the UTC timestamp. Default `'date'`. */
  dateField?: string;
  /** The time between rows. Default `'day'`. */
  interval?: 'hour' | 'day' | 'month' | 'quarter' | 'year';
  /** The top of the value axis in `unit`, for a measure with a fixed ceiling: `100` for a score or a percentage. Default none: the axis fits the data. */
  max?: number;
  /** The plot's height in pixels. Default `240`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

const dash = [4, 4];
const noReferences: ReferenceLine[] = [];
const noRanges: TimeRange[] = [];

/** Draws an axis range's own grid and label only when asked: a series range uses the range to mask its strokes, not to mark the axis. */
function quietRange(item: am5.DataItem<am5xy.IAxisDataItem>) {
  item.get('grid')?.set('forceHidden', true);
  item.get('label')?.set('forceHidden', true);
  item.get('tick')?.set('forceHidden', true);
}

/**
 * A line chart of values over time, in Kilowatt's chart theme (Rules → Charts): a reference
 * implementation that Enertiv's app rebuilds. Lines take `chart.series` colors in order, or a
 * fixed `slot`; `neutral` lines (a baseline, the previous period) take `chart.neutral`. The
 * chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 * Two units at most: lines marked `right` plot on a second value axis in `rightUnit`.
 * Targets are dashed `references`; stretches of time are named `ranges`; a forecast continues its line
 * dashed from `projectedFrom`; a score takes the intents band by band through `bands`.
 *
 * @summary A line chart of values over time, themed from the palette, named by a one-line summary for screen readers.
 * @import import { LineChart } from 'src/charts/LineChart';
 */
export function LineChart({
  data,
  series,
  unit,
  rightUnit,
  references = noReferences,
  ranges = noRanges,
  summary,
  dateField = 'date',
  interval = 'day',
  max,
  height = 240,
  inset = 2,
}: LineChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      root.utc = true;
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          // A quarter is three months to amCharts.
          baseInterval: interval === 'quarter' ? { timeUnit: 'month', count: 3 } : { timeUnit: interval, count: 1 },
          renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }),
        }),
      );
      // A label at the plot's left edge would sit half outside the chart, so none is drawn there.
      xAxis.get('renderer').labels.template.set('minPosition', 0.02);
      // One value axis sits on the right; with a second unit, the first moves to the left and the second takes the right.
      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, { min: 0, ...(max !== undefined ? { max, strictMinMax: true } : {}), renderer: am5xy.AxisRendererY.new(root, { opposite: !rightUnit }) }),
      );
      axisUnit(root, chart, yAxis, unit);
      // The second unit's axis: labels on the right, placed on the left axis's gridlines so the plot keeps one grid.
      const rightAxis = rightUnit
        ? chart.yAxes.push(am5xy.ValueAxis.new(root, { syncWithAxis: yAxis, renderer: am5xy.AxisRendererY.new(root, { opposite: true }) }))
        : undefined;
      rightAxis?.get('renderer').grid.template.set('forceHidden', true);
      if (rightAxis && rightUnit) axisUnit(root, chart, rightAxis, rightUnit);
      if (series.some(({ right }) => right) && !rightAxis) console.warn('A LineChart line is marked `right` but the chart has no `rightUnit`.');
      if (series.some(({ bands }) => bands?.length) && series.filter(({ neutral }) => !neutral).length > 1) {
        console.warn('A LineChart colored by status bands has another colored line; color a chart by series or by status, not both (Rules → Charts).');
      }

      // Targets and benchmarks: dashed lines in text.secondary, labeled at the plot's left edge.
      referenceLines(root, chart, yAxis, references, unit, colors);

      // Marked stretches of time: a band in action.hover behind the lines, its name inside it at the top in text.secondary.
      for (const { from, to, label } of ranges) {
        const item = xAxis.makeDataItem({ value: from, endValue: to });
        xAxis.createAxisRange(item);
        item.get('axisFill')?.setAll({ fill: colors.band, fillOpacity: 1, visible: true });
        item.get('grid')?.set('forceHidden', true);
        item.get('tick')?.set('forceHidden', true);
        // The name sits at the top of the band, against its right edge, so a band that ends at the plot's edge keeps its
        // name inside the plot rather than over the value axis; a name wider than its band runs left over the plot.
        // An inside label hangs from its own foot (amCharts' `inside` rule), so it comes down by its height.
        const name = item.get('label');
        name?.setAll({ text: label, fill: colors.reference, inside: true, location: 1, centerX: am5.p100, paddingRight: 8, paddingTop: 4, rotation: 0 });
        name?.adapters.add('y', () => name.height() - chart.plotContainer.height());
      }

      const last = data.length ? data[data.length - 1][dateField] : 0;
      const strokes = seriesColors(series, colors);
      const lines = series.map(({ field, name, dashed, right, projectedFrom, projectedNote = 'projected', markers, bands = [] }, i) => {
        const lineUnit = right && rightUnit ? rightUnit : unit;
        const line = chart.series.push(
          am5xy.LineSeries.new(root, {
            // With two units, the legend names each line's unit, so a line isn't tied to its axis by color alone.
            name: rightUnit ? `${name} (${lineUnit})` : name,
            xAxis,
            yAxis: right && rightAxis ? rightAxis : yAxis,
            valueXField: dateField,
            valueYField: field,
            stroke: strokes[i],
            fill: strokes[i],
            tooltip: am5.Tooltip.new(root, { labelText: `${name}: {valueY.formatNumber('${tooltipNumberFormat}')} ${lineUnit}` }),
          }),
        );
        line.strokes.template.setAll({ strokeWidth: 2, ...(dashed ? { strokeDasharray: dash } : {}) });

        // Within a band, the line takes the band's intent: the color shows the status and the tooltip names it.
        const bandOf = (value: number | undefined) => (value === undefined ? undefined : bands.find(({ from, to }) => value >= from && value <= to));
        const statusColor = (value: number | undefined) => {
          const band = bandOf(value);
          return band ? colors.status[band.status] : strokes[i];
        };
        for (const { from, to, status } of bands) {
          const item = (right && rightAxis ? rightAxis : yAxis).makeDataItem({ value: from, endValue: to });
          const range = line.createAxisRange(item) as am5xy.ILineSeriesAxisRange;
          range.strokes?.template.setAll({ stroke: colors.status[status], strokeWidth: 2 });
          quietRange(item);
        }

        // A projection continues the line dashed in its own hue, from the last measured point through the last row.
        // Points sit mid-interval on a date axis, so the range starts half an interval early and ends one late.
        if (projectedFrom !== undefined) {
          const step = xAxis.baseDuration();
          const item = xAxis.makeDataItem({ value: projectedFrom - step / 2, endValue: last + step });
          const range = line.createAxisRange(item) as am5xy.ILineSeriesAxisRange;
          range.strokes?.template.setAll({ stroke: strokes[i], strokeWidth: 2, strokeDasharray: dash });
          quietRange(item);
        }

        // The tooltip says in words what the dash and the band color show.
        const tooltip = line.get('tooltip');
        tooltip?.label.adapters.add('text', (text) => {
          const context = tooltip.dataItem?.dataContext as Record<string, number> | undefined;
          if (!context || !text) return text;
          const band = bandOf(context[field]);
          const notes = [band?.label, projectedFrom !== undefined && context[dateField] >= projectedFrom ? projectedNote : undefined].filter(Boolean);
          return notes.length ? `${text} (${notes.join(', ')})` : text;
        });

        if (markers) {
          line.bullets.push((bulletRoot, _series, dataItem) => {
            const context = dataItem.dataContext as Record<string, number>;
            if (markers === 'last' && context[dateField] !== last) return undefined;
            return am5.Bullet.new(bulletRoot, {
              sprite: am5.Circle.new(bulletRoot, { radius: 4, fill: statusColor(context[field]), stroke: colors.surface, strokeWidth: 2 }),
            });
          });
        }
        return line;
      });
      chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }));
      if (lines.length > 1) chart.children.push(legend(root)).data.setAll(lines);
      for (const line of lines) line.data.setAll(data);
    },
    [data, series, unit, rightUnit, references, ranges, dateField, interval, max],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
