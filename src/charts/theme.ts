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
  const card = mui.palette.background.level1;
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
  const card = palette.background.level1;
  const color = (value: string) => am5.color(solid(value, card));
  return {
    series: palette.chart.series.map(color),
    neutral: color(palette.chart.neutral),
    sequential: palette.chart.sequential.map(color),
    /** The card surface the chart sits on (background.level1), for a mark that shows the surface through it, such as a striped column. */
    surface: color(card),
    /** Range bands (weekends, schedules): action.hover over the card. */
    band: color(palette.action.hover),
    /** Target and reference lines, drawn dashed. */
    reference: color(palette.text.secondary),
  };
}

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
export type SeriesColor = { slot?: number; neutral?: boolean };

/**
 * The color for each series, in order (Rules → Charts): `neutral` series take `chart.neutral`;
 * a series with a `slot` takes that series color; the rest take the free slots in order. Warns
 * past six colored series, where the rules say to group or use a table instead.
 */
export function seriesColors(series: SeriesColor[], colors: ReturnType<typeof chartColors>): am5.Color[] {
  const taken = new Set(series.flatMap(({ slot, neutral }) => (neutral || slot === undefined ? [] : [slot])));
  const free = colors.series.map((_, slot) => slot).filter((slot) => !taken.has(slot));
  const colored = series.filter(({ neutral }) => !neutral).length;
  if (colored > colors.series.length) {
    console.warn(`A chart has ${colored} colored series; past ${colors.series.length}, group the smallest or show a table (Rules → Charts).`);
  }
  return series.map(({ slot, neutral }) => {
    if (neutral) return colors.neutral;
    const index = slot ?? free.shift() ?? 0;
    return colors.series[index % colors.series.length];
  });
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
