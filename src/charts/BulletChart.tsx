import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { tooltipNumberFormat, type ChartInset } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One row of a bullet chart: a category, its value and the target it's read against. */
export type BulletRow = {
  /** The row's name down the left, and its key, so it's unique: a property or a certification. */
  category: string;
  /** The measured value, drawn as a bar from 0. */
  value: number;
  /** The value it's read against (projected, budget, 100%), drawn as a tick across the row. */
  target: number;
};

export type BulletChartProps = {
  /** The rows, top to bottom, in the order to read them. One row for a single reading against its target. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  rows: BulletRow[];
  /** What the bar is, in sentence case, in the legend and the tooltips: `Realised`, `Certified`. */
  name: string;
  /** What the tick is, in sentence case, in the legend and the tooltips: `Projected`, `Budget`. */
  targetName: string;
  /** The unit of the values, at the end of the value axis and in the tooltips: `USD`, `%`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** Which side of its target is worse for a bar: `'above'` for spend over budget, `'below'` for savings short of projection. Bars on the worse side take `error`, the rest `chart.neutral` (Rules → Charts → deviation). `'none'` draws every bar in the first series color. Default `'none'`. */
  worse?: 'above' | 'below' | 'none';
  /** The end of the scale, for a measure with one (100 for a share): a track in `action.hover` runs to it behind every bar. Default: none, and the axis fits the data. */
  max?: number;
  /** The plot's height in pixels. Default: 40px a row, plus 72px for the axis. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** The target tick's size: 3px wide, and as tall as a row's track, so it reads across the bar. */
const tick = { width: 3, height: 20 };

/**
 * A horizontal bullet chart: each row's value as a bar from 0 against its target as a tick, in
 * Kilowatt's chart theme (Rules → Charts). It's a reference implementation that Enertiv's app
 * rebuilds. With `max`, a track in `action.hover` runs to the end of the scale behind each bar (a
 * certification's 100%). With `worse`, a bar on the worse side of its tick takes `error` and the rest
 * `chart.neutral`; otherwise bars take the first series color. The tick is `text.secondary`, the
 * reference color, and an HTML legend under the plot names the bar and the tick, with each color the
 * bars take in words. One row makes a single progress bar against a target (carbon-zero progress). The
 * chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A bullet chart: each row's value as a bar against its target as a tick.
 * @import import { BulletChart } from 'src/charts/BulletChart';
 */
export function BulletChart({ rows, name, targetName, unit, summary, worse = 'none', max, height, inset = 2 }: BulletChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      // Rows down the left, first at the top, and the values along the bottom.
      const yAxis = chart.yAxes.push(
        am5xy.CategoryAxis.new(root, {
          categoryField: 'category',
          renderer: am5xy.AxisRendererY.new(root, { inversed: true, minGridDistance: 16, cellStartLocation: 0.15, cellEndLocation: 0.85 }),
        }),
      );
      // Long names (building addresses) truncate at 160px, or at two fifths of a narrow chart; the bar's tooltip names the row in full.
      yAxis.get('renderer').labels.template.setAll({ oversizedBehavior: 'truncate', maxWidth: Math.min(160, root.width() * 0.4), centerX: 0, paddingLeft: 0 });
      yAxis.get('renderer').grid.template.set('forceHidden', true);
      const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, { min: 0, ...(max === undefined ? {} : { max, strictMinMax: true }), renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }) }),
      );
      // A number at the plot's right edge would sit half outside the chart, so none is drawn there.
      xAxis.get('renderer').labels.template.set('maxPosition', 0.97);
      // The unit sits at the value axis's end, under its numbers.
      xAxis.children.push(am5.Label.new(root, { text: unit, x: am5.p100, centerX: am5.p100, paddingTop: 4, paddingRight: 0 }));

      const write = (value: number) => `${root.numberFormatter.format(value, tooltipNumberFormat)} ${unit}`;
      const data = rows.map(({ category, value, target }) => {
        const worseSide = worse === 'above' ? value > target : worse === 'below' ? value < target : false;
        const fill = worse === 'none' ? colors.series[0] : worseSide ? colors.status.error : colors.neutral;
        const share = target ? Math.round((value / target) * 100) : 0;
        return {
          category,
          value,
          target,
          end: max,
          bar: { fill, stroke: fill },
          // The bar and the tick each show their exact value on hover, and the bar how it stands against the tick.
          valueTip: `${category}, ${name}: ${write(value)} (${share}% of ${targetName.toLowerCase()})`,
          targetTip: `${category}, ${targetName}: ${write(target)}`,
        };
      });

      // The track to the end of the scale, behind the bars.
      if (max !== undefined) {
        const track = chart.series.push(am5xy.ColumnSeries.new(root, { xAxis, yAxis, categoryYField: 'category', valueXField: 'end', clustered: false, fill: colors.band }));
        track.columns.template.setAll({ height: am5.percent(100), strokeOpacity: 0 });
        track.data.setAll(data);
      }
      const bars = chart.series.push(am5xy.ColumnSeries.new(root, { xAxis, yAxis, categoryYField: 'category', valueXField: 'value', clustered: false }));
      bars.columns.template.setAll({ height: am5.percent(50), strokeOpacity: 0, templateField: 'bar', tooltipText: '{valueTip}' });

      // The target: a tick across the row in the reference color.
      const targets = chart.series.push(am5xy.LineSeries.new(root, { xAxis, yAxis, categoryYField: 'category', valueXField: 'target' }));
      targets.strokes.template.set('forceHidden', true);
      targets.bullets.push((bulletRoot) =>
        am5.Bullet.new(bulletRoot, {
          sprite: am5.Rectangle.new(bulletRoot, { ...tick, centerX: am5.p50, centerY: am5.p50, fill: colors.reference, tooltipText: '{targetTip}' }),
        }),
      );

      yAxis.data.setAll(data);
      bars.data.setAll(data);
      targets.data.setAll(data);
    },
    [rows, name, targetName, unit, worse, max],
  );
  const ref = useChart(build);
  // The legend names the tick and each color the bars take, said in words: only the colors some bar takes.
  const side = worse === 'above' ? 'over' : 'short of';
  const worseRows = rows.filter(({ value, target }) => (worse === 'above' ? value > target : value < target)).length;
  const keys: { label: string; color: (theme: Theme) => string; tick?: boolean }[] = [
    ...(worse === 'none'
      ? [{ label: name, color: (theme: Theme) => theme.palette.chart.series[0] }]
      : [
          ...(worseRows > 0 ? [{ label: `${name}, ${side} ${targetName.toLowerCase()}`, color: (theme: Theme) => theme.palette.error.main }] : []),
          ...(worseRows < rows.length
            ? [{ label: `${name}, ${worse === 'above' ? 'within' : 'meeting'} ${targetName.toLowerCase()}`, color: (theme: Theme) => theme.palette.chart.neutral }]
            : []),
        ]),
    { label: targetName, color: (theme) => theme.palette.text.secondary, tick: true },
  ];

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height: height ?? rows.length * 40 + 72 }} />
      <Stack component="figcaption" direction="row" sx={{ flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, mt: 1 }}>
        {keys.map(({ label, color, tick: isTick }) => (
          <Stack key={label} direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Box aria-hidden sx={(theme) => ({ width: isTick ? 3 : 8, height: isTick ? 12 : 8, borderRadius: isTick ? 0 : '50%', bgcolor: color(theme) })} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
