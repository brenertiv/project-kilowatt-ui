import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { axisUnit, dateLabelFormats, legend, seriesColors, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One set of columns, on the left axis: the data field it plots, its name in the legend and tooltip, and how it takes its color. */
export type ComboColumn = SeriesColor & {
  /** The field in each data row that holds this series' values. */
  field: string;
  /** The series' name in the legend and tooltip, in sentence case. */
  name: string;
  /** Marks the series as the target the other columns are read against (a budget): a wide column in `chart.neutral` behind them. Default `false`. */
  target?: boolean;
};

/** One line, on the right axis: the data field it plots, its name in the legend and tooltip, and how it takes its color. */
export type ComboLine = SeriesColor & {
  /** The field in each data row that holds this series' values. */
  field: string;
  /** The series' name in the legend and tooltip, in sentence case. */
  name: string;
  /** Draws the line dashed with no markers: a variant of another line (a normal beside this year), which shares its `slot`. Default `false`. */
  dashed?: boolean;
};

export type ComboChartProps = {
  /** The rows to plot, oldest first, each with a UTC timestamp in `dateField` and a number per series. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, number>[];
  /** The columns, in legend order, plotted on the left axis in `unit`. One measured series and, at most, its `target`. Keep it stable, like `data`. */
  columns: ComboColumn[];
  /** The lines, in legend order, plotted on the right axis in `lineUnit`. Keep it stable, like `data`. */
  lines: ComboLine[];
  /** The unit of the columns, shown above the left axis and in the tooltip: `kWh`, `USD`. */
  unit: string;
  /** The unit of the lines, shown above the right axis and in the tooltip: `°F`, `CDD`. */
  lineUnit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The field in each row that holds the UTC timestamp. Default `'date'`. */
  dateField?: string;
  /** The time between rows, which sets the axis's labels and how the tooltip writes the date. Default `'month'`. */
  interval?: 'day' | 'month' | 'year';
  /** The plot's height in pixels. Default `240`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

const dash = [4, 4];

/**
 * A combined column and line chart of two measures over the same periods, in Kilowatt's chart theme
 * (Rules → Charts): a reference implementation that Enertiv's app rebuilds. Columns plot an amount on
 * the left axis (energy use), with an optional `target` drawn as a wider `chart.neutral` column
 * behind it (the budget), and lines plot what explains it on the right axis in a second unit (degree
 * days), each point marked with a hollow dot; a `dashed` line is a variant in the same hue. Two units,
 * two axes, each labeled, and the legend names each series' unit. It doesn't zoom. The chart sits in a
 * `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A column and line chart of two measures in two units over time, with a target behind the columns.
 * @import import { ComboChart } from 'src/charts/ComboChart';
 */
export function ComboChart({ data, columns, lines, unit, lineUnit, summary, dateField = 'date', interval = 'month', height = 240, inset = 2 }: ComboChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      root.utc = true;
      // Each tooltip writes its row's date for the interval, in the viewer's locale (the `date-labels` departure).
      root.dateFormatter.set('dateFormat', dateLabelFormats.tooltip[interval]);
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          baseInterval: { timeUnit: interval, count: 1 },
          renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 40, cellStartLocation: 0.1, cellEndLocation: 0.9 }),
        }),
      );
      // The columns stand between the period's gridlines, so the vertical grid would only cut the plot up.
      xAxis.get('renderer').grid.template.set('forceHidden', true);
      // Two units: the columns' on the left and the lines' on the right, each named above its axis.
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, { opposite: false }) }));
      axisUnit(root, chart, yAxis, unit);
      // The right axis takes the left one's gridlines, so the plot keeps one grid.
      const rightAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, syncWithAxis: yAxis, renderer: am5xy.AxisRendererY.new(root, { opposite: true }) }));
      rightAxis.get('renderer').grid.template.set('forceHidden', true);
      axisUnit(root, chart, rightAxis, lineUnit);

      // A target is context, so it takes `chart.neutral` and no slot; columns then lines take the slots in order.
      const fills = seriesColors([...columns.map(({ target, ...color }) => (target ? { neutral: true } : color)), ...lines], colors);
      // The target first, so it sits behind the columns read against it.
      const order = [...columns.keys()].sort((a, b) => Number(columns[b].target ?? false) - Number(columns[a].target ?? false));
      const sets: am5xy.ColumnSeries[] = [];
      for (const i of order) {
        const { field, name, target } = columns[i];
        const set = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            // With two units, the legend names each series' unit, so a series isn't tied to its axis by color alone.
            name: `${name} (${unit})`,
            xAxis,
            yAxis,
            valueXField: dateField,
            valueYField: field,
            // A target and what's read against it share the period's place rather than standing side by side.
            clustered: false,
            fill: fills[i],
            stroke: fills[i],
          }),
        );
        set.columns.template.setAll({
          width: am5.percent(target ? 90 : 50),
          strokeOpacity: 0,
          // Each column shows its full value on hover, since the axis rounds to compact numbers.
          tooltipText: `${name}, {valueX.formatDate()}: {valueY.formatNumber('${tooltipNumberFormat}')} ${unit}`,
        });
        sets[i] = set;
      }
      const drawn = lines.map(({ field, name, dashed }, l) => {
        const stroke = fills[columns.length + l];
        const line = chart.series.push(
          am5xy.LineSeries.new(root, { name: `${name} (${lineUnit})`, xAxis, yAxis: rightAxis, valueXField: dateField, valueYField: field, stroke, fill: stroke, connect: false }),
        );
        line.strokes.template.setAll({ strokeWidth: 2, ...(dashed ? { strokeDasharray: dash } : {}) });
        // Every period is a reading, so each is marked: a hollow dot, the card surface ringed in the line's color, which
        // stays apart from the column behind it. A dashed variant's points are marked by a smaller solid dot.
        line.bullets.push((bulletRoot) =>
          am5.Bullet.new(bulletRoot, {
            sprite: am5.Circle.new(bulletRoot, {
              radius: dashed ? 3 : 4,
              fill: dashed ? stroke : colors.surface,
              stroke: dashed ? colors.surface : stroke,
              strokeWidth: dashed ? 1 : 2,
              tooltipText: `${name}, {valueX.formatDate()}: {valueY.formatNumber('${tooltipNumberFormat}')} ${lineUnit}`,
            }),
          }),
        );
        return line;
      });
      const all = [...sets, ...drawn];
      chart.children.push(legend(root)).data.setAll(all);
      for (const set of all) set.data.setAll(data);
    },
    [data, columns, lines, unit, lineUnit, dateField, interval],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
