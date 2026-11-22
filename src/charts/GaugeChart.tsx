import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { StatusBand } from './LineChart';
import { tooltipNumberFormat, type ChartInset } from './theme';
import { useChart, type ChartContext } from './useChart';

/** A threshold the reading is judged against, marked on the arc and named under it. */
export type GaugeReference = {
  /** The value on the gauge's scale. */
  value: number;
  /** What the threshold is, in sentence case: `Certification`. Its value and unit follow it under the gauge. */
  label: string;
};

export type GaugeChartProps = {
  /** The reading the needle points at. It may change: the needle moves to the new value without the chart being rebuilt. */
  value: number;
  /** What the reading is, in sentence case, shown in the needle's tooltip: `ENERGY STAR score`. */
  name: string;
  /** The unit of the reading, shown after the number under the gauge and in the tooltip: `pts`, `%`. */
  unit: string;
  /** One sentence on the reading, with the numbers that matter. It isn't shown: it's the figure's accessible name, the gauge's text alternative for screen readers. */
  summary: string;
  /** The bottom of the scale. Default `0`. */
  min?: number;
  /** The top of the scale. Default `100`. */
  max?: number;
  /** The bands the reading is read in, each with its name (`scoreBands` from `src/charts/meanings`): the band the reading falls in is named under the number, so the arc's color isn't the only signal. Keep it stable. Default none. */
  bands?: StatusBand[];
  /** Up to two thresholds (a certification score, a target), each a tick across the arc, named with its value under the gauge. Keep it stable (a constant or `useMemo`). Default none. */
  references?: GaugeReference[];
  /** Runs the arc from `success` at the low end to `error` at the high end, for a reading where less is better (energy use intensity). Default `false`: more is better. */
  lowerIsBetter?: boolean;
  /** The gauge's height in pixels, the reading under it not included. Default `160`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

const noBands: StatusBand[] = [];
const noReferences: GaugeReference[] = [];

/** The reading and the thresholds under the gauge, formatted with Intl (Rules → Content and layout). */
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

/** A value with its unit: a space between them, except before a percent sign. */
const withUnit = (value: string, unit: string) => (unit === '%' ? `${value}%` : `${value} ${unit}`);

/**
 * A gauge of one reading on a fixed scale, in Kilowatt's chart theme (Rules → Charts): a reference
 * implementation that Enertiv's app rebuilds. A half-circle arc filled with a gradient of the intents
 * (`error` through `warning` to `success`, or the reverse with `lowerIsBetter`), since a reading on
 * a scale of worse to better is status, and a needle at the reading. The number, its unit and the name
 * of its band sit under the arc as text, so nothing rests on the color; up to two `references` are
 * ticks across the arc, named under it. The needle moves when `value` changes. The chart sits in a
 * `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A half-circle gauge of one reading on a scale of worse to better, with the number and its band under it.
 * @import import { GaugeChart } from 'src/charts/GaugeChart';
 */
export function GaugeChart({
  value,
  name,
  unit,
  summary,
  min = 0,
  max = 100,
  bands = noBands,
  references = noReferences,
  lowerIsBetter = false,
  height = 160,
  inset = 2,
}: GaugeChartProps) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  // The needle of the chart now on screen, so a new value moves it rather than rebuilding the chart.
  const needle = useRef<{ item: am5.DataItem<am5xy.IValueAxisDataItem>; hand: am5radar.ClockHand; format: (reading: number) => string } | null>(null);
  const reading = useRef(value);
  useLayoutEffect(() => {
    reading.current = value;
  }, [value]);

  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      if (references.length > 2) console.warn('A GaugeChart has more than two references; past two, the arc has no room to mark them.');
      // The top half of a circle: the scale runs left to right.
      const chart = root.container.children.push(am5radar.RadarChart.new(root, { panX: false, panY: false, startAngle: 180, endAngle: 360, radius: am5.percent(92), paddingTop: 0, paddingBottom: 0 }));
      // A reading on a scale of worse to better is status, so the arc runs through the intents, worse side first.
      const stops = [colors.status.error, colors.status.warning, colors.status.success];
      const renderer = am5radar.AxisRendererCircular.new(root, {
        innerRadius: -10,
        strokeOpacity: 1,
        strokeWidth: 12,
        minGridDistance: 40,
        strokeGradient: am5.LinearGradient.new(root, { rotation: 0, stops: (lowerIsBetter ? stops.reverse() : stops).map((color) => ({ color })) }),
      });
      // The arc is the scale; spokes across the gauge would add nothing.
      renderer.grid.template.set('forceHidden', true);
      // The scale's numbers read level, outside the arc, rather than bent along it.
      renderer.labels.template.setAll({ textType: 'adjusted', radius: 8 });
      const axis = chart.xAxes.push(am5xy.ValueAxis.new(root, { maxDeviation: 0, min, max, strictMinMax: true, renderer }));

      // Thresholds: a tick across the arc in the reference color, named under the gauge.
      for (const reference of references) {
        const item = axis.makeDataItem({ value: reference.value });
        axis.createAxisRange(item);
        item.get('grid')?.set('forceHidden', true);
        item.get('label')?.set('forceHidden', true);
        item.get('tick')?.setAll({ forceHidden: false, visible: true, stroke: colors.reference, strokeOpacity: 1, strokeWidth: 2, length: 18, inside: true });
      }

      const item = axis.makeDataItem({});
      item.set('value', Math.min(max, Math.max(min, reading.current)));
      const hand = am5radar.ClockHand.new(root, { radius: am5.percent(88), pinRadius: 6, bottomWidth: 8, topWidth: 1 });
      // The needle shows the exact reading on hover, since the arc's numbers are only its scale.
      const format = (current: number) => `${name}: ${withUnit(root.numberFormatter.format(current, tooltipNumberFormat), unit)}`;
      hand.hand.set('tooltipText', format(reading.current));
      hand.pin.set('tooltipText', format(reading.current));
      item.set('bullet', am5xy.AxisBullet.new(root, { sprite: hand }));
      axis.createAxisRange(item);
      item.get('grid')?.set('forceHidden', true);
      item.get('label')?.set('forceHidden', true);
      item.get('tick')?.set('forceHidden', true);
      needle.current = { item, hand, format };
    },
    [name, unit, min, max, references, lowerIsBetter],
  );
  const ref = useChart(build);

  // A new reading swings the needle to it, at once under reduced motion.
  useEffect(() => {
    const current = needle.current;
    if (!current || current.item.isDisposed()) return;
    current.item.animate({ key: 'value', to: Math.min(max, Math.max(min, value)), duration: reducedMotion ? 0 : 600, easing: am5.ease.out(am5.ease.cubic) });
    current.hand.hand.set('tooltipText', current.format(value));
    current.hand.pin.set('tooltipText', current.format(value));
  }, [value, min, max, reducedMotion]);

  const band = bands.find(({ from, to }) => value >= from && value <= to);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset, textAlign: 'center' }}>
      <Box ref={ref} sx={{ height }} />
      {/* The reading as text in the page's type, with its band named, so the value reads without the arc's color. */}
      <Typography variant="h2" component="p" sx={{ mt: 1, fontVariantNumeric: 'tabular-nums' }}>
        {number.format(value)}
        <Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>
          {unit === '%' ? '' : ' '}
          {unit}
        </Typography>
      </Typography>
      {band && <Typography variant="body2">{band.label}</Typography>}
      {references.length > 0 && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {references.map(({ value: at, label }) => `${label}: ${withUnit(number.format(at), unit)}`).join(' · ')}
        </Typography>
      )}
    </Box>
  );
}
