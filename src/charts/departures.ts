import type * as am5 from '@amcharts/amcharts5';
import type { Theme } from '@mui/material/styles';

/**
 * Every way Kilowatt's charts depart from stock amCharts 5, and nothing else.
 *
 * `theme` entries are applied to every chart: `chartThemes` (`src/charts/theme.ts`) is built from
 * them and sets nothing of its own, so this list and the running chart theme cannot disagree.
 * `convention` entries are what each reference chart does in its own code, and
 * `departures.test.ts` checks each chart they name. Foundations → amCharts departures in
 * Storybook is generated from this file, and each chart page lists the entries that name it.
 *
 * To depart from amCharts, add an entry here with the reason. Anything not listed is amCharts'
 * default, on purpose. This file loads in Node (the docs build reads it), so it imports amCharts
 * only as types; an entry's `apply` gets what it needs from its context.
 */

/** Kilowatt's reference charts, by component name. */
export type ChartName = 'LineChart' | 'ColumnChart' | 'DonutChart';

/** What a theme entry's `apply` works with, for one chart root and color scheme. */
export type ChartThemeContext = {
  /** The chart's root. */
  root: am5.Root;
  /** Kilowatt's amCharts theme, applied after amCharts' own defaults. */
  theme: am5.Theme;
  /** The themes the root gets, in order. An entry may add one, such as amCharts' animation theme. */
  themes: am5.Theme[];
  /** The MUI theme for the active color scheme: the palette, type and shape the chart takes its values from. */
  mui: Theme;
  /** A palette color as a solid amCharts color, blended over the card surface when it's translucent. */
  color: (value: string) => am5.Color;
  /** The card surface charts sit on (`background.level1`). */
  card: string;
  /** Whether the user asks for reduced motion. */
  reducedMotion: boolean;
  /** Makes amCharts' animation theme for this root. */
  animated: () => am5.Theme;
};

export type ChartDeparture = {
  id: string;
  /** `theme`: applied to every chart through `chartThemes`. `convention`: each chart it names does it in its own code. */
  kind: 'theme' | 'convention';
  title: string;
  /** Why Kilowatt differs from amCharts here, in one or two sentences. */
  why: string;
  /** The reference charts whose look or use this changes. Each one's page lists it under "amCharts departures". */
  charts: ChartName[];
  /** For a theme entry: the amCharts rules or root settings it sets. */
  apply?: (context: ChartThemeContext) => void;
  /** For a convention: what amCharts does, what Kilowatt does instead, and where. */
  convention?: { amchartsDefault: string; kilowatt: string; where: string };
  /** For a convention: a pattern every chart it names matches in its source, so a chart that drops it fails `departures.test.ts`. */
  check?: RegExp;
};

/**
 * How value axes write their numbers: `Intl.NumberFormat`'s compact notation in the viewer's locale,
 * so 1,500 is "1.5K" and 60,000 is "60K" in US English (the `compact-axis-numbers` departure).
 */
export const axisNumberFormat: Intl.NumberFormatOptions = { notation: 'compact' };

const all: ChartName[] = ['LineChart', 'ColumnChart', 'DonutChart'];
const xy: ChartName[] = ['LineChart', 'ColumnChart'];

