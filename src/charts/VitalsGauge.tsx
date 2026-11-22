import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { seriesColors, seriesSlots, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One reading on its own scale, and how it takes its color: a fixed `slot` for a product meaning, or none for the next free slot. */
export type Vital = SeriesColor & {
  /** What the reading is, in sentence case, shown in the legend and the tooltip: `Demand`. Unique within the gauge. */
  name: string;
  /** The reading. It may change: the needle moves to the new value without the chart being rebuilt. */
  value: number;
  /** The top of this reading's scale. */
  max: number;
  /** The bottom of this reading's scale. Default `0`. */
  min?: number;
  /** The unit of the reading, after its value in the legend and the tooltip: `kW`, `%`. */
  unit: string;
};

export type VitalsGaugeProps = {
  /** Two to four readings, clockwise from the top. Keep the array stable (a constant or `useMemo`); when only the values change, the needles move and the chart isn't rebuilt. */
  vitals: Vital[];
  /** One sentence on the readings, with the numbers that matter. It isn't shown: it's the figure's accessible name, the gauge's text alternative for screen readers. */
  summary: string;
  /** The ring's height in pixels, the legend not included. Default `260`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** The readings in the legend, formatted with Intl (Rules → Content and layout). */
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

/** The gap between two arcs, in degrees. */
const gap = 10;

/** A value with its unit: a space between them, except before a percent sign. */
const withUnit = (value: string, unit: string) => (unit === '%' ? `${value}%` : `${value} ${unit}`);

/**
 * A gauge in parts: two to four readings around one ring, each on its own arc with its own scale and
 * needle, in Kilowatt's chart theme (Rules → Charts). It's a reference implementation that Enertiv's
 * app rebuilds. Each arc and its needle take a `chart.series` color in order, or a fixed `slot`, and
 * the legend under the ring names each reading with its value and unit, so no reading rests on its
 * color. The needles move when the values change. For readings that share a scale, use a column
 * chart; for one reading judged from worse to better, a `GaugeChart`. The chart sits in a `figure`
 * named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A ring of two to four gauges, each reading on its own scale, named with their values in a legend.
 * @import import { VitalsGauge } from 'src/charts/VitalsGauge';
 */
export function VitalsGauge({ vitals, summary, height = 260, inset = 2 }: VitalsGaugeProps) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  // The needles of the chart now on screen, by reading, so new values move them rather than rebuilding the chart.
  const needles = useRef<{ item: am5.DataItem<am5xy.IValueAxisDataItem>; hand: am5radar.ClockHand; format: (reading: number) => string }[]>([]);
  const latest = useRef(vitals);
  useLayoutEffect(() => {
    latest.current = vitals;
  }, [vitals]);
  // What the chart is built from: everything but the values, as a string, so it's rebuilt only when a scale, name or color changes.
  const shape = JSON.stringify(vitals.map(({ name, min = 0, max, unit, slot, neutral }) => [name, min, max, unit, slot, neutral]));
  const values = vitals.map(({ value }) => value).join(' ');

  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const parts = latest.current;
      if (parts.length < 2 || parts.length > 4) console.warn('A VitalsGauge takes two to four readings; past four, the arcs are too short to read.');
      const chart = root.container.children.push(am5radar.RadarChart.new(root, { panX: false, panY: false, radius: am5.percent(88), innerRadius: -16 }));
      const fills = seriesColors(parts, colors);
      const span = 360 / parts.length;
      needles.current = parts.map(({ name, value, min = 0, max, unit }, i) => {
        // Clockwise from the top, each arc its share of the ring less the gap.
        const startAngle = -90 + i * span + gap / 2;
        const renderer = am5radar.AxisRendererCircular.new(root, { startAngle, endAngle: startAngle + span - gap, strokeOpacity: 0, minGridDistance: 30 });
        renderer.grid.template.set('forceHidden', true);
        // The scale's numbers read level, outside the arc, rather than bent along it.
        renderer.labels.template.setAll({ textType: 'adjusted', radius: 10 });
        renderer.ticks.template.setAll({ visible: true, strokeOpacity: 1 });
        const axis = chart.xAxes.push(am5xy.ValueAxis.new(root, { maxDeviation: 0, min, max, strictMinMax: true, renderer }));
        // The arc: the whole scale, filled in the reading's color.
        const scale = axis.makeDataItem({ value: min, endValue: max });
        axis.createAxisRange(scale);
        scale.get('tick')?.set('forceHidden', true);
        scale.get('label')?.set('forceHidden', true);
        scale.get('grid')?.set('forceHidden', true);
        scale.get('axisFill')?.setAll({ visible: true, fill: fills[i], fillOpacity: 1, strokeOpacity: 0 });
        // The needle: a short hand at the rim, in the reading's color, ringed in the card surface so it shows over its arc.
        const item = axis.makeDataItem({ value: Math.min(max, Math.max(min, value)) });
        const hand = am5radar.ClockHand.new(root, { radius: am5.percent(100), innerRadius: am5.percent(62), bottomWidth: 10, topWidth: 1 });
        hand.pin.set('forceHidden', true);
        const format = (current: number) => `${name}: ${withUnit(root.numberFormatter.format(current, tooltipNumberFormat), unit)}`;
        hand.hand.setAll({ fill: fills[i], fillOpacity: 1, stroke: colors.surface, strokeWidth: 2, strokeOpacity: 1, tooltipText: format(value) });
        item.set('bullet', am5xy.AxisBullet.new(root, { sprite: hand }));
        axis.createAxisRange(item);
        item.get('tick')?.set('forceHidden', true);
        item.get('label')?.set('forceHidden', true);
        item.get('grid')?.set('forceHidden', true);
        return { item, hand, format };
      });
    },
    // The readings come through `latest`; `shape` is everything about them but their values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shape],
  );
  const ref = useChart(build);

  // New readings swing the needles to them, at once under reduced motion.
  useEffect(() => {
    latest.current.forEach(({ value, min = 0, max }, i) => {
      const needle = needles.current[i];
      if (!needle || needle.item.isDisposed()) return;
      needle.item.animate({ key: 'value', to: Math.min(max, Math.max(min, value)), duration: reducedMotion ? 0 : 600, easing: am5.ease.out(am5.ease.cubic) });
      needle.hand.hand.set('tooltipText', needle.format(value));
    });
  }, [values, shape, reducedMotion]);

  const slots = seriesSlots(vitals);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
      {/* The legend names each reading with its value and unit, so a reading doesn't rest on its color or its needle. */}
      <Stack component="ul" direction="row" sx={{ listStyle: 'none', m: 0, p: 0, pt: 1.5, columnGap: 2, rowGap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {vitals.map(({ name, value, unit }, i) => {
          const slot = slots[i];
          return (
            <Stack key={name} component="li" direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <Box
                aria-hidden
                sx={(theme) => {
                  const { chart } = (theme.vars ?? theme).palette;
                  return { width: 8, height: 8, flex: 'none', borderRadius: '50%', bgcolor: slot === 'negative' ? chart.seriesShade : slot === 'neutral' ? chart.neutral : chart.series[slot] };
                }}
              />
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {name}{' '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {withUnit(number.format(value), unit)}
                </Box>
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
