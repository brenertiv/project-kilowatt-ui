import { useCallback, useId } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { legend, seriesColors, type SeriesColor } from './theme';
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
  /** The unit of the values, shown in the tooltip: `kWh`, `USD`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It's the figure's visible caption and its accessible name. */
  summary: string;
  /** Stacks the series in one column per category, for parts that add up to a total. Default `false`, side by side. */
  stacked?: boolean;
  /** The plot's height in pixels. Default `240`. */
  height?: number;
};

/**
 * A column chart of values across categories, in Kilowatt's chart theme (Rules → Charts): a
 * reference implementation that Enertiv's app rebuilds. Series take `chart.series` colors in
 * order, or a fixed `slot`; a `striped` series is a variant that keeps its hue. The chart sits in
 * a `figure` whose caption is `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A column chart of values across categories, side by side or stacked, themed from the palette.
 * @import import { ColumnChart } from 'src/charts/ColumnChart';
 */
export function ColumnChart({ data, categoryField, series, unit, summary, stacked = false, height = 240 }: ColumnChartProps) {
  const captionId = useId();
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, { categoryField, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30, cellStartLocation: 0.15, cellEndLocation: 0.85 }) }),
      );
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, {}) }));
      // Long category names (building addresses) wrap under their column instead of running into the next one.
      xAxis.get('renderer').labels.template.setAll({ oversizedBehavior: 'wrap', maxWidth: 88, textAlign: 'center' });
      const fills = seriesColors(series, colors);
      const sets = series.map(({ field, name, striped }, i) => {
        const set = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name,
            xAxis,
            yAxis,
            stacked,
            categoryXField: categoryField,
            valueYField: field,
            fill: fills[i],
            stroke: fills[i],
            tooltip: am5.Tooltip.new(root, { labelText: `{name}, {categoryX}: {valueY.formatNumber('#,###')} ${unit}` }),
          }),
        );
        set.columns.template.setAll({ width: am5.percent(stacked ? 70 : 90), strokeOpacity: 0 });
        if (striped) {
          // The series color with stripes of the card surface over it: the same shape as a solid column, so stacked
          // and side-by-side columns line up, with no outline. (amCharts centers a stroke on the edge, which widens a column.)
          set.columns.template.set('fillPattern', am5.LinePattern.new(root, { color: colors.surface, rotation: 45, strokeWidth: 1, gap: 4 }));
        }
        return set;
      });
      xAxis.data.setAll(data);
      if (sets.length > 1) chart.children.push(legend(root)).data.setAll(sets);
      for (const set of sets) set.data.setAll(data);
    },
    [data, categoryField, series, unit, stacked],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-labelledby={captionId} sx={{ m: 0 }}>
      <Box ref={ref} sx={{ height }} />
      <Typography id={captionId} component="figcaption" variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
        {summary}
      </Typography>
    </Box>
  );
}