export const chartDepartures: ChartDeparture[] = [
  {
    id: 'chart-colors',
    kind: 'theme',
    title: 'Colors from the palette',
    why: "amCharts brings its own interface colors and a data color set it lightens on each pass. Kilowatt takes both from the MUI palette, so chart code never sets a color: the chart's chrome uses the roles every component uses (the card surface, `border.level1` for gridlines, `text.secondary` for text, the intents), and series take `chart.series` in order, used as they are.",
    charts: all,
    apply: ({ theme, mui: { palette }, color, card }) => {
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
      // The six series hues in order, used as they are (no lightening on a second pass).
      theme.rule('ColorSet').setAll({ colors: palette.chart.series.map(color), step: 1, reuse: true, passOptions: {} });
    },
  },
  {
    id: 'chart-type',
    kind: 'theme',
    title: 'Labels in the caption style',
    why: "amCharts sets its labels in its own font stack at its own size. Kilowatt sets every chart label (ticks, legend, slice labels) in the theme's font at the `caption` size, in `text.secondary`, so a chart's text matches the card around it.",
    charts: all,
    apply: ({ theme, mui: { palette, typography }, color }) => {
      theme.rule('Label').setAll({ fontFamily: typography.fontFamily, fontSize: typography.caption.fontSize, fill: color(palette.text.secondary) });
    },
  },
  {
    id: 'chart-gridlines',
    kind: 'theme',
    title: 'Gridlines at full strength',
    why: 'amCharts draws gridlines at a low opacity of its grid color. Kilowatt draws them at full strength in `border.level1`, the divider, so they read like every other separator in the UI.',
    charts: xy,
    apply: ({ theme }) => {
      theme.rule('Grid').setAll({ strokeOpacity: 1 });
    },
  },
  {
    id: 'chart-tooltips',
    kind: 'theme',
    title: 'Tooltips on the menu surface',
    why: "amCharts fills a tooltip with its series' color and picks a text color to match. Kilowatt shows every tooltip on the menu surface (`background.level3`) with `text.primary`, outlined in `border.level1` and rounded with the theme radius, like a menu, so tooltips read the same on every series.",
    charts: all,
    apply: ({ theme, mui, color }) => {
      theme.rule('Tooltip').setAll({ getFillFromSprite: false, getStrokeFromSprite: false, autoTextColor: false });
      theme.rule('PointedRectangle', ['tooltip', 'background']).setAll({
        fill: color(mui.palette.background.level3),
        fillOpacity: 1,
        stroke: color(mui.palette.border.level1),
        strokeOpacity: 1,
        cornerRadius: Number(mui.shape.borderRadius),
      });
      theme.rule('Label', ['tooltip']).setAll({ fill: color(mui.palette.text.primary) });
    },
  },
  {
    id: 'value-axis-labels',
    kind: 'theme',
    title: 'Value-axis numbers left-aligned',
    why: "amCharts right-aligns a left value axis's numbers against the plot and pads every label 5px on both sides. Kilowatt left-aligns the numbers on both sides, with no padding on the outer side and 8px between the numbers and the plot: compact numbers are short, so none sits far from the plot, they line up with the unit above them, and a left axis lines up with the card's title.",
    charts: xy,
    apply: ({ theme }) => {
      theme.rule('AxisLabel', ['y']).setAll({ centerX: 0, paddingLeft: 0, paddingRight: 8 });
      theme.rule('AxisLabel', ['y', 'opposite']).setAll({ paddingLeft: 8, paddingRight: 0 });
    },
  },
  {
    id: 'legend-items',
    kind: 'theme',
    title: 'Legend items flush left',
    why: "amCharts pads each legend item 5px on every side. Kilowatt drops the left padding, so the first column's markers line up with the axis numbers and the card's title; the right padding keeps columns apart, and the top and bottom keep the hit area.",
    charts: xy,
    apply: ({ theme }) => {
      theme.rule('Container', ['legend', 'item', 'itemcontainer']).setAll({ paddingLeft: 0 });
    },
  },
  {
    id: 'compact-axis-numbers',
    kind: 'theme',
    title: 'Compact axis numbers',
    why: "amCharts writes axis numbers in full with its own number format. Kilowatt writes them in `Intl.NumberFormat`'s compact notation in the viewer's locale (1.5K, 60K), so long numbers don't take the plot's width. It's the root's default number format, which value axes use; tooltips set their own and show the full value (`full-value-tooltips`).",
    charts: xy,
    apply: ({ root }) => {
      root.numberFormatter.set('numberFormat', axisNumberFormat);
    },
  },
  {
    id: 'reduced-motion',
    kind: 'theme',
    title: 'Animation only without reduced motion',
    why: "amCharts animates only when its animation theme is added, which most setups do unconditionally. Kilowatt adds it only when the user hasn't asked for reduced motion, as CssBaseline stills CSS transitions (Rules → Motion).",
    charts: all,
    apply: ({ themes, reducedMotion, animated }) => {
      if (!reducedMotion) themes.unshift(animated());
    },
  },
  {
    id: 'chart-card',
    kind: 'convention',
    title: 'In an outlined card, padded 16px',
    why: "amCharts draws into whatever element it's given. Every Kilowatt chart sits in an outlined `Card` under a title-only `CardHeader`, straight in the card rather than in `CardContent`, and pads itself 16px at the sides and bottom (`inset`, `2`), in line with the title. Outlined cards make a dashboard of charts read as one flat grid of equal panels.",
    charts: all,
    convention: {
      amchartsDefault: 'No container or padding of its own',
      kilowatt: 'An outlined `Card` with a title-only `CardHeader`; the chart pads itself through `inset`, 16px by default, 8px or 0 when a layout needs it',
      where: 'Every chart',
    },
    check: /inset = 2/,
  },
  {
    id: 'value-axis-side',
    kind: 'convention',
    title: 'One value axis on the right',
    why: 'amCharts puts a value axis on the left. Kilowatt puts a chart\'s one value axis on the right; a chart with two units puts its first on the left and its second on the right, two at most.',
    charts: xy,
    convention: {
      amchartsDefault: '`AxisRendererY` with `opposite: false`',
      kilowatt: '`opposite: true` for a single value axis; left then right for two units',
      where: 'Every value axis',
    },
    check: /opposite:/,
  },
  {
    id: 'axis-units',
    kind: 'convention',
    title: 'The unit above each value axis',
    why: "amCharts has no place for units; charts usually put them in a rotated axis title or the chart's heading. Kilowatt shows each value axis's unit as a small horizontal label above it, left-aligned with its numbers (`axisUnit`), so every number sits next to its unit and card headers stay title-only.",
    charts: xy,
    convention: {
      amchartsDefault: 'No unit label; a rotated axis title if one is added',
      kilowatt: '`axisUnit(root, chart, axis, unit)` for every value axis',
      where: 'Every value axis',
    },
    check: /axisUnit\(/,
  },
  {
    id: 'full-value-tooltips',
    kind: 'convention',
    title: 'A full-value tooltip on every item',
    why: "amCharts shows a tooltip only where one is set up, and writes it with the root's number format. Axes round to compact numbers, so every item a pointer can rest on (a line point, a column, a slice) has a tooltip with its exact value and unit, written with `tooltipNumberFormat`.",
    charts: all,
    convention: {
      amchartsDefault: 'No tooltip unless one is configured; values in the root number format',
      kilowatt: 'A tooltip on every point, column and slice: `{valueY.formatNumber(tooltipNumberFormat)}` and the unit',
      where: 'Every series',
    },
    check: /tooltipNumberFormat/,
  },
  {
    id: 'chart-text-alternative',
    kind: 'convention',
    title: 'Named by a summary',
    why: "amCharts' canvas has no text a screen reader can read. Every Kilowatt chart sits in a `figure` named by a one-line summary with the numbers that matter (`aria-label`, not shown on screen), its text alternative.",
    charts: all,
    convention: {
      amchartsDefault: 'A canvas with no accessible name',
      kilowatt: 'A `figure` with `aria-label={summary}` around the chart',
      where: 'Every chart',
    },
    check: /aria-label=\{summary\}/,
  },
  {
    id: 'legend-layout',
    kind: 'convention',
    title: 'A legend below, up to three columns',
    why: "amCharts lays a legend out in one row that runs off the edge. Kilowatt's legend sits below the plot, full width, and wraps into up to three columns (`legend` from `src/charts/theme`), and appears only with more than one series.",
    charts: xy,
    convention: {
      amchartsDefault: 'A single-row legend wherever it is pushed',
      kilowatt: '`legend(root)` below the plot, for two or more series',
      where: 'Every chart with a legend',
    },
    check: /legend\(root\)/,
  },
];
