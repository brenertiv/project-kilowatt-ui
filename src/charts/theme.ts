import * as am5 from '@amcharts/amcharts5';
import type * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { decomposeColor, rgbToHex } from '@mui/material/styles';
import { createSchemeTheme } from '../mui/theme';
import type { ColorScheme } from '../mui/departures';
import { chartDepartures, type ChartThemeContext } from './departures';

/**
 * Kilowatt's amCharts 5 theme (Rules → Charts, Foundations → amCharts departures). amCharts draws
 * on a canvas and doesn't read the MUI theme, so this turns one scheme's palette into amCharts
 * rules. Every rule comes from a `theme` entry in `./departures`: chart code sets no colors of its
 * own, series take `chart.series` in order, and the chart's chrome takes the roles every component uses.
 */

const themes = { light: createSchemeTheme('light'), dark: createSchemeTheme('dark') };

/** A palette color as a solid hex: a translucent one (text.secondary) is blended over the surface, since the canvas has no CSS to blend it. */
function solid(color: string, surface: string): string {
  const fg = decomposeColor(color).values;
  const bg = decomposeColor(surface).values;
  const alpha = fg[3] ?? 1;
  return rgbToHex(`rgb(${[0, 1, 2].map((i) => Math.round(fg[i] * alpha + bg[i] * (1 - alpha))).join(', ')})`);
}

/**
 * The amCharts themes for one color scheme, for `root.setThemes()`, built from the `theme` entries in
 * `./departures` (it also sets the root's number format). `useChart` calls this; call it yourself only
 * for a root that `useChart` doesn't make.
 *
 * @param root - The chart's root.
 * @param scheme - The active color scheme, `light` or `dark`.
 * @param reducedMotion - Leaves out amCharts' animation theme when the user asks for reduced motion. Default `false`.
 */
export function chartThemes(root: am5.Root, scheme: ColorScheme, reducedMotion = false): am5.Theme[] {
  const mui = themes[scheme];
  const card = mui.palette.background.level3;
  const theme = am5.Theme.new(root);
  const context: ChartThemeContext = {
    root,
    theme,
    themes: [theme],
    mui,
    color: (value) => am5.color(solid(value, card)),
    card,
    reducedMotion,
    animated: () => am5themes_Animated.new(root),
  };
  // The theme is the departures' rules and nothing else (Foundations → amCharts departures).
  for (const departure of chartDepartures) departure.apply?.(context);
  return context.themes;
}

/** The palette's chart colors for one scheme, as amCharts colors, for a series that takes a slot rather than the next color in order. */
export function chartColors(scheme: ColorScheme) {
  const { palette } = themes[scheme];
  const card = palette.background.level3;
  const color = (value: string) => am5.color(solid(value, card));
  return {
    series: palette.chart.series.map(color),
    neutral: color(palette.chart.neutral),
    sequential: palette.chart.sequential.map(color),
    /** The card surface the chart sits on (background.level3), for a mark that shows the surface through it, such as a striped column. */
    surface: color(card),
    /** Range bands (weekends, schedules): action.hover over the card. */
    band: color(palette.action.hover),
    /** Target and reference lines, drawn dashed. */
    reference: color(palette.text.secondary),
    /** The intents, for a chart colored by status rather than by series (a score in its bands). Never both in one chart. */
    status: {
      success: color(palette.success.main),
      info: color(palette.info.main),
      warning: color(palette.warning.main),
      error: color(palette.error.main),
    },
  };
}

/** A status a chart can color by: one of the intents. */
export type ChartStatus = keyof ReturnType<typeof chartColors>['status'];

/** How value axes write their numbers: compact, in the viewer's locale (the `compact-axis-numbers` departure). */
export { axisNumberFormat } from './departures';

/**
 * How tooltips write a value: in full, with grouping and up to two decimals (61,240.5), never compact.
 * Axes round to compact numbers, so every chart item a pointer can rest on (a line point, a column, a
 * slice) shows its exact value in a tooltip. Use it in a tooltip's text: `{valueY.formatNumber('${tooltipNumberFormat}')}`.
 */
export const tooltipNumberFormat = '#,###.##';

