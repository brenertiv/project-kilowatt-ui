import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { axisUnit, tooltipNumberFormat, type ChartInset } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One column of a waterfall: a total, or a change from the total before it. */
export type WaterfallStep = {
  /** The column's name on the axis and in its tooltip, in sentence case: `Rate`, `Sep 2026`. */
  label: string;
  /** A change's amount, signed, or a total's amount. A total with no value is the running total: the first total plus every change since. */
  value?: number;
  /** Marks the step as a total, a column from 0, rather than a change floating from the running total. The first step is a total. Default `false`. */
  total?: boolean;
};

export type WaterfallChartProps = {
  /** The columns, in order: a total, the changes that move it, then the total they come to, with subtotals between if the bridge has stages. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  steps: WaterfallStep[];
  /** The unit of the values, shown above the value axis and in the tooltips: `USD`, `kWh`. */
  unit: string;
  /** Which way of change is the worse one: `'increase'` for a cost, `'decrease'` for savings. Changes that way take `error`, the others `chart.neutral` (Rules → Charts → deviation). */
  worse: 'increase' | 'decrease';
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The plot's height in pixels. Default `240`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** The change written on each column: compact and signed, in the viewer's locale; the caller swaps the hyphen for a real minus. */
const signed = new Intl.NumberFormat(undefined, { notation: 'compact', signDisplay: 'exceptZero' });

/** The total written on each total column: compact, in the viewer's locale. */
const compact = new Intl.NumberFormat(undefined, { notation: 'compact' });

/**
 * A waterfall (bridge) chart: how a total moved from one value to another, in Kilowatt's chart theme
 * (Rules → Charts). It's a reference implementation that Enertiv's app rebuilds. Totals stand from the axis's foot in
 * the first series color; each change floats from the running total, in `error` where it moves the
 * worse way and in `chart.neutral` where it moves the better way, and is written signed above its
 * column, so its direction reads in words as well as color. Totals are written above theirs too. The value
 * axis starts at 0 unless the changes would then be too small to read, when it starts at a round number
 * below the lowest running total. A dashed line in `text.secondary` carries the
 * running total from each column to the next. The chart sits in a `figure` named by `summary`. Put it in a
 * `Card` under a `CardHeader`.
 *
 * @summary A waterfall chart: a total, the signed changes that move it, and the total they come to.
 * @import import { WaterfallChart } from 'src/charts/WaterfallChart';
 */
export function WaterfallChart({ steps, unit, worse, summary, height = 240, inset = 2 }: WaterfallChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, { categoryField: 'label', renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30, cellStartLocation: 0.15, cellEndLocation: 0.85 }) }),
      );
      // Long step names wrap under their column instead of running into the next one.
      xAxis.get('renderer').labels.template.setAll({ oversizedBehavior: 'wrap', maxWidth: 88, textAlign: 'center' });
      xAxis.get('renderer').grid.template.set('forceHidden', true);
      // Each column's ends, its color and its texts, from the running total.
      let running = 0;
      const rows = steps.map(({ label, value, total }) => {
        const full = (amount: number) => root.numberFormatter.format(amount, tooltipNumberFormat);
        if (total) {
          running = value ?? running;
          const fill = colors.series[0];
          return { label, total: true, open: 0, close: running, text: compact.format(running), tooltip: `${label}: ${full(running)} ${unit}`, settings: { fill, stroke: fill } };
        }
        const change = value ?? 0;
        const open = running;
        running += change;
        const worseWay = worse === 'increase' ? change > 0 : change < 0;
        const fill = worseWay ? colors.status.error : colors.neutral;
        const sign = change > 0 ? '+' : change < 0 ? '−' : '';
        return {
          label,
          total: false,
          open,
          close: running,
          text: signed.format(change).replace('-', '−'),
          tooltip: `${label}: ${sign}${full(Math.abs(change))} ${unit}`,
          settings: { fill, stroke: fill },
        };
      });
      // The axis starts at 0, so a total's height is its amount, unless the changes would then be too small to read (a few
      // percent of the totals): it then starts at a round number below the lowest running total, and totals stand from there.
      const levels = rows.flatMap(({ open, close, total }) => (total ? [close] : [open, close]));
      const low = Math.min(...levels);
      const span = Math.max(...levels) - low;
      const step = span > 0 ? 10 ** Math.floor(Math.log10(span)) : 1;
      const floor = span > 0 && low > span * 2 ? Math.floor((low - span) / step) * step : 0;
      // A chart's one value axis sits on the left.
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: floor, renderer: am5xy.AxisRendererY.new(root, { opposite: false }) }));
      axisUnit(root, chart, yAxis, unit);
      // The running total after each column, carried to the next one by the dashed connector; the last has none.
      const leveled = rows.map((row, i) => ({ ...row, open: row.total ? floor : row.open, level: i < rows.length - 1 ? row.close : undefined }));

      // The connectors: a dashed step at the running total from each column's center to the next one's, behind the columns.
      const connectors = chart.series.push(
        am5xy.StepLineSeries.new(root, { xAxis, yAxis, categoryXField: 'label', valueYField: 'level', locationX: 1, noRisers: true, stroke: colors.reference }),
      );
      connectors.strokes.template.setAll({ strokeDasharray: [3, 3], strokeWidth: 1 });

      const columns = chart.series.push(
        am5xy.ColumnSeries.new(root, { xAxis, yAxis, categoryXField: 'label', openValueYField: 'open', valueYField: 'close', clustered: false }),
      );
      columns.columns.template.setAll({
        width: am5.percent(100),
        strokeOpacity: 0,
        templateField: 'settings',
        // Each column shows its exact amount on hover, since the axis and the labels round to compact numbers.
        tooltipText: '{tooltip}',
      });
      // Each column's amount is written above it, a change's signed, so its direction doesn't rest on its color and a total
      // reads in full even when the axis doesn't start at 0.
      columns.bullets.push((bulletRoot, _series, dataItem) => {
        const row = dataItem.dataContext as (typeof leveled)[number];
        return am5.Bullet.new(bulletRoot, {
          locationY: row.close >= row.open ? 1 : 0,
          sprite: am5.Label.new(bulletRoot, { text: row.text, centerX: am5.p50, centerY: am5.p100, populateText: false, paddingBottom: 4 }),
        });
      });
      xAxis.data.setAll(leveled);
      connectors.data.setAll(leveled);
      columns.data.setAll(leveled);
    },
    [steps, unit, worse],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
