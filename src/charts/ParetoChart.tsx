import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { axisUnit, legend, referenceLines, tooltipNumberFormat, type ChartInset } from './theme';
import { useChart, type ChartContext } from './useChart';

export type ParetoChartProps = {
  /** The items, in any order: the chart sorts them largest first. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, string | number>[];
  /** The field in each row that holds the item's name, under its column and in its tooltip, and its key, so it's unique. */
  categoryField: string;
  /** The field in each row that holds the item's amount. */
  valueField: string;
  /** What the columns are, in sentence case, in the legend and the tooltips: `Annual savings`. */
  name: string;
  /** The unit of the amounts, above the left axis and in the tooltips: `USD`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** What the line is, in sentence case, in the legend and the tooltips. Default `'Cumulative share'`. */
  cumulativeName?: string;
  /** The cumulative share marked by a dashed reference line, in percent: the few items that make up most of the total sit left of where the line crosses it. `null` for none. Default `80`. */
  threshold?: number | null;
  /** The plot's height in pixels. Default `260`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/**
 * A Pareto chart: items' amounts as columns, largest first, with their cumulative share of the total
 * as a line, in Kilowatt's chart theme (Rules → Charts). It's a reference implementation that Enertiv's
 * app rebuilds. The columns plot the amounts on the left axis in the first series color; the
 * cumulative share, 0 to 100%, is a line on the right axis in `chart.neutral`, every item marked with a
 * hollow dot; and a dashed reference line marks the `threshold` (80%), so the few items that make up
 * most of the total read at a glance. The chart sits in a `figure` named by `summary`. Put it in a `Card`
 * under a `CardHeader`.
 *
 * @summary A Pareto chart: amounts as columns, largest first, with their cumulative share as a line.
 * @import import { ParetoChart } from 'src/charts/ParetoChart';
 */
export function ParetoChart({ data, categoryField, valueField, name, unit, summary, cumulativeName = 'Cumulative share', threshold = 80, height = 260, inset = 2 }: ParetoChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      // Largest first, and each item's cumulative share of the total.
      const sorted = [...data].sort((a, b) => Number(b[valueField]) - Number(a[valueField]));
      const total = sorted.reduce((sum, row) => sum + Number(row[valueField]), 0);
      let running = 0;
      const rows = sorted.map((row) => {
        running += Number(row[valueField]);
        return { ...row, cumulative: total ? (running / total) * 100 : 0 };
      });

      const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, { categoryField, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 20, cellStartLocation: 0.1, cellEndLocation: 0.9 }) }),
      );
      // Many items with long names: each name truncates to its column's width on one line; the column's tooltip names it in full.
      xAxis.get('renderer').labels.template.setAll({ oversizedBehavior: 'truncate', textAlign: 'center' });
      xAxis.get('renderer').labels.template.adapters.add('maxWidth', () => Math.max(24, xAxis.width() / Math.max(1, rows.length) - 4));
      xAxis.get('renderer').grid.template.set('forceHidden', true);
      // Two units: the amounts' on the left, the share's on the right, each named above its axis.
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, { opposite: false }) }));
      axisUnit(root, chart, yAxis, unit);
      const shareAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, { min: 0, max: 100, strictMinMax: true, renderer: am5xy.AxisRendererY.new(root, { opposite: true }) }),
      );
      shareAxis.get('renderer').grid.template.set('forceHidden', true);
      axisUnit(root, chart, shareAxis, '%');

      const columns = chart.series.push(
        am5xy.ColumnSeries.new(root, { name: `${name} (${unit})`, xAxis, yAxis, categoryXField: categoryField, valueYField: valueField, fill: colors.series[0], stroke: colors.series[0] }),
      );
      columns.columns.template.setAll({
        width: am5.percent(90),
        strokeOpacity: 0,
        // Each column shows its full value on hover, since the axis rounds to compact numbers.
        tooltipText: `{categoryX}, ${name}: {valueY.formatNumber('${tooltipNumberFormat}')} ${unit}`,
      });

      // The cumulative share: context for the columns, so it takes `chart.neutral`, each item marked with a hollow dot.
      const stroke = colors.neutral;
      const cumulative = chart.series.push(
        am5xy.LineSeries.new(root, { name: `${cumulativeName} (%)`, xAxis, yAxis: shareAxis, categoryXField: categoryField, valueYField: 'cumulative', stroke, fill: stroke }),
      );
      cumulative.strokes.template.set('strokeWidth', 2);
      cumulative.bullets.push((bulletRoot) =>
        am5.Bullet.new(bulletRoot, {
          sprite: am5.Circle.new(bulletRoot, {
            radius: 4,
            fill: colors.surface,
            stroke,
            strokeWidth: 2,
            tooltipText: `{categoryX}, ${cumulativeName.toLowerCase()}: {valueY.formatNumber('#.#')}%`,
          }),
        }),
      );
      if (threshold !== null) referenceLines(root, chart, shareAxis, [{ value: threshold, label: 'Threshold' }], '%', colors);

      xAxis.data.setAll(rows);
      columns.data.setAll(rows);
      cumulative.data.setAll(rows);
      chart.children.push(legend(root)).data.setAll([columns, cumulative]);
    },
    [data, categoryField, valueField, name, unit, cumulativeName, threshold],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
