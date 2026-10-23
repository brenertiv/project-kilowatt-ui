import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { axisUnit, legend, seriesColors, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One set of columns: the data field it plots, its name in the legend and tooltip, and how it takes its color. */
export type ColumnSeries = SeriesColor & {
  /** The field in each data row that holds this series' values. */
  field: string;
  /** The series' name in the legend and tooltip, in sentence case. */
  name: string;
  /** Hatches the columns with diagonal stripes of the card surface over the series color: a variant of another series (delivery beside supply), which keeps its hue. Default `false`. */
  striped?: boolean;
};

export type ColumnChartProps = {
  /** The rows to plot, one per category, each with the category's label in `categoryField` and a number per series. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, string | number>[];
  /** The field in each row that holds the category's label. */
  categoryField: string;
  /** The series, in legend order. Up to six colored series, plus any `neutral` ones. Keep it stable, like `data`. */
  series: ColumnSeries[];
  /** The unit of the values, shown above the value axis and in the tooltip: `kWh`, `USD`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** Stacks the series in one column per category, for parts that add up to a total. Default `false`, side by side. */
  stacked?: boolean;
  /** Lays the bars out horizontally, categories down the left in `data` order and values along the bottom: a ranking, or categories with long names. Sort `data` largest first for a ranking. Default `false`. */
  horizontal?: boolean;
  /** The name of the series that groups the smallest series when there are more than six colored ones. Default `'Other'`. */
  otherLabel?: string;
  /** The plot's height in pixels. Default `240`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** The most colored series a chart shows: the number of `chart.series` colors (Rules → Charts). */
const maxSeries = 6;

/**
 * The series to draw, and the rows with an `other` field. Past six colored series, the five with the
 * largest totals keep their own and the rest are summed into one neutral `otherLabel` series.
 */
function grouped(data: ColumnChartProps['data'], series: ColumnSeries[], otherLabel: string) {
  const colored = series.filter(({ neutral }) => !neutral);
  if (colored.length <= maxSeries) return { rows: data, sets: series };
  const total = (field: string) => data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
  const kept = new Set([...colored].sort((a, b) => total(b.field) - total(a.field)).slice(0, maxSeries - 1));
  const rest = colored.filter((set) => !kept.has(set));
  const rows = data.map((row) => ({ ...row, other: rest.reduce((sum, { field }) => sum + (Number(row[field]) || 0), 0) }));
  return { rows, sets: [...series.filter((set) => set.neutral || kept.has(set)), { field: 'other', name: otherLabel, neutral: true }] };
}

/**
 * A column chart of values across categories, in Kilowatt's chart theme (Rules → Charts): a
 * reference implementation that Enertiv's app rebuilds. Series take `chart.series` colors in
 * order, or a fixed `slot`; a `striped` series is a variant that keeps its hue. Past six colored
 * series, the smallest are grouped into one neutral series. `horizontal` turns the columns into bars
 * for a ranking. The chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A column chart of values across categories, side by side or stacked, themed from the palette.
 * @import import { ColumnChart } from 'src/charts/ColumnChart';
 */
export function ColumnChart({
  data,
  categoryField,
  series,
  unit,
  summary,
  stacked = false,
  horizontal = false,
  otherLabel = 'Other',
  height = 240,
  inset = 2,
}: ColumnChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const cells = { cellStartLocation: 0.15, cellEndLocation: 0.85 };
      let categoryAxis: am5xy.CategoryAxis<am5xy.AxisRenderer>;
      let valueAxis: am5xy.ValueAxis<am5xy.AxisRenderer>;
      if (horizontal) {
        // Bars: categories down the left, first row at the top, and the values along the bottom.
        categoryAxis = chart.yAxes.push(
          am5xy.CategoryAxis.new(root, { categoryField, renderer: am5xy.AxisRendererY.new(root, { inversed: true, minGridDistance: 16, ...cells }) }),
        );
        valueAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }) }));
        // A number at the plot's right edge would sit half outside the chart, so none is drawn there.
        valueAxis.get('renderer').labels.template.set('maxPosition', 0.97);
        // The unit sits at the value axis's end, under its numbers, as it sits above a vertical one.
        valueAxis.children.push(am5.Label.new(root, { text: unit, x: am5.p100, centerX: am5.p100, paddingTop: 4, paddingRight: 0 }));
        // Long category names (building addresses) truncate; the bar's tooltip names the category in full.
        categoryAxis.get('renderer').labels.template.setAll({ oversizedBehavior: 'truncate', maxWidth: 160, centerX: 0, paddingLeft: 0 });
      } else {
        categoryAxis = chart.xAxes.push(
          am5xy.CategoryAxis.new(root, { categoryField, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30, ...cells }) }),
        );
        // A chart's one value axis sits on the right.
        valueAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, { opposite: true }) }));
        axisUnit(root, chart, valueAxis, unit);
        // Long category names (building addresses) wrap under their column instead of running into the next one.
        categoryAxis.get('renderer').labels.template.setAll({ oversizedBehavior: 'wrap', maxWidth: 88, textAlign: 'center' });
      }
      const { rows, sets: drawn } = grouped(data, series, otherLabel);
      const fills = seriesColors(drawn, colors);
      const sets = drawn.map(({ field, name, striped }, i) => {
        const set = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name,
            xAxis: horizontal ? valueAxis : categoryAxis,
            yAxis: horizontal ? categoryAxis : valueAxis,
            stacked,
            ...(horizontal ? { categoryYField: categoryField, valueXField: field } : { categoryXField: categoryField, valueYField: field }),
            fill: fills[i],
            stroke: fills[i],
            tooltip: am5.Tooltip.new(root, {}),
          }),
        );
        set.columns.template.setAll({
          [horizontal ? 'height' : 'width']: am5.percent(stacked ? 70 : 90),
          strokeOpacity: 0,
          // Each column shows its full value on hover, since the axis rounds to compact numbers.
          tooltipText: horizontal
            ? `{name}, {categoryY}: {valueX.formatNumber('${tooltipNumberFormat}')} ${unit}`
            : `{name}, {categoryX}: {valueY.formatNumber('${tooltipNumberFormat}')} ${unit}`,
        });
        if (striped) {
          // The series color with stripes of the card surface over it: the same shape as a solid column, so stacked
          // and side-by-side columns line up, with no outline. (amCharts centers a stroke on the edge, which widens a column.)
          set.columns.template.set('fillPattern', am5.LinePattern.new(root, { color: colors.surface, rotation: 45, strokeWidth: 1, gap: 4 }));
        }
        return set;
      });
      categoryAxis.data.setAll(rows);
      if (sets.length > 1) chart.children.push(legend(root)).data.setAll(sets);
      for (const set of sets) set.data.setAll(rows);
    },
    [data, categoryField, series, unit, stacked, horizontal, otherLabel],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
