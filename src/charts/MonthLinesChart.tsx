import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { axisUnit, legend, seriesColors, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One year's line: the field in each month's row that holds its value, and its name (the year). */
export type MonthLine = SeriesColor & {
  /** The field in each row that holds this year's value for the month. */
  field: string;
  /** The line's name in the legend and tooltip: the year, `2025`. */
  name: string;
};

export type MonthLinesChartProps = {
  /** Twelve rows, January first, each with the month's name in `categoryField` and a number per line where the month has data. Keep it stable (`useMemo`). */
  data: Record<string, string | number>[];
  /** The field in each row that holds the month's name: `month`. */
  categoryField: string;
  /** The lines, oldest year first. Keep it stable, like `data`. */
  series: MonthLine[];
  /** The values' unit, above the value axis and in every tooltip: `kWh`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name. */
  summary: string;
  /** The plot's height in pixels. Default `240`. */
  height?: number;
  /** The padding around the chart inside its card, in theme spacing units. Default `2` (16px). */
  inset?: ChartInset;
};

/**
 * A line per year over the twelve months, for a year-over-year chart, which `LineChart` can't draw since its months sit
 * on one date axis. Built as the reference charts are (Rules → Charts): amCharts through `useChart`, the lines in
 * `chart.series` order through `seriesColors`, the unit above the value axis on the right, a legend past one line, the
 * full value in each tooltip, a dot on every month so a lone month with data still shows, and a gap where a month has
 * no data, never a line across it. It sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A line per year across January to December, for comparing years month by month.
 * @import import { MonthLinesChart } from 'src/charts/MonthLinesChart';
 */
export function MonthLinesChart({ data, categoryField, series, unit, summary, height = 240, inset = 2 }: MonthLinesChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30 }) }));
      // A chart's one value axis sits on the right, as the references' do.
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, { opposite: true }) }));
      axisUnit(root, chart, yAxis, unit);
      const strokes = seriesColors(series, colors);
      const lines = series.map(({ field, name }, i) => {
        const line = chart.series.push(
          am5xy.LineSeries.new(root, {
            name,
            xAxis,
            yAxis,
            categoryXField: categoryField,
            valueYField: field,
            stroke: strokes[i],
            fill: strokes[i],
            // A month without data breaks the line rather than being bridged.
            connect: false,
            tooltip: am5.Tooltip.new(root, { labelText: `${name}, {categoryX}: {valueY.formatNumber('${tooltipNumberFormat}')} ${unit}` }),
          }),
        );
        line.strokes.template.setAll({ strokeWidth: 2 });
        // A dot on every month (the point-markers departure's 4px dot ringed in the card surface), so a lone month with data still shows.
        line.bullets.push((bulletRoot) => am5.Bullet.new(bulletRoot, { sprite: am5.Circle.new(bulletRoot, { radius: 4, fill: strokes[i], stroke: colors.surface, strokeWidth: 2 }) }));
        return line;
      });
      chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }));
      xAxis.data.setAll(data);
      if (lines.length > 1) chart.children.push(legend(root)).data.setAll(lines);
      for (const line of lines) line.data.setAll(data);
    },
    [data, categoryField, series, unit],
  );
  const ref = useChart(build);
  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
