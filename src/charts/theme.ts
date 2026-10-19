import * as am5 from '@amcharts/amcharts5';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { decomposeColor, rgbToHex } from '@mui/material/styles';
import { createSchemeTheme } from '../mui/theme';
import type { ColorScheme } from '../mui/departures';

/**
 * Kilowatt's amCharts 5 theme (Rules → Charts, the `amcharts-theme` departure). amCharts draws
 * on a canvas and doesn't read the MUI theme, so this turns one scheme's palette into amCharts
 * rules. Chart code sets no colors of its own: series take `chart.series` in order, and the
 * chart's chrome takes the roles every component uses.
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
 * The amCharts themes for one color scheme, for `root.setThemes()`. `useChart` calls this; call
 * it yourself only for a root that `useChart` doesn't make.
 *
 * @param root - The chart's root.
 * @param scheme - The active color scheme, `light` or `dark`.
 * @param reducedMotion - Leaves out amCharts' animation theme when the user asks for reduced motion. Default `false`.
 */
export function chartThemes(root: am5.Root, scheme: ColorScheme, reducedMotion = false): am5.Theme[] {
  const { palette, typography } = themes[scheme];
  const card = palette.background.level1;
  const color = (value: string) => am5.color(solid(value, card));

  const theme = am5.Theme.new(root);
  theme.rule('InterfaceColors').setAll({
    background: color(card),
    fill: color(card),
    stroke: color(card),
    grid: color(palette.border.level1),
    text: color(palette.text.secondary),
    alternativeBackground: color(palette.text.primary),
    alternativeText: color(card),
    disabled: color(palette.text.disabled),
    positive: color(palette.success.main),
    negative: color(palette.error.main),
    warning: color(palette.warning.main),
    primaryButton: color(palette.primary.main),
    primaryButtonHover: color(palette.primary.dark),
    primaryButtonDown: color(palette.primary.dark),
    primaryButtonActive: color(palette.primary.dark),
    primaryButtonText: color(palette.primary.contrastText),
    primaryButtonStroke: color(palette.primary.main),
    secondaryButton: color(palette.background.level3),
    secondaryButtonHover: color(palette.background.level4),
    secondaryButtonDown: color(palette.background.level4),
    secondaryButtonActive: color(palette.background.level4),
    secondaryButtonText: color(palette.text.primary),
    secondaryButtonStroke: color(palette.border.level1),
  });

  // Data colors: the six series hues in order, used as they are (no lightening on a second pass).
  theme.rule('ColorSet').setAll({ colors: palette.chart.series.map(color), step: 1, reuse: true, passOptions: {} });

  // Labels and ticks: text.secondary in the caption style.
  theme.rule('Label').setAll({
    fontFamily: typography.fontFamily,
    fontSize: typography.caption.fontSize,
    fill: color(palette.text.secondary),
  });

  // Gridlines at full strength in border.level1, the divider; the grid interface color sets the stroke.
  theme.rule('Grid').setAll({ strokeOpacity: 1 });

  // Tooltips on the menu surface with primary text, outlined like a menu, rather than filled in the series color.
  theme.rule('Tooltip').setAll({ getFillFromSprite: false, getStrokeFromSprite: false, autoTextColor: false });
  theme.rule('PointedRectangle', ['tooltip', 'background']).setAll({
    fill: color(palette.background.level3),
    fillOpacity: 1,
    stroke: color(palette.border.level1),
    strokeOpacity: 1,
    cornerRadius: Number(themes[scheme].shape.borderRadius),
  });
  theme.rule('Label', ['tooltip']).setAll({ fill: color(palette.text.primary) });

  return reducedMotion ? [theme] : [am5themes_Animated.new(root), theme];
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
