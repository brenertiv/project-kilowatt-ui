import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { stillBillingCaption, stillBillingDash, stillBillingNote, type StillBilling } from './stillBilling';
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
  /** The trailing months of the newest year (the last line) still being billed, oldest first, each named by its label in `categoryField`: fewer than nine in ten of the properties in scope have a bill for it (`isStillBilling` from `src/charts/stillBilling`). The line runs dashed into each, its dot is hollow, and "Still being billed: 9 of 18 properties" is in its tooltip and in a line under the chart. Keep it stable, like `data`. Default none. */
  stillBilling?: StillBilling[];
  /** The plot's height in pixels. Default `240`. */
  height?: number;
  /** The padding around the chart inside its card, in theme spacing units. Default `2` (16px). */
  inset?: ChartInset;
};

const noMonths: StillBilling[] = [];

/**
 * A line per year over the twelve months, for a year-over-year chart, which `LineChart` can't draw since its months sit
 * on one date axis. Built as the reference charts are (Rules → Charts): amCharts through `useChart`, the lines in
 * `chart.series` order through `seriesColors`, the unit above the value axis on the right, a legend past one line, the
 * full value in each tooltip, a dot on every month so a lone month with data still shows, and a gap where a month has
 * no data, never a line across it. A trailing month still being billed (`stillBilling`) is dashed on the newest year's
 * line and says so in its tooltip and under the chart. It sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A line per year across January to December, for comparing years month by month.
 * @import import { MonthLinesChart } from 'src/charts/MonthLinesChart';
 */
export function MonthLinesChart({ data, categoryField, series, unit, summary, stillBilling = noMonths, height = 240, inset = 2 }: MonthLinesChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30 }) }));
      // A chart's one value axis sits on the right, as the references' do.
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, { opposite: true }) }));
      axisUnit(root, chart, yAxis, unit);
      const strokes = seriesColors(series, colors);
      // The months still being billed are the newest year's: the last line.
      const billing = new Map(stillBilling.map((month) => [String(month.month), month]));
      const billingOf = (context: unknown, i: number) =>
        i === series.length - 1 ? billing.get(String((context as Record<string, string | number> | undefined)?.[categoryField])) : undefined;
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
        // A month still being billed has a hollow dot in the line's hue, so it shows even with no month before it to dash from.
        line.bullets.push((bulletRoot, _series, dataItem) =>
          am5.Bullet.new(bulletRoot, {
            sprite: billingOf(dataItem.dataContext, i)
              ? am5.Circle.new(bulletRoot, { radius: 4, fill: colors.surface, stroke: strokes[i], strokeWidth: 2 })
              : am5.Circle.new(bulletRoot, { radius: 4, fill: strokes[i], stroke: colors.surface, strokeWidth: 2 }),
          }),
        );
        if (i === series.length - 1 && billing.size) {
          // The line runs dashed in its own hue from the last month billed in full through the months still being billed.
          // Points sit mid-category, so the range starts at the middle of the month before the first of them.
          const labels = data.map((row) => String(row[categoryField]));
          const marked = labels.map((label, index) => (billing.has(label) ? index : -1)).filter((index) => index >= 0);
          if (marked.length) {
            const first = marked[0]!;
            const item = xAxis.makeDataItem({
              category: labels[Math.max(first - 1, 0)],
              categoryLocation: first > 0 ? 0.5 : 0,
              endCategory: labels[marked[marked.length - 1]!],
              endCategoryLocation: 1,
            });
            const range = line.createAxisRange(item) as am5xy.ILineSeriesAxisRange;
            range.strokes?.template.setAll({ stroke: strokes[i], strokeWidth: 2, strokeDasharray: stillBillingDash });
            item.get('grid')?.set('forceHidden', true);
            item.get('label')?.set('forceHidden', true);
            item.get('tick')?.set('forceHidden', true);
          }
          // The tooltip says in words what the dash shows.
          const tooltip = line.get('tooltip');
          tooltip?.label.adapters.add('text', (text) => {
            const month = billingOf(tooltip.dataItem?.dataContext, i);
            return month && text ? `${text}\n${stillBillingNote(month)}` : text;
          });
        }
        return line;
      });
      chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }));
      xAxis.data.setAll(data);
      if (lines.length > 1) chart.children.push(legend(root)).data.setAll(lines);
      for (const line of lines) line.data.setAll(data);
    },
    [data, categoryField, series, unit, stillBilling],
  );
  const ref = useChart(build);
  const caption = stillBillingCaption(stillBilling, String);
  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
      {caption && (
        <Typography component="figcaption" variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}
