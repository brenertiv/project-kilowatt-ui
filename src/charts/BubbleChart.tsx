import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { axisUnit, seriesColors, seriesSlots, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One measure of a bubble chart: the field that holds it, what it is, and its unit. */
export type BubbleMeasure = {
  /** The field in each row that holds the measure. */
  field: string;
  /** What the measure is, in sentence case, in the caption and the tooltips: `Upfront cost`. */
  name: string;
  /** Its unit, on the axis and in the tooltips: `USD`, `tCO₂e`. */
  unit: string;
};

/** One group of bubbles, colored apart: the value in `groupField` it collects, its name in the legend, and how it takes its color. */
export type BubbleGroup = SeriesColor & {
  /** The value of `groupField` its rows hold. */
  value: string;
  /** The group's name in the legend and tooltips, in sentence case. Default: `value`. */
  name?: string;
};

export type BubbleChartProps = {
  /** The items, one bubble each, with a name in `labelField` and a number per measure. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, string | number>[];
  /** The field in each row that holds the item's name, in its tooltip. */
  labelField: string;
  /** The measure across, along the bottom: `Upfront cost`. */
  x: BubbleMeasure;
  /** The measure up, on the left: `Annual savings`. */
  y: BubbleMeasure;
  /** The measure each bubble's area shows: `Avoided emissions`. */
  size: BubbleMeasure;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The field in each row that holds the item's group, for bubbles colored by group. Default: none, every bubble in the first series color. */
  groupField?: string;
  /** The groups, in legend order, when `groupField` is set. Up to six. Keep it stable, like `data`. */
  groups?: BubbleGroup[];
  /** The plot's height in pixels. Default `320`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** The largest bubble's radius, and the smallest any bubble gets, so every one stays big enough to rest a pointer on. */
const radius = { max: 28, min: 5 };

const noGroups: BubbleGroup[] = [];

/**
 * A bubble chart: items placed by two measures and sized by a third, in Kilowatt's chart theme
 * (Rules → Charts). It's a reference implementation that Enertiv's app rebuilds. Each item is a
 * bubble across by `x` (upfront cost) and up by `y` (annual savings), whose area, not its radius,
 * is its `size` (avoided emissions), so a bubble twice another's area is twice its amount. Bubbles take
 * the first series color, or a `chart.series` color per group, named in an HTML legend under the plot; they're ringed in the card
 * surface and drawn largest first, so smaller ones sit on top. Both axes start at 0, and a caption under
 * the plot names the three measures. The chart sits in a `figure` named by `summary`. Put it in a `Card`
 * under a `CardHeader`.
 *
 * @summary A bubble chart: items placed by two measures and sized by area by a third.
 * @import import { BubbleChart } from 'src/charts/BubbleChart';
 */
export function BubbleChart({ data, labelField, x, y, size, summary, groupField, groups = noGroups, height = 320, inset = 2 }: BubbleChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      // Both measures are amounts, so both axes start at 0; a little room past the data keeps the largest bubbles inside.
      const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, { min: 0, extraMax: 0.08, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }) }));
      xAxis.get('renderer').labels.template.set('maxPosition', 0.97);
      // The across unit sits at the value axis's end, under its numbers.
      xAxis.children.push(am5.Label.new(root, { text: x.unit, x: am5.p100, centerX: am5.p100, paddingTop: 4, paddingRight: 0 }));
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, extraMax: 0.1, renderer: am5xy.AxisRendererY.new(root, { opposite: false }) }));
      axisUnit(root, chart, yAxis, y.unit);

      // A bubble's area is its size, so its radius is the square root of its share of the largest.
      const largest = Math.max(...data.map((row) => Number(row[size.field]) || 0), 1);
      const write = (value: number, unit: string) => `${root.numberFormatter.format(value, tooltipNumberFormat)} ${unit}`;
      const sets = groupField && groups.length ? groups : [{ value: '', name: '' }];
      const fills = seriesColors(sets, colors);
      sets.forEach((group, g) => {
        const rows = data
          .filter((row) => !groupField || !groups.length || row[groupField] === group.value)
          .map((row) => ({
            ...row,
            // Largest first, so smaller bubbles sit on top of the ones they overlap.
            bubble: { radius: Math.max(radius.min, radius.max * Math.sqrt((Number(row[size.field]) || 0) / largest)) },
            tip: [
              `${row[labelField]}${group.name ? ` (${group.name})` : ''}`,
              `${x.name}: ${write(Number(row[x.field]), x.unit)}`,
              `${y.name}: ${write(Number(row[y.field]), y.unit)}`,
              `${size.name}: ${write(Number(row[size.field]), size.unit)}`,
            ].join('\n'),
          }))
          .sort((a, b) => b.bubble.radius - a.bubble.radius);
        const fill = fills[g];
        const series = chart.series.push(
          am5xy.LineSeries.new(root, { name: group.name ?? group.value, xAxis, yAxis, valueXField: x.field, valueYField: y.field, stroke: fill, fill }),
        );
        series.strokes.template.set('forceHidden', true);
        series.bullets.push((bulletRoot) =>
          am5.Bullet.new(bulletRoot, {
            // Ringed in the card surface, so overlapping bubbles stay apart. Each shows its three measures on hover.
            sprite: am5.Circle.new(bulletRoot, { fill, stroke: colors.surface, strokeWidth: 1.5, templateField: 'bubble', tooltipText: '{tip}' }),
          }),
        );
        series.data.setAll(rows);
      });
    },
    [data, labelField, x, y, size, groupField, groups],
  );
  const ref = useChart(build);
  // With groups, a legend in HTML under the plot names each, marked by a dot in its color: amCharts would mark a group with a whole bubble.
  const slots = seriesSlots(groups);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
      {groupField && groups.length > 1 && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, mt: 1 }}>
          {groups.map((group, g) => (
            <Stack key={group.value} direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <Box
                aria-hidden
                sx={({ palette: { chart } }) => {
                  const slot = slots[g];
                  return { width: 8, height: 8, borderRadius: '50%', bgcolor: slot === 'negative' ? chart.seriesShade : slot === 'neutral' ? chart.neutral : chart.series[slot] };
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {group.name ?? group.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
      {/* The three measures in words, since the axes carry only their units. */}
      <Typography component="figcaption" variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
        Across: {x.name.toLowerCase()} ({x.unit}). Up: {y.name.toLowerCase()} ({y.unit}). Bubble area: {size.name.toLowerCase()} ({size.unit}).
      </Typography>
    </Box>
  );
}
