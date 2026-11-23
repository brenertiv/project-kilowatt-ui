import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { tooltipNumberFormat, type ChartInset } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One row of a dumbbell chart: a category and its two values. */
export type DumbbellRow = {
  /** The row's name down the left, and its key, so it's unique: a property's name. */
  category: string;
  /** The value the row starts from (a limit, today): a hollow dot. */
  from: number;
  /** The value it's read against `from` (the actual, a stranding year): a solid dot. */
  to: number;
  /** What the gap means, in words, written at the row's right end and in its tooltip: `$412K fine`. Default none. */
  note?: string;
};

export type DumbbellChartProps = {
  /** The rows, top to bottom, in the order to read them: sort by the gap, largest first, for a ranking. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  rows: DumbbellRow[];
  /** What `from` is, in sentence case, in the legend and the tooltips: `Limit`, `Today`. */
  fromName: string;
  /** What `to` is, in sentence case, in the legend and the tooltips: `Actual`, `Stranding year`. */
  toName: string;
  /** The unit of the values, at the end of the value axis and in the tooltips: `tCO₂e`. Empty for years. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** Which side of `from` is worse for `to`: `'above'` for emissions over a limit, `'below'` for a value under its floor. Rows on the worse side take `error`, the rest `chart.neutral` (Rules → Charts → deviation). `'none'` draws every `to` in the first series color, for a gap that isn't good or bad in itself. Default `'none'`. */
  worse?: 'above' | 'below' | 'none';
  /** `'year'` writes values as years (2031, not 2.03K). Default `'number'`. */
  valueFormat?: 'number' | 'year';
  /** The plot's height in pixels. Default: 36px a row, plus the axis and legend. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** A dot's radius: 6px, so two dots a row apart don't touch, and big enough to rest a pointer on. */
const dot = 6;

/**
 * A horizontal dumbbell chart: each row's gap between two values, in Kilowatt's chart theme
 * (Rules → Charts). It's a reference implementation that Enertiv's app rebuilds. Each row is a line
 * from a hollow dot at `from` (a limit) to a solid dot at `to` (the actual). With `worse`, a row whose
 * `to` falls on the worse side of its `from` draws its line and dot in `error`, and the rest in
 * `chart.neutral`; a `note` says what the gap means in words at the row's end (`$412K fine`), so it
 * doesn't rest on the color. An HTML legend under the plot names each kind of dot. The chart sits in a `figure` named by
 * `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A dumbbell chart: each row's gap between two values, such as a limit and the actual.
 * @import import { DumbbellChart } from 'src/charts/DumbbellChart';
 */
export function DumbbellChart({ rows, fromName, toName, unit, summary, worse = 'none', valueFormat = 'number', height, inset = 2 }: DumbbellChartProps) {
  const notes = rows.some(({ note }) => note);
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const years = valueFormat === 'year';
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      // Rows down the left, first at the top, and the values along the bottom.
      const yAxis = chart.yAxes.push(
        am5xy.CategoryAxis.new(root, { categoryField: 'category', renderer: am5xy.AxisRendererY.new(root, { inversed: true, minGridDistance: 16 }) }),
      );
      // Long names (building addresses) truncate at 160px, or at two fifths of a narrow chart; the dots' tooltips name the row in full.
      yAxis.get('renderer').labels.template.setAll({ oversizedBehavior: 'truncate', maxWidth: Math.min(160, root.width() * 0.4), centerX: 0, paddingLeft: 0 });
      // Each row's line ties its dots together, so lines between the rows would only cut the plot up.
      yAxis.get('renderer').grid.template.set('forceHidden', true);
      const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, {
          // The dots mark places, not lengths from 0, so the axis fits the rows and the gaps read large enough to compare.
          ...(years ? { numberFormat: '#', maxPrecision: 0 } : {}),
          // Room at the right for the notes.
          extraMax: notes ? 0.18 : 0.02,
          renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }),
        }),
      );
      // A number at the plot's right edge would sit half outside the chart, so none is drawn there.
      xAxis.get('renderer').labels.template.set('maxPosition', 0.97);
      // The unit sits at the value axis's end, under its numbers.
      if (unit) xAxis.children.push(am5.Label.new(root, { text: unit, x: am5.p100, centerX: am5.p100, paddingTop: 4, paddingRight: 0 }));

      const write = (value: number) => (years ? String(value) : `${root.numberFormatter.format(value, tooltipNumberFormat)} ${unit}`);
      const data = rows.map(({ category, from, to, note }) => {
        const worseSide = worse === 'above' ? to > from : worse === 'below' ? to < from : false;
        const color = worse === 'none' ? colors.series[0] : worseSide ? colors.status.error : colors.neutral;
        const gap = years ? `${Math.abs(to - from)} years` : write(Math.abs(to - from));
        const side = to > from ? 'over' : to < from ? 'under' : 'at';
        return {
          category,
          from,
          to,
          end: Math.max(from, to),
          note: note ?? '',
          line: { fill: color, stroke: color },
          dot: { fill: color, stroke: colors.surface },
          // Each dot shows its exact value on hover, and the solid one the gap, since the axis rounds to compact numbers.
          fromTip: `${category}, ${fromName}: ${write(from)}`,
          toTip: `${category}, ${toName}: ${write(to)}${side === 'at' ? '' : ` (${gap} ${years ? 'away' : side})`}${note ? `\n${note}` : ''}`,
        };
      });

      // The gap: a line from one dot to the other, in the row's color.
      const gaps = chart.series.push(
        am5xy.ColumnSeries.new(root, { xAxis, yAxis, categoryYField: 'category', openValueXField: 'from', valueXField: 'to', clustered: false }),
      );
      gaps.columns.template.setAll({ height: 2, strokeOpacity: 0, templateField: 'line', tooltipText: '{toTip}' });

      // A series of dots at one end of each row: hollow at `from`, solid in the row's color at `to`.
      const dots = (field: 'from' | 'to', name: string, hollow: boolean) => {
        const stroke = hollow ? colors.reference : colors.series[0];
        const series = chart.series.push(
          am5xy.LineSeries.new(root, { name, xAxis, yAxis, categoryYField: 'category', valueXField: field, stroke, fill: hollow ? colors.surface : stroke }),
        );
        series.strokes.template.set('forceHidden', true);
        series.bullets.push((bulletRoot) =>
          am5.Bullet.new(bulletRoot, {
            sprite: am5.Circle.new(bulletRoot, {
              radius: dot,
              ...(hollow ? { fill: colors.surface, stroke: colors.reference, strokeWidth: 2 } : { strokeWidth: 2, templateField: 'dot' }),
              tooltipText: hollow ? '{fromTip}' : '{toTip}',
            }),
          }),
        );
        return series;
      };
      const fromDots = dots('from', fromName, true);
      const toDots = dots('to', toName, false);

      // The notes, at the right of each row's far dot.
      const noted = chart.series.push(am5xy.LineSeries.new(root, { xAxis, yAxis, categoryYField: 'category', valueXField: 'end' }));
      noted.strokes.template.set('forceHidden', true);
      noted.bullets.push((bulletRoot, _series, dataItem) => {
        const { note } = dataItem.dataContext as (typeof data)[number];
        if (!note) return undefined;
        return am5.Bullet.new(bulletRoot, { sprite: am5.Label.new(bulletRoot, { text: note, centerY: am5.p50, dx: dot + 4, populateText: false }) });
      });

      yAxis.data.setAll(data);
      for (const series of [gaps, fromDots, toDots, noted]) series.data.setAll(data);
    },
    [rows, fromName, toName, unit, worse, valueFormat, notes],
  );
  const ref = useChart(build);
  // The legend names each kind of dot: hollow for `from`, and solid for `to` in each color some row takes, said in words.
  const side = worse === 'above' ? 'over' : 'under';
  const worseRows = rows.filter(({ from, to }) => (worse === 'above' ? to > from : to < from)).length;
  const keys: { label: string; color: (theme: Theme) => string; hollow?: boolean }[] = [
    { label: fromName, color: (theme) => theme.palette.text.secondary, hollow: true },
    ...(worse === 'none'
      ? [{ label: toName, color: (theme: Theme) => theme.palette.chart.series[0] }]
      : [
          ...(worseRows > 0 ? [{ label: `${toName} ${side} ${fromName.toLowerCase()}`, color: (theme: Theme) => theme.palette.error.main }] : []),
          ...(worseRows < rows.length ? [{ label: `${toName} within ${fromName.toLowerCase()}`, color: (theme: Theme) => theme.palette.chart.neutral }] : []),
        ]),
  ];

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height: height ?? rows.length * 36 + 48 }} />
      <Stack component="figcaption" direction="row" sx={{ flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, mt: 1 }}>
        {keys.map(({ label, color, hollow }) => (
          <Stack key={label} direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Box
              aria-hidden
              sx={(theme) => ({ width: 8, height: 8, borderRadius: '50%', ...(hollow ? { border: `2px solid ${color(theme)}` } : { bgcolor: color(theme) }) })}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
