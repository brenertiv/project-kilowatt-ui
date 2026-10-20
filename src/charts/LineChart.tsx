import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { axisUnit, legend, seriesColors, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

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
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The field in each row that holds the UTC timestamp. Default `'date'`. */
  dateField?: string;
  /** The time between rows. Default `'day'`. */
  interval?: 'hour' | 'day' | 'month';
  /** The plot's height in pixels. Default `240`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/**
 * A line chart of values over time, in Kilowatt's chart theme (Rules → Charts): a reference
 * implementation that Enertiv's app rebuilds. Lines take `chart.series` colors in order, or a
 * fixed `slot`; `neutral` lines (a baseline, the previous period) take `chart.neutral`. The
 * chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 * Two units at most: lines marked `right` plot on a second value axis in `rightUnit`.
 *
 * @summary A line chart of values over time, themed from the palette, named by a one-line summary for screen readers.
 * @import import { LineChart } from 'src/charts/LineChart';
 */
export function LineChart({ data, series, unit, rightUnit, summary, dateField = 'date', interval = 'day', height = 240, inset = 2 }: LineChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      root.utc = true;
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, { baseInterval: { timeUnit: interval, count: 1 }, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }) }),
      );
      // One value axis sits on the right; with a second unit, the first moves to the left and the second takes the right.
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, { opposite: !rightUnit }) }));
      axisUnit(root, chart, yAxis, unit);
      // The second unit's axis: labels on the right, placed on the left axis's gridlines so the plot keeps one grid.
      const rightAxis = rightUnit
        ? chart.yAxes.push(am5xy.ValueAxis.new(root, { syncWithAxis: yAxis, renderer: am5xy.AxisRendererY.new(root, { opposite: true }) }))
        : undefined;
      rightAxis?.get('renderer').grid.template.set('forceHidden', true);
      if (rightAxis && rightUnit) axisUnit(root, chart, rightAxis, rightUnit);
      if (series.some(({ right }) => right) && !rightAxis) console.warn('A LineChart line is marked `right` but the chart has no `rightUnit`.');
      const strokes = seriesColors(series, colors);
      const lines = series.map(({ field, name, dashed, right }, i) => {
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
        line.strokes.template.setAll({ strokeWidth: 2, ...(dashed ? { strokeDasharray: [4, 4] } : {}) });
        return line;
      });
      chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }));
      if (lines.length > 1) chart.children.push(legend(root)).data.setAll(lines);
      for (const line of lines) line.data.setAll(data);
    },
    [data, series, unit, rightUnit, dateField, interval],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
