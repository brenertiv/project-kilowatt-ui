import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { createSchemeTheme } from '../mui/theme';
import type { StatusBand } from './LineChart';
import { tooltipNumberFormat, type ChartInset } from './theme';
import { useChart, type ChartContext } from './useChart';

export type RangeChartProps = {
  /** The property's reading, marked on the track and written above it. */
  value: number;
  /** What the reading is, in sentence case, shown before the number and in the marker's tooltip: `Site EUI`. */
  name: string;
  /** The unit of the reading, after the number, in the tooltips and in the summary: `kBtu/sq ft`. */
  unit: string;
  /** The value the reading is judged against (the median for the property's type), a tick across the track, named under it and written beside the reading. */
  benchmark: number;
  /** The ranges the track is divided into, each with its intent and its name (`StatusBand`): below, within and above the expected range. The band the reading falls in colors the number and the marker and is named under the number. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  bands: StatusBand[];
  /** One sentence on the reading, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** What the benchmark is, in sentence case, under its tick and beside the reading. Default `'Benchmark'`. */
  benchmarkName?: string;
  /** The top of the track. Default: the top of the highest band. A reading past it is marked at the track's end. */
  max?: number;
  /** The track's height in pixels, its labels included; the reading above it is not. Default `56`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** The reading and the benchmark above the track, formatted with Intl (Rules → Content and layout). */
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

/** The track's corners take the theme radius, as every rounded component does; the track is twice it tall, so its ends are round. */
const radius = Number(createSchemeTheme('light').shape.borderRadius);

/** The marker's radius, and the room the chart leaves at each side so a marker at either end of the track isn't cut off. */
const marker = 8;

/** How strongly a band is tinted with its intent over the card: strong enough that each band reads as its intent in both schemes, and short of full strength, so the marker, in the same intent at full strength and ringed in the card surface, still stands out on its band. */
const bandOpacity = 0.4;

/**
 * A range chart: one property's reading on a track from 0, against a benchmark and the range it's
 * expected to fall in, in Kilowatt's chart theme (Rules → Charts). It's a reference implementation that
 * Enertiv's app rebuilds. The track is divided into `bands` (below, within and above the expected
 * range), each tinted with its intent; the benchmark is a tick across the track, named under it; and
 * the reading is a dot on the track in its band's intent. Above the track the reading is written as
 * text, in the same intent, with its unit, the benchmark and the name of its band, so nothing rests on
 * the color. The chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A range chart: one property's reading on a track, against a benchmark and its expected range.
 * @import import { RangeChart } from 'src/charts/RangeChart';
 */
export function RangeChart({ value, name, unit, benchmark, bands, summary, benchmarkName = 'Benchmark', max, height = 56, inset = 2 }: RangeChartProps) {
  const top = max ?? Math.max(benchmark, ...bands.map(({ to }) => to));
  const band = bands.find(({ from, to }) => value >= from && value <= to);

  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { paddingLeft: marker + 2, paddingRight: marker + 2, paddingTop: 0, paddingBottom: 0 }));
      // One row, the property's, with no label of its own: the card's title names the property or the measure.
      const rows = am5xy.AxisRendererY.new(root, {});
      rows.labels.template.set('forceHidden', true);
      rows.grid.template.set('forceHidden', true);
      const rowAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, { categoryField: 'row', renderer: rows }));
      rowAxis.data.setAll([{ row: name }]);
      // The track runs from 0, so the reading's place is an amount. Only its ends and the benchmark are labeled.
      const scale = am5xy.AxisRendererX.new(root, {});
      scale.labels.template.set('forceHidden', true);
      scale.grid.template.set('forceHidden', true);
      const valueAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, { min: 0, max: top, strictMinMax: true, renderer: scale }));
      const label = (at: number, text: string, centerX: number | am5.Percent) => {
        const item = valueAxis.makeDataItem({ value: at });
        valueAxis.createAxisRange(item);
        item.get('label')?.setAll({ forceHidden: false, text, centerX, paddingLeft: 0, paddingRight: 0 });
        return item;
      };
      // The ends are written in the axis's compact numbers, each aligned inward so it stays inside the chart.
      label(0, root.numberFormatter.format(0), 0);
      label(top, root.numberFormatter.format(top), am5.p100);

      // The bands: the track's parts, each tinted with its intent, the first and last rounded at the track's ends.
      const ordered = [...bands].sort((a, b) => a.from - b.from);
      ordered.forEach(({ from, to, status, label: bandName }, i) => {
        const part = chart.series.push(
          am5xy.ColumnSeries.new(root, { xAxis: valueAxis, yAxis: rowAxis, categoryYField: 'row', openValueXField: 'from', valueXField: 'to', clustered: false }),
        );
        const first = i === 0 ? radius : 0;
        const last = i === ordered.length - 1 ? radius : 0;
        part.columns.template.setAll({
          height: radius * 2,
          fill: colors.status[status],
          fillOpacity: bandOpacity,
          strokeOpacity: 0,
          cornerRadiusTL: first,
          cornerRadiusBL: first,
          cornerRadiusTR: last,
          cornerRadiusBR: last,
          // Each band names itself and its ends on hover, since the track's own labels are only its two ends.
          tooltipText: `${bandName}: {openValueX.formatNumber('${tooltipNumberFormat}')}–{valueX.formatNumber('${tooltipNumberFormat}')} ${unit}`,
        });
        part.data.setAll([{ row: name, from, to: Math.min(to, top) }]);
      });

      // The benchmark: a tick across the track in the reference color, taller than the track, named under it.
      const reference = label(benchmark, benchmarkName, am5.p50);
      reference.get('grid')?.setAll({ forceHidden: false, stroke: colors.reference, strokeOpacity: 1, strokeWidth: 2 });

      // The reading: a dot on the track in its band's intent, ringed in the card surface, with its exact value on hover.
      const reading = chart.series.push(am5xy.LineSeries.new(root, { xAxis: valueAxis, yAxis: rowAxis, categoryYField: 'row', valueXField: 'at' }));
      reading.strokes.template.set('forceHidden', true);
      const fill = band ? colors.status[band.status] : colors.reference;
      reading.bullets.push((bulletRoot) =>
        am5.Bullet.new(bulletRoot, {
          sprite: am5.Circle.new(bulletRoot, {
            radius: marker,
            fill,
            stroke: colors.surface,
            strokeWidth: 3,
            tooltipText: `${name}: ${root.numberFormatter.format(value, tooltipNumberFormat)} ${unit}${band ? ` (${band.label})` : ''}`,
          }),
        }),
      );
      // A reading past the track's end is marked at the end; its tooltip and the text above keep the real value.
      reading.data.setAll([{ row: name, at: Math.min(top, Math.max(0, value)) }]);
    },
    [value, name, unit, benchmark, bands, benchmarkName, top, band],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      {/* The reading as text in the page's type, with its unit, the benchmark and its band's name, so it reads without the track or its color. */}
      <Stack direction="row" sx={{ alignItems: 'baseline', columnGap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {name}
        </Typography>
        <Typography variant="h2" component="p" sx={{ fontVariantNumeric: 'tabular-nums', color: band ? `${band.status}.main` : 'text.primary' }}>
          {number.format(value)}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {unit} · {benchmarkName}{' '}
          <Box component="span" sx={{ color: 'text.primary' }}>
            {number.format(benchmark)}
          </Box>
        </Typography>
      </Stack>
      {band && <Typography variant="body2">{band.label}</Typography>}
      <Box ref={ref} sx={{ height, mt: 1 }} />
    </Box>
  );
}