/**
 * A chart's padding at its sides and bottom, in theme spacing units, when it sits straight in a `Card`:
 * `2` (16px) by default, in line with `CardContent` and the card's title; `1` (8px) for a tighter fit;
 * `0` to run edge to edge.
 */
export type ChartInset = 0 | 1 | 2;

/** How a series asks for its color: a fixed `slot` for a product meaning, `neutral` for what isn't the focus, or neither for the next free slot. */
export type SeriesColor = {
  /** The `chart.series` slot, 0 to 5, for a product meaning (`meaningColor` from `src/charts/meanings`), so it's one color on every chart. Default: the next free slot. */
  slot?: number;
  /** Draws it in `chart.neutral`: context, such as a baseline or the previous period, rather than the point. Default `false`. */
  neutral?: boolean;
};

/**
 * The color for each series, in order (Rules → Charts): `neutral` series take `chart.neutral`;
 * a series with a `slot` takes that series color; the rest take the free slots in order. Warns
 * past six colored series, where the rules say to group or use a table instead.
 */
export function seriesColors(series: SeriesColor[], colors: ReturnType<typeof chartColors>): am5.Color[] {
  return seriesSlots(series, colors.series.length).map((slot) => (slot === 'neutral' ? colors.neutral : colors.series[slot]));
}

/**
 * The `chart.series` slot each series takes, or `'neutral'`, by the rules `seriesColors` follows: for
 * HTML beside a chart (a swatch) that repeats a series' color from the palette.
 */
export function seriesSlots(series: SeriesColor[], count = 6): (number | 'neutral')[] {
  const taken = new Set(series.flatMap(({ slot, neutral }) => (neutral || slot === undefined ? [] : [slot])));
  const free = Array.from({ length: count }, (_, slot) => slot).filter((slot) => !taken.has(slot));
  const colored = series.filter(({ neutral }) => !neutral).length;
  if (colored > count) {
    console.warn(`A chart has ${colored} colored series; past ${count}, group the smallest or show a table (Rules → Charts).`);
  }
  return series.map(({ slot, neutral }) => (neutral ? 'neutral' : (slot ?? free.shift() ?? 0) % count));
}

/** A legend below the plot that wraps into up to three columns, so six series don't squeeze the plot. */
export function legend(root: am5.Root): am5.Legend {
  return am5.Legend.new(root, {
    width: am5.p100,
    paddingTop: 8,
    layout: am5.GridLayout.new(root, { maxColumns: 3 }),
  });
}

/** Each chart's row of unit labels, above the plot, made by the first `axisUnit` call. */
const unitRows = new WeakMap<am5xy.XYChart, am5.Container>();

/**
 * The unit of one value axis, as a small label above it, read horizontally, so every number on the axis
 * sits next to its unit (Rules → Charts → Units). The label is left-aligned with the axis's numbers on
 * whichever side the axis sits, and follows it if the chart resizes; an axis narrower than its unit widens to fit it. Call it once per value axis, after
 * pushing the axis to `chart.yAxes`. Two units at most; past two, split the chart.
 *
 * @param root - The chart's root.
 * @param chart - The XY chart the axis belongs to.
 * @param axis - The value axis the unit labels.
 * @param unit - The unit, as people write it: `kWh`, `kW`, `°F`, `USD`.
 */
export function axisUnit(root: am5.Root, chart: am5xy.XYChart, axis: am5xy.Axis<am5xy.AxisRenderer>, unit: string): am5.Label {
  let row = unitRows.get(chart);
  if (!row) {
    row = chart.children.unshift(am5.Container.new(root, { width: am5.p100, paddingBottom: 12 }));
    unitRows.set(chart, row);
  }
  const label = row.children.push(am5.Label.new(root, { text: unit, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }));
  const place = () => {
    // The axis's numbers start at its labels' left padding, inside the axis, on the left or right of the plot.
    const inset = axis.get('renderer').labels.values[0]?.get('paddingLeft') ?? 0;
    // A unit wider than the axis's numbers ("kWh" over "60K") widens the axis, so it isn't cut off at the chart's edge.
    const needed = Math.ceil(inset + label.width());
    if ((axis.get('minWidth') ?? 0) < needed) axis.set('minWidth', needed);
    const start = axis.parent === chart.rightAxesContainer ? chart.leftAxesContainer.width() + chart.plotContainer.width() : 0;
    label.set('x', start + inset);
  };
  chart.leftAxesContainer.events.on('boundschanged', place);
  chart.plotContainer.events.on('boundschanged', place);
  label.events.on('boundschanged', place);
  return label;
}

