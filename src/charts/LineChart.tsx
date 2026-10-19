import { useCallback, useId } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { legend, seriesColors, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One line: the data field it plots, its name in the legend and tooltip, and how it takes its color. */
export type LineSeries = SeriesColor & {
  /** The field in each data row that holds this line's values. */
  field: string;
  /** The line's name in the legend and tooltip, in sentence case. */
  name: string;
  /** Draws the line dashed: a variant of another line (a forecast, the previous period), which keeps its hue. Default `false`. */
  dashed?: boolean;
};

export type LineChartProps = {
  /** The rows to plot, oldest first, each with a UTC timestamp in `dateField` and a number per series. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, number>[];
  /** The lines, in legend order. Up to six colored lines, plus any `neutral` ones. Keep it stable, like `data`. */
  series: LineSeries[];
  /** The unit of the values, shown in the tooltip: `kWh`, `°F`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It's the figure's visible caption and its accessible name. */
  summary: string;
  /** The field in each row that holds the UTC timestamp. Default `'date'`. */
  dateField?: string;
  /** The time between rows. Default `'day'`. */
  interval?: 'hour' | 'day' | 'month';
  /** The plot's height in pixels. Default `240`. */
  height?: number;
};

/**
 * A line chart of values over time, in Kilowatt's chart theme (Rules → Charts): a reference
 * implementation that Enertiv's app rebuilds. Lines take `chart.series` colors in order, or a
 * fixed `slot`; `neutral` lines (a baseline, the previous period) take `chart.neutral`. The
 * chart sits in a `figure` whose caption is `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A line chart of values over time, themed from the palette, with a caption that summarizes it.
 * @import import { LineChart } from 'src/charts/LineChart';
 */
export function LineChart({ data, series, unit, summary, dateField = 'date', interval = 'day', height = 240 }: LineChartProps) {
  const captionId = useId();
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      root.utc = true;
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, { baseInterval: { timeUnit: interval, count: 1 }, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }) }),
      );
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, {}) }));
      const strokes = seriesColors(series, colors);
      const lines = series.map(({ field, name, dashed }, i) => {
        const line = chart.series.push(
          am5xy.LineSeries.new(root, {
            name,
            xAxis,
            yAxis,
            valueXField: dateField,
            valueYField: field,
            stroke: strokes[i],
            fill: strokes[i],
            tooltip: am5.Tooltip.new(root, { labelText: `{name}: {valueY.formatNumber('#,###.#')} ${unit}` }),
          }),
        );
        line.strokes.template.setAll({ strokeWidth: 2, ...(dashed ? { strokeDasharray: [4, 4] } : {}) });
        return line;
      });
      chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }));
      if (lines.length > 1) chart.children.push(legend(root)).data.setAll(lines);
      for (const line of lines) line.data.setAll(data);
    },
    [data, series, unit, dateField, interval],
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