/** A target or benchmark the values are read against, drawn as a dashed line across the plot. */
export type ReferenceLine = {
  /** The value on the value axis. */
  value: number;
  /** What the line is, in sentence case: `Portfolio benchmark`. Its full value and unit follow it on the chart. */
  label: string;
  /** Sets the label under its line instead of above it, where the data runs just above the line. Default `false`. */
  labelBelow?: boolean;
};

/**
 * Draws targets and benchmarks on a value axis (the `reference-lines` departure): each a dashed line in
 * the reference color across the plot, labeled "Name: value unit" at the plot's left edge, above its line
 * (or below, with `labelBelow`), on a plate of the card surface. The labels sit over the series, so no line
 * runs through the text, at the left, where the oldest data is, so they never cover the latest values.
 * With `onLine`, each label is amCharts' own axis-range label instead: centered on its line at the plot's
 * edge beside the value axis, on a plate of the range-band color, moved with the line by amCharts.
 *
 * @param root - The chart's root.
 * @param chart - The XY chart the axis belongs to.
 * @param axis - The value axis the lines sit on.
 * @param references - The lines to draw.
 * @param unit - The axis's unit, written after each value.
 * @param colors - The chart colors from `useChart`.
 * @param onLine - Uses the axis range's own label, centered on its line beside the value axis on a plate of the range-band color, instead of a label at the plot's left edge. Default `false`.
 */
export function referenceLines(
  root: am5.Root,
  chart: am5xy.XYChart,
  axis: am5xy.ValueAxis<am5xy.AxisRenderer>,
  references: ReferenceLine[],
  unit: string,
  colors: ReturnType<typeof chartColors>,
  onLine = false,
) {
  for (const { value, label, labelBelow } of references) {
    const item = axis.makeDataItem({ value });
    axis.createAxisRange(item);
    const grid = item.get('grid');
    // forceHidden: false, since a chart that hides its axis's own grid (a sparkline) still shows its references.
    grid?.setAll({ forceHidden: false, stroke: colors.reference, strokeOpacity: 1, strokeDasharray: [4, 4], location: 0 });
    const text = `${label}: ${root.numberFormatter.format(value, tooltipNumberFormat)} ${unit}`;
    if (onLine) {
      // amCharts' own label for the range: inside the plot beside the axis, centered on the line, and moved with it.
      item.get('label')?.setAll({
        text,
        inside: true,
        location: 0,
        // Right-aligned to the axis, so the label runs into the plot. amCharts' own rule for inside labels
        // keys on a tag the label gets only when it's made inside, so the anchor is set here.
        centerX: am5.p100,
        centerY: am5.p50,
        fill: colors.reference,
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 8,
        paddingRight: 8,
        background: am5.Rectangle.new(root, { fill: colors.band, fillOpacity: 1 }),
      });
      continue;
    }
    item.get('label')?.set('forceHidden', true);
    // The label is the plot's own, not the axis range's, so it sits over the series at the left edge whichever side the axis is on.
    const plate = chart.plotContainer.children.push(
      am5.Label.new(root, {
        text,
        fill: colors.reference,
        x: 0,
        centerY: labelBelow ? 0 : am5.p100,
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 4,
        paddingRight: 4,
        background: am5.Rectangle.new(root, { fill: colors.surface, fillOpacity: 1 }),
      }),
    );
    // The label takes its height from the line itself, which amCharts moves on every redraw (zooming, the axis
    // rescaling, its animation), so the two never part. Both sit in the plot's coordinates.
    const follow = () => plate.set('y', grid?.y() ?? 0);
    grid?.on('y', follow);
    follow();
    // When zooming takes the line out of the plot, its label goes too.
    grid?.onPrivate('visible', (visible) => plate.set('visible', visible !== false));
  }
}
