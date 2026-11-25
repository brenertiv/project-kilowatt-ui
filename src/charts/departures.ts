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
export type ChartName =
  | 'LineChart'
  | 'MonthLinesChart'
  | 'ColumnChart'
  | 'DonutChart'
  | 'Sparkline'
  | 'Heatmap'
  | 'IntervalChart'
  | 'Treemap'
  | 'GaugeChart'
  | 'VitalsGauge'
  | 'RadarChart'
  | 'PartitionChart'
  | 'AnnotatedChart'
  | 'ComboChart'
  | 'RangeChart'
  | 'WaterfallChart'
  | 'DumbbellChart'
  | 'BulletChart'
  | 'MekkoChart'
  | 'ParetoChart'
  | 'BubbleChart'
  | 'StripPlot';

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
  /** The card surface charts sit on (`background.level3`). */
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

/** A date in UTC, as charts' dates are (`root.utc`): amCharts ignores `utc` for `Intl` formats, so each one says so itself. */
const utc = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({ ...options, timeZone: 'UTC' });
const time = utc({ hour: 'numeric', minute: '2-digit' });
const seconds = utc({ hour: 'numeric', minute: '2-digit', second: '2-digit' });
const day = utc({ month: 'short', day: 'numeric' });
const month = utc({ month: 'short' });
const monthYear = utc({ month: 'short', year: 'numeric' });
const year = utc({ year: 'numeric' });
const fullDay = utc({ month: 'short', day: 'numeric', year: 'numeric' });
const fullTime = utc({ month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/**
 * How dates are written, in `Intl.DateTimeFormat` options in the viewer's locale and in UTC (the
 * `date-labels` departure): `axis` for a date axis's labels, `periodChange` for the label where a
 * larger period starts (a new day, month or year), `tooltip` for the date of the item under the
 * pointer. Keyed by amCharts' time units, as a `DateAxis` takes them.
 */
export const dateLabelFormats = {
  axis: { millisecond: seconds, second: seconds, minute: time, hour: time, day, week: day, month, year },
  periodChange: { millisecond: seconds, second: seconds, minute: time, hour: day, day, week: day, month: monthYear, year },
  tooltip: { millisecond: fullTime, second: fullTime, minute: fullTime, hour: fullTime, day: fullDay, week: fullDay, month: monthYear, year },
} satisfies Record<string, Record<am5.time.TimeUnit, Intl.DateTimeFormatOptions>>;

const all: ChartName[] = [
  'LineChart',
  'MonthLinesChart',
  'ColumnChart',
  'DonutChart',
  'Sparkline',
  'Heatmap',
  'IntervalChart',
  'Treemap',
  'GaugeChart',
  'VitalsGauge',
  'RadarChart',
  'PartitionChart',
  'AnnotatedChart',
  'ComboChart',
  'RangeChart',
  'WaterfallChart',
  'DumbbellChart',
  'BulletChart',
  'MekkoChart',
  'ParetoChart',
  'BubbleChart',
  'StripPlot',
];
const xy: ChartName[] = ['LineChart', 'MonthLinesChart', 'ColumnChart', 'IntervalChart', 'ComboChart'];
/** XY charts with a vertical value axis: a waterfall, a Mekko, a Pareto and a bubble chart, beside the time and column charts. */
const vertical: ChartName[] = [...xy, 'WaterfallChart', 'MekkoChart', 'ParetoChart', 'BubbleChart'];
/** XY charts whose rows run down the left: bars, dumbbells, bullets and strips. */
const rowed: ChartName[] = ['DumbbellChart', 'BulletChart', 'StripPlot'];
/** Charts with an amCharts legend. */
const legended: ChartName[] = [...xy, 'RadarChart', 'MekkoChart', 'ParetoChart'];
/** Charts off the XY grid that still draw gridlines, write axis numbers or carry a legend. */
const gridded: ChartName[] = [...xy, 'RadarChart'];

export const chartDepartures: ChartDeparture[] = [
  {
    id: 'chart-colors',
    kind: 'theme',
    title: 'Colors from the palette',
    why: "amCharts brings its own interface colors and a data color set it lightens on each pass. Kilowatt takes both from the MUI palette, so chart code never sets a color: the chart's chrome uses the roles every component uses (the card surface, `border.level2` for gridlines, `text.secondary` for text, the intents), and series take `chart.series` in order, used as they are.",
    charts: all,
    apply: ({ theme, mui: { palette }, color, card }) => {
      theme.rule('InterfaceColors').setAll({
        background: color(card),
        fill: color(card),
        stroke: color(card),
        // A step past the divider, so a chart's lines read on the card (`chart-gridlines`).
        grid: color(palette.border.level2),
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
        secondaryButton: color(palette.background.level4),
        secondaryButtonHover: color(palette.background.level5),
        secondaryButtonDown: color(palette.background.level5),
        secondaryButtonActive: color(palette.background.level5),
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
    why: "amCharts draws gridlines at a low opacity of its grid color. Kilowatt draws them at full strength in `border.level2`, a step past the divider (`border.level1`): asked for in review, so a chart's lines read on the card.",
    charts: [...gridded, ...vertical.filter((chart) => !xy.includes(chart)), ...rowed],
    apply: ({ theme }) => {
      theme.rule('Grid').setAll({ strokeOpacity: 1 });
    },
  },
  {
    id: 'chart-tooltips',
    kind: 'theme',
    title: 'Tooltips on the menu surface',
    why: "amCharts fills a tooltip with its series' color and picks a text color to match. amCharts fills an axis's tooltip (the cursor's date or value) dark and square. Kilowatt shows every tooltip, an axis's included, on the menu surface (`background.level4`) with `text.primary`, outlined in `border.level1` and rounded with the theme radius, like a menu, so tooltips read the same on every series and axis.",
    charts: all,
    apply: ({ theme, mui, color }) => {
      theme.rule('Tooltip').setAll({ getFillFromSprite: false, getStrokeFromSprite: false, autoTextColor: false });
      const surface = {
        fill: color(mui.palette.background.level4),
        fillOpacity: 1,
        stroke: color(mui.palette.border.level1),
        strokeOpacity: 1,
        cornerRadius: Number(mui.shape.borderRadius),
      };
      theme.rule('PointedRectangle', ['tooltip', 'background']).setAll(surface);
      // An axis's tooltip (the cursor's date) gets its own dark, square background from amCharts; it takes the menu surface too.
      theme.rule('PointedRectangle', ['axis', 'tooltip', 'background']).setAll(surface);
      theme.rule('Label', ['tooltip']).setAll({ fill: color(mui.palette.text.primary) });
    },
  },
  {
    id: 'value-axis-labels',
    kind: 'theme',
    title: 'Value-axis numbers aligned to the card\'s edge',
    why: "amCharts right-aligns a left value axis's numbers against the plot and pads every label 5px on both sides. Kilowatt aligns the numbers to the card's outer edge instead: left-aligned on a left axis and right-aligned on a right one, with no padding on the outer side and 8px between the numbers and the plot. Compact numbers are short, so none sits far from the plot; they line up with the unit above them, and a left axis lines up with the card's title.",
    charts: [...vertical, ...rowed],
    apply: ({ theme }) => {
      theme.rule('AxisLabel', ['y']).setAll({ centerX: 0, paddingLeft: 0, paddingRight: 8 });
      const right = theme.rule('AxisLabel', ['y', 'opposite']);
      right.setAll({ paddingLeft: 8, paddingRight: 0 });
      // amCharts pins a right axis's labels to the plot, so each is moved out to end at the axis's outer edge.
      right.adapters.add('x', (x, label) => (label.parent ? label.parent.innerWidth() - label.width() : x));
    },
  },
  {
    id: 'legend-items',
    kind: 'theme',
    title: 'Legend items flush left',
    why: "amCharts pads each legend item 5px on every side. Kilowatt drops the left padding, so the first column's markers line up with the axis numbers and the card's title; the right padding keeps columns apart, and the top and bottom keep the hit area.",
    charts: legended,
    apply: ({ theme }) => {
      theme.rule('Container', ['legend', 'item', 'itemcontainer']).setAll({ paddingLeft: 0 });
    },
  },
  {
    id: 'legend-markers',
    kind: 'theme',
    title: 'Legend markers are small dots',
    why: "amCharts marks each legend item with an 18px square rounded at 3px. Kilowatt marks it with an 8px dot in the series' color, as the donut's and the segmented bar's legends mark their parts, so every legend reads the same and the marker doesn't outweigh its name.",
    charts: legended,
    apply: ({ theme }) => {
      theme.rule('Container', ['legend', 'marker']).setAll({ width: 8, height: 8 });
      theme.rule('RoundedRectangle', ['legend', 'marker', 'rectangle']).setAll({ cornerRadiusTL: 4, cornerRadiusTR: 4, cornerRadiusBL: 4, cornerRadiusBR: 4 });
      // A line series hides that rectangle and draws a short stroke across the marker instead; draw the dot there too,
      // filled in the line's color and solid even for a dashed line (the series' 2px stroke rings a 3px circle: 8px across).
      theme.rule('Graphics', ['line', 'series', 'legend', 'marker', 'stroke']).setAll({
        draw: (display, sprite) => {
          const marker = sprite.parent;
          if (!marker) return;
          display.setLineDash([]);
          display.drawCircle(marker.width() / 2, marker.height() / 2, 3);
          const stroke = sprite.get('stroke');
          if (stroke) {
            display.beginFill(stroke, 1);
            display.endFill();
          }
        },
      });
    },
  },
  {
    id: 'compact-axis-numbers',
    kind: 'theme',
    title: 'Compact axis numbers',
    why: "amCharts writes axis numbers in full with its own number format. Kilowatt writes them in `Intl.NumberFormat`'s compact notation in the viewer's locale (1.5K, 60K), so long numbers don't take the plot's width. It's the root's default number format, which value axes use; tooltips set their own and show the full value (`full-value-tooltips`).",
    charts: [...gridded, 'GaugeChart', 'VitalsGauge', 'RangeChart', ...vertical.filter((chart) => !xy.includes(chart)), ...rowed],
    apply: ({ root }) => {
      root.numberFormatter.set('numberFormat', axisNumberFormat);
    },
  },
  {
    id: 'number-separators',
    kind: 'theme',
    title: "Number separators in the viewer's locale",
    why: "amCharts writes a number format string (`tooltipNumberFormat`, `#,###.##`) with English separators, a comma between thousands and a point before decimals, whatever the viewer's locale. Kilowatt takes both from `Intl.NumberFormat` in the viewer's locale, so a tooltip's exact value reads as the axis numbers and the page's other numbers do (1.234,5 in German).",
    charts: all,
    apply: ({ root }) => {
      const parts = new Intl.NumberFormat().formatToParts(12345.6);
      const part = (type: Intl.NumberFormatPartTypes, fallback: string) => parts.find((p) => p.type === type)?.value ?? fallback;
      root.language.setTranslationAny('_thousandSeparator', part('group', ','));
      root.language.setTranslationAny('_decimalSeparator', part('decimal', '.'));
    },
  },
  {
    id: 'date-labels',
    kind: 'theme',
    title: "Dates in the viewer's locale",
    why: "amCharts writes a date axis's labels and tooltips with its own format strings in English (\"Sep 07\", \"HH:mm\"), whatever the viewer's locale. Kilowatt writes them with `Intl.DateTimeFormat` in the viewer's locale (`dateLabelFormats`), as the app writes every other date, and in UTC like the data (amCharts ignores `root.utc` for `Intl` formats, so each format sets its time zone).",
    charts: ['LineChart', 'IntervalChart', 'Sparkline', 'ComboChart'],
    apply: ({ theme }) => {
      theme.rule('DateAxis').setAll({
        dateFormats: dateLabelFormats.axis,
        periodChangeDateFormats: dateLabelFormats.periodChange,
        tooltipDateFormats: dateLabelFormats.tooltip,
      });
    },
  },
  {
    id: 'scrollbar-selection',
    kind: 'theme',
    title: 'The scrollbar stands out and shows its selection',
    why: "amCharts fills a scrollbar with the chart's own background, rounded, so on a card it barely shows, and it hides the part of an XY chart's scrollbar between its grips (its thumb, at opacity 0 until hovered), only fading what's outside it, so the range in view is hard to see. Kilowatt drops the fade and tints the scrollbar faintly with `action.hover`, the range-band color, so it reads as a control apart from the plot, and squares it like the plot it previews. The chart shows the thumb (`scrollbar.thumb` at opacity 1), and the theme marks it as MUI marks a selected item: `primary` at `action.selectedOpacity`, a little stronger on hover, square and with no outline.",
    charts: ['IntervalChart'],
    apply: ({ theme, mui: { palette }, color }) => {
      theme.rule('RoundedRectangle', ['scrollbar', 'main', 'background']).setAll({
        fill: color(palette.action.hover),
        fillOpacity: 1,
        cornerRadiusTL: 0,
        cornerRadiusTR: 0,
        cornerRadiusBL: 0,
        cornerRadiusBR: 0,
      });
      // amCharts fades what's outside the range in view toward the chart's background; the marked range does that job, so the scrollbar keeps its level throughout.
      theme.rule('Graphics', ['scrollbar', 'overlay']).setAll({ fillOpacity: 0 });
      const thumb = ['xy', 'scrollbar', 'thumb'];
      const fill = color(palette.primary.main);
      theme.rule('RoundedRectangle', thumb).setAll({ fill, fillOpacity: palette.action.selectedOpacity });
      const hover = palette.action.selectedOpacity + palette.action.hoverOpacity;
      theme.rule('RoundedRectangle', thumb).states.create('hover', { fill, fillOpacity: hover });
      theme.rule('RoundedRectangle', thumb).states.create('down', { fill, fillOpacity: hover, stateAnimationDuration: 0 });
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
    title: 'A second unit on the right',
    why: 'amCharts puts every value axis on the left. Kilowatt keeps a chart\'s one value axis on the left, in line with the card\'s title, and puts a second unit\'s axis on the right, so each unit has its own side; two at most.',
    charts: vertical,
    convention: {
      amchartsDefault: '`AxisRendererY` with `opposite: false` for every value axis',
      kilowatt: '`opposite: false` for a single value axis; left then right (`opposite: true`) for two units; along the bottom for horizontal bars',
      where: 'Every value axis',
    },
    check: /opposite:/,
  },
  {
    id: 'axis-units',
    kind: 'convention',
    title: 'The unit above each value axis',
    why: "amCharts has no place for units; charts usually put them in a rotated axis title or the chart's heading. Kilowatt shows each value axis's unit as a small horizontal label above it, aligned with its numbers at the card's edge (`axisUnit`), so every number sits next to its unit and card headers stay title-only.",
    charts: vertical,
    convention: {
      amchartsDefault: 'No unit label; a rotated axis title if one is added',
      kilowatt: '`axisUnit(root, chart, axis, unit)` for every vertical value axis; a horizontal bar chart puts its unit at the end of its value axis, under the numbers',
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
    charts: legended,
    convention: {
      amchartsDefault: 'A single-row legend wherever it is pushed',
      kilowatt: '`legend(root)` below the plot, for two or more series',
      where: 'Every chart with a legend',
    },
    check: /legend\(root\)/,
  },
  {
    id: 'stack-order',
    kind: 'convention',
    title: 'A stack ordered dark to light',
    why: "amCharts stacks series in the order they're added, so a stack's colors fall wherever the data's order puts them. Kilowatt orders a stack by its colors' lightness in the active scheme, across the whole stack whatever the ramps (Rules → Charts → A stack runs dark to light): darkest at the bottom of a column and lightest at the top, lightest at the left of a bar and darkest at the right, both reversed in dark. Every series keeps its own color, and the legend keeps the order the series are given in.",
    charts: ['ColumnChart', 'MekkoChart'],
    convention: {
      amchartsDefault: 'Series stack in the order they are added',
      kilowatt: '`stackOrder` from `src/charts/stackOrder`: a `stacked` chart adds its series by lightness, for its direction and the scheme',
      where: 'Stacked columns and bars',
    },
    check: /stackOrder\(/,
  },
  {
    id: 'reference-lines',
    kind: 'convention',
    title: 'Targets and benchmarks as dashed lines',
    why: "amCharts draws an axis range as a solid gridline with an axis label. Kilowatt draws a target or benchmark as a dashed line in `text.secondary`, labeled with its name, full value and unit at the plot's left edge on a plate of the card surface, over the series, so it reads as a reference rather than data, no line runs through its label, and the label never covers the latest values at the right. An `IntervalChart` target, which the readings are judged against as you zoom, keeps amCharts' own label for the line, centered on it at the edge beside the value axis, so amCharts moves the two together.",
    charts: ['LineChart', 'Sparkline', 'IntervalChart', 'ParetoChart'],
    convention: {
      amchartsDefault: 'An axis range: a solid gridline in the grid color, its label among the axis numbers',
      kilowatt: '`references`, drawn by `referenceLines` from `src/charts/theme`: a dashed `text.secondary` line, labeled "Name: value unit" at the left edge of the plot on the card surface; an `IntervalChart` target is labeled by amCharts\' own axis-range label instead, centered on its line at the plot\'s edge beside the value axis on `action.hover` (`onLine`)',
      where: 'Every target, benchmark or threshold line',
    },
    check: /referenceLines\(/,
  },
  {
    id: 'projected-segments',
    kind: 'convention',
    title: 'Projections continue their line, dashed',
    why: 'amCharts has no notion of a projection, so charts often draw the forecast as a second series in a second color. A forecast is a variant of what it forecasts (Rules → Charts → Variants don\'t get colors): Kilowatt continues the one line dashed in its own hue from the first projected point, and the tooltip says "projected", so the change reads by pattern and in words.',
    charts: ['LineChart'],
    convention: {
      amchartsDefault: 'No projection; a separate series for the forecast',
      kilowatt: "`projectedFrom` on the series: a series axis range from that date, dashed in the series' hue, and \"projected\" (or `projectedNote`) in the tooltip",
      where: 'Every measured-then-projected line',
    },
    check: /projectedFrom/,
  },
  {
    id: 'still-being-billed',
    kind: 'convention',
    title: 'A month still being billed is dashed and counted',
    why: 'amCharts draws every period alike, so a trailing month with bills for only some of the properties reads as a drop in use or cost. A month still being billed is a variant of its own series (Rules → Charts → Variants don\'t get colors): while fewer than nine in ten of the properties in scope have a bill for it, Kilowatt draws it dashed in its own hue and says "Still being billed: 9 of 18 properties" in its tooltip and under the chart, so the state reads by pattern and in words, never by color alone. Once the month passes nine in ten it draws solid.',
    charts: ['LineChart', 'MonthLinesChart', 'ColumnChart'],
    convention: {
      amchartsDefault: 'Every period drawn alike, however much of it has been billed',
      kilowatt: "`stillBilling` on the chart: a column as a dashed outline with no fill, a line dashed from the last month billed in full with a hollow marker, each in the series' hue, and the count of properties billed in the tooltip and in a caption under the plot",
      where: 'Every monthly chart of billed data whose trailing months may still be billed',
    },
    check: /stillBilling/,
  },
  {
    id: 'status-bands',
    kind: 'convention',
    title: 'A score colored by its bands',
    why: "amCharts colors a line by its series. A score read against bands (excellent, fair, poor) is status, so Kilowatt colors the line and its markers band by band with the intents, through series axis ranges on the value axis, and names the band in the tooltip so color isn't the only signal. A chart colored by status has no other colored line (Rules → Charts: by series or by status, not both).",
    charts: ['LineChart'],
    convention: {
      amchartsDefault: 'One stroke color per series',
      kilowatt: '`bands` on the series: each band an axis range stroked in its intent (`chart.status`), the band named in the tooltip',
      where: 'Every score line',
    },
    check: /colors\.status/,
  },
  {
    id: 'point-markers',
    kind: 'convention',
    title: 'Markers only where they say something',
    why: "amCharts draws no markers until a bullet is added, and charts then tend to mark every point. Kilowatt draws none by default; `markers: 'last'` marks the latest reading, and `'all'` marks every point of sparse data, where each point is a reading, as `MonthLinesChart` marks every month so a lone month with data still shows. A marker is a 4px dot in the line's color (or its band's) ringed in the card surface, so it stays legible where lines cross.",
    charts: ['LineChart', 'MonthLinesChart', 'Sparkline', 'RadarChart', 'ComboChart', 'ParetoChart'],
    convention: {
      amchartsDefault: 'No bullets; when added, usually on every point',
      kilowatt: "`markers: 'last' | 'all'` on a `LineChart` series, and the last point of every `Sparkline`: a 4px dot ringed in the card surface",
      where: 'Every line that marks points',
    },
    check: /am5\.Circle\.new/,
  },
  {
    id: 'sparkline-chrome',
    kind: 'convention',
    title: 'A sparkline has no axes',
    why: "amCharts draws an XY chart's axes, labels and gridlines wherever it has room. A sparkline sits under the headline number it explains, which carries the value and unit, so Kilowatt hides its axes, gridlines, legend and cursor line, marks the latest point, and leaves scale to its references and the full-value tooltip.",
    charts: ['Sparkline'],
    convention: {
      amchartsDefault: 'Axis labels, gridlines and a cursor line on every XY chart',
      kilowatt: 'Labels and gridlines `forceHidden` on both axes, no legend, the cursor line hidden; the last point marked',
      where: 'Every sparkline',
    },
    check: /forceHidden/,
  },
  {
    id: 'heatmap-scale',
    kind: 'convention',
    title: 'Heatmap cells are overlays, strength by value, continuous',
    why: "amCharts' heat rules blend between two colors of the chart's choosing. Kilowatt draws a cell as one end color over the surface at an opacity of its value: a magnitude against the range on `chart.sequential`'s fourth step, a comparison against a cap either side of a midpoint, on `error` and `chart.neutral` where one side is worse or on `chart.diverging` where neither is. Strength is continuous, full from the cap and fading to the surface at no change, so the surface is the quiet state and no band edge splits two near values. Text stays `text.primary` while it holds 4.5:1 over the blend and takes the end's contrast text from the opacity where that holds, skipping the narrow band where neither does. No data is hatched in `border.level3`, and a legend under the grid draws the gradient with the cap or the range named at its ends.",
    charts: ['Heatmap'],
    convention: {
      amchartsDefault: '`heatRules` blending between any two colors',
      kilowatt:
        '`scale="diverging"`: the `worse` side in `error` and the other in `chart.neutral`; `worse="none"`: `chart.diverging` below and above; `scale="sequential"`: `chart.sequential[3]` against the range; every cell at an opacity of its value over its cap or range (`colors.heat`); no data hatched; a gradient legend',
      where: 'Every heatmap',
    },
    check: /colors\.heat\.(below|error|magnitude)/,
  },
  {
    id: 'data-grouping',
    kind: 'convention',
    title: 'Dense readings group by what they measure',
    why: "amCharts groups a dense series into longer intervals only when `groupData` is on, and then keeps each group's last reading, which can drop a peak or misstate a total. Kilowatt groups fine-interval readings as the chart zooms out and combines them by what they measure (`aggregate`: an average for a rate, a sum for an amount, the highest for a peak), and the tooltip names the grouping (\"daily average\"), so a grouped point never passes for a single reading.",
    charts: ['IntervalChart'],
    convention: {
      amchartsDefault: "Every point drawn; with `groupData`, each group's `close` value",
      kilowatt: '`groupData` on the date axis, `valueYGrouped` from `aggregate`, and the period and aggregate in the tooltip',
      where: 'Every chart of fine-interval readings',
    },
    check: /valueYGrouped: aggregate/,
  },
  {
    id: 'zoom-controls',
    kind: 'convention',
    title: 'Zoom on the trackpad, reset with an MUI button',
    why: "amCharts doesn't zoom on the wheel unless asked, and resets with a round button of its own over the plot, in `primaryButton` colors that hide its icon. Kilowatt zooms like amCharts' data-grouping demo: over the plot a two-finger swipe up or down (or a pinch, or the mouse wheel) zooms and a sideways swipe pans, dragging across the plot zooms to a range, and the scrollbar, the chart's last row, previews in `chart.neutral` because it's context. It resets with an MUI `IconButton` at the scrollbar's right, beside the control it affects and off the data, disabled while the whole period is in view. The wheel is the chart's only while the pointer is over the plot; the page scrolls everywhere else.",
    charts: ['IntervalChart'],
    convention: {
      amchartsDefault: "`wheelX`/`wheelY` `'none'`; `zoomOutButton` in `primaryButton` colors",
      kilowatt: "`wheelY: 'zoomX'`, `wheelX: 'panX'`, `XYCursor` `behavior: 'zoomX'`, an `XYChartScrollbar` previewing the first line in `chart.neutral`, and an `IconButton` (`fit_screen`, \"Show the whole period\") at the scrollbar's right in place of `zoomOutButton`",
      where: 'Every zoomable chart',
    },
    check: /zoomOutButton\.set\('forceHidden', true\)/,
  },
  {
    id: 'gauge-status-arc',
    kind: 'convention',
    title: "A gauge's arc runs through the intents, with the reading in words",
    why: "amCharts' gauge fills its arc with a gradient of its own positive, warning and negative colors and shows the reading only by the needle. A reading on a scale of worse to better is status, so Kilowatt runs the arc through the intents (`error`, `warning`, `success`, reversed where less is better) and writes the number, its unit and the name of its band under the arc as text, so nothing rests on the color or the needle's angle. A threshold is a tick across the arc in `text.secondary`, named under the gauge.",
    charts: ['GaugeChart'],
    convention: {
      amchartsDefault: "A `strokeGradient` of amCharts' interface colors; the value read off the needle",
      kilowatt: "`colors.status` as the gradient's stops; the reading, unit and band as text under the arc; `references` as ticks named under it; the needle moves to a new `value` in place",
      where: 'Every gauge of one reading',
    },
    check: /colors\.status/,
  },
  {
    id: 'gauge-parts',
    kind: 'convention',
    title: 'Each part of a gauge takes a series color and is named in a legend',
    why: "amCharts' multi-part gauge colors each scale from its own color set, a step apart and translucent, and names none of them. The parts are categories, so Kilowatt gives each arc and its needle a `chart.series` color in order (or a `slot`), solid, and names every reading with its value and unit in a legend under the ring, as the donut's legend names its parts, so a reading doesn't rest on its color.",
    charts: ['VitalsGauge'],
    convention: {
      amchartsDefault: '`ColorSet` with `step: 2`, each arc at 0.8 opacity, no labels beyond the scales',
      kilowatt: '`seriesColors` for the arcs and needles; an HTML legend under the ring with each name, value and unit; two to four parts; needles move to new values in place',
      where: 'Every gauge of several readings',
    },
    check: /seriesColors\(/,
  },
  {
    id: 'level-ring-labels',
    kind: 'convention',
    title: 'Labels around a ring read level',
    why: "amCharts bends a circular axis's labels along the ring, so half of them read sideways or upside down and a long category name wraps around the chart. Kilowatt sets them level beside the ring (`textType: 'adjusted'`), and a radar's long category names wrap under themselves, so every label reads like the rest of the page.",
    charts: ['GaugeChart', 'VitalsGauge', 'RadarChart'],
    convention: {
      amchartsDefault: "`textType: 'circular'` on a circular axis's labels",
      kilowatt: "`textType: 'adjusted'` on the circular renderer's label template, a few pixels off the ring",
      where: 'Every circular axis',
    },
    check: /textType: 'adjusted'/,
  },
  {
    id: 'radar-chrome',
    kind: 'convention',
    title: 'A radar starts at zero, marks every point and stays still',
    why: "amCharts' radar fits its value axis to the data, pans and zooms on the wheel and by dragging, and shows values through a cursor. Kilowatt starts the value axis at 0 at the center, as every value axis does, so a distance reads as an amount; marks every point with a dot that carries its full-value tooltip, since each spoke is one reading; and doesn't pan or zoom, since only interval charts do. The unit sits at the chart's top left, read level, as it sits above a value axis.",
    charts: ['RadarChart'],
    convention: {
      amchartsDefault: "A fitted value axis, `wheelY: 'zoomX'`, a `RadarCursor` that zooms, no unit",
      kilowatt: '`min: 0` on the radial axis, no wheel, pan or cursor, a ringed dot with a tooltip on every point, the unit as a label at the top left',
      where: 'Every radar chart',
    },
    check: /min: 0/,
  },
  {
    id: 'branch-colors',
    kind: 'convention',
    title: 'A hierarchy is colored by branch',
    why: "amCharts gives every node of a hierarchy its own color from the color set, so a partition's levels run through more colors than the palette has and a color means nothing. Kilowatt colors a partition by branch: each child of the whole takes a `chart.series` color (or a `slot`) and its descendants keep it, the whole takes `chart.neutral`, and rectangles are parted by 2px of the card surface. Color then names the branch and the column names the level. Labels take the palette's contrast text and are hidden where they don't fit, rather than turned sideways.",
    charts: ['PartitionChart'],
    convention: {
      amchartsDefault: 'A color per node from the `ColorSet`; labels rotated in narrow rectangles',
      kilowatt: "`fillField` set from the branch's series color through every level, `chart.neutral` for the whole, `colors.contrast` for labels, `oversizedBehavior: 'hide'`",
      where: 'Every hierarchy chart with more than one level',
    },
    check: /colors\.contrast/,
  },
  {
    id: 'annotate-button',
    kind: 'convention',
    title: 'Annotating opens from an MUI button, on Kilowatt surfaces',
    why: "amCharts opens its annotator from an item in its export menu, a control of its own over the chart, and MarkerJS draws its toolbars in its own dark style with its own ink colors. Kilowatt opens it from an MUI button under the chart (Annotate, then Done), beside a Clear annotations button, as it replaces amCharts' zoom-out button with an MUI one; MarkerJS's toolbars take the menu surface and `text.primary`, and its inks are `text.primary` and the intents, never a series color, since an annotation is a remark on the data.",
    charts: ['AnnotatedChart'],
    convention: {
      amchartsDefault: "An `ExportingMenu` item that toggles the `Annotator`; MarkerJS's default toolbar style and color set",
      kilowatt: 'No export menu; MUI buttons under the chart call the `Annotator`; `markerStyleSettings` and `markerSettings` from the palette',
      where: 'Every chart people can annotate',
    },
    check: /markerStyleSettings/,
  },
  {
    id: 'target-columns',
    kind: 'convention',
    title: 'A target stands behind its columns, in neutral',
    why: "amCharts' combined chart draws the target as a wider column in a second series color at half opacity, zooms on the wheel and adds a scrollbar. A target is context for the amount read against it, so Kilowatt draws it as a wider column in `chart.neutral` behind the measured one, which keeps the series color; the lines on the second axis are marked at every period with a hollow dot, which stays apart from the column behind it; and the chart doesn't zoom or scroll, since only interval charts do.",
    charts: ['ComboChart'],
    convention: {
      amchartsDefault: 'Two `clustered: false` column series in two colors, the wider at 0.5 opacity; `XYChartScrollbar` and wheel zoom',
      kilowatt: '`target` on a column series: `chart.neutral`, 90% of the period wide, behind a 50% column in its series color; no scrollbar, wheel or cursor zoom',
      where: 'Every column read against a target for the same period',
    },
    check: /clustered: false/,
  },
  {
    id: 'range-track',
    kind: 'convention',
    title: 'A range chart is one reading on a track, against its benchmark',
    why: "amCharts' range bullet chart compares several categories, each a translucent bar between two large dots with a triangle at the average and a legend above. Kilowatt's is one property's reading: a track from 0 divided into bands (below, within and above the expected range), each tinted with its intent, since a reading judged against a benchmark is status; the benchmark is a tick across the track in `text.secondary`, named under it; and the reading is a dot in its band's intent, ringed in the card surface. Only the track's ends and the benchmark are labeled, and the reading, its unit, the benchmark and the band's name are text above the track, so nothing rests on the color.",
    charts: ['RangeChart'],
    convention: {
      amchartsDefault: 'A floating column per category with circle bullets at its ends, a triangle at the average and a legend above the plot',
      kilowatt: "One row: `bands` as columns tinted with `colors.status`, rounded at the track's ends with the theme radius; an axis range at `benchmark`; a dot at `value` in its band's intent; no axis numbers but the ends; the reading as text above",
      where: 'Every reading shown against a benchmark and an expected range',
    },
    check: /colors\.status/,
  },
  {
    id: 'waterfall-bridge',
    kind: 'convention',
    title: 'A waterfall colors its changes by which way is worse, and writes them signed',
    why: "amCharts' waterfall demo colors each step from its color set, with no meaning in the color. A bridge's steps are deviations, so Kilowatt draws totals from 0 in the first series color and each change floating from the running total in `error` where it moves the worse way and `chart.neutral` where it moves the better way (Rules → Charts → deviation), writes each change signed above its column so the direction reads in words, and carries the running total from column to column with a dashed line in `text.secondary`. The value axis starts at 0, so a total's height is its amount, unless the changes would then be too small to read (a bridge of a few percent): it then starts at a round number below the lowest running total, totals stand from its foot, and each total is written above its column so its amount still reads in full.",
    charts: ['WaterfallChart'],
    convention: {
      amchartsDefault: 'Floating columns colored from the `ColorSet`, with no labels and no connectors',
      kilowatt: "`worse` on the chart: totals in `chart.series[0]`, changes in `error` or `chart.neutral`; a compact signed label above each change; a dashed `StepLineSeries` connector without risers; the value axis from 0, or from a round number below the lowest running total when the changes are under about a third of it, with every total written above its column",
      where: 'Every bridge from one total to another',
    },
    check: /openValueYField/,
  },
  {
    id: 'dumbbell-gap',
    kind: 'convention',
    title: 'A dumbbell is hollow at its reference and solid at its reading',
    why: "amCharts' dumbbell demo draws both ends in two series colors with a gray line between. One end is the reference (a limit, today) and the other the reading, so Kilowatt draws the reference hollow in `text.secondary` and the reading solid, in `error` where it's on the worse side of its reference and `chart.neutral` where it isn't (or the first series color where neither side is worse), with the line between in the reading's color. A note at the row's end says what the gap means (a fine), and an HTML legend names each kind of dot in words, so the gap doesn't rest on color. The dots mark places rather than lengths from 0, so the value axis fits the rows, as a dot plot's does, and the gaps read large enough to compare.",
    charts: ['DumbbellChart'],
    convention: {
      amchartsDefault: 'Two circle bullets in two series colors at the ends of a thin gray column',
      kilowatt: '`fromName` as a hollow `text.secondary` dot, `toName` as a solid dot colored by `worse`, a 2px line in the same color, a `note` label at the far end, a value axis fitted to the rows, and a legend in words under the plot',
      where: 'Every chart of a reading against its own reference, row by row',
    },
    check: /fromName/,
  },
  {
    id: 'bullet-target',
    kind: 'convention',
    title: 'A bullet is a bar against a tick, on one track',
    why: "amCharts' bullet chart draws a gradient of qualitative ranges behind each bar and the target as a dark line. Kilowatt keeps one track in `action.hover`, the range-band color, to the end of the scale where there is one (100%), since a gradient of ranges reads as a color scale; the bar takes the first series color, or `error` and `chart.neutral` by which side of its target is worse; and the target is a tick in `text.secondary`, the reference color, named in an HTML legend under the plot with each color the bars take, in words.",
    charts: ['BulletChart'],
    convention: {
      amchartsDefault: 'A gradient of range columns behind each bar and a target line from the `ColorSet`',
      kilowatt: '`max` as one `action.hover` track, the bar colored by `worse`, the `targetName` tick in `text.secondary`, and a legend in words under the plot',
      where: 'Every value read against its own target, row by row',
    },
    check: /targetName/,
  },
  {
    id: 'mekko-widths',
    kind: 'convention',
    title: 'A Mekko names its columns and parts them with the card surface',
    why: "amCharts builds a Mekko from a stacked 100% chart with column widths set by an adapter, labels its columns along a value axis that means nothing to the reader, and draws parts edge to edge. Kilowatt names each column under it with its size (Fund I, 4.2M sq ft) in place of axis numbers, parts every rectangle with 2px of the card surface as a partition does, and stacks the parts dark to light like every stack, so widths, shares and names read at once.",
    charts: ['MekkoChart'],
    convention: {
      amchartsDefault: 'Column widths by adapter, the category value axis labeled with numbers, parts touching',
      kilowatt: '`widthField` sets each column\'s span on a hidden value axis; each column named with its compact size by an axis range; a 2px `surface` stroke; the share axis 0–100% on the left',
      where: 'Every chart of wholes of different sizes split into the same parts',
    },
    check: /widthField/,
  },
  {
    id: 'pareto-cumulative',
    kind: 'convention',
    title: 'A Pareto sorts itself, with its cumulative share as context',
    why: "amCharts' Pareto demo takes its data in the order given and draws the cumulative line in a second series color. Kilowatt sorts the items largest first, draws the cumulative share on a 0–100% right axis in `chart.neutral`, since it's context for the columns, with every item marked by a hollow dot, and marks the threshold (80%) with a dashed reference line, so the few items that make up most of the total read at a glance.",
    charts: ['ParetoChart'],
    convention: {
      amchartsDefault: 'Columns in data order and a cumulative line in the next series color',
      kilowatt: 'Rows sorted by `valueField`, the `cumulative` share in `chart.neutral` on a 0–100% right axis with hollow markers, and `threshold` as a reference line',
      where: 'Every ranking of contributions to a total',
    },
    check: /cumulative/,
  },
  {
    id: 'bubble-area',
    kind: 'convention',
    title: "A bubble's area is its amount",
    why: "amCharts sizes bubbles with a heat rule on the radius, so a bubble with twice the amount has four times the area and reads as four times as much. Kilowatt sets each bubble's radius from the square root of its share of the largest, so its area is its amount, with a floor that keeps every bubble big enough to rest a pointer on; rings each in the card surface and draws the largest first, so overlaps stay legible; starts both axes at 0; names the three measures in a caption under the plot; and names its groups in an HTML legend marked by small dots, since amCharts would mark each with a whole bubble.",
    charts: ['BubbleChart'],
    convention: {
      amchartsDefault: "`heatRules` on the circle's `radius`, linear in the value",
      kilowatt: '`radius` from `Math.sqrt` of the size over the largest, 5px to 28px; a `surface` ring; largest drawn first; both axes from 0; a caption naming `x`, `y` and `size`; an HTML legend for `groups`',
      where: 'Every bubble chart',
    },
    check: /Math\.sqrt/,
  },
  {
    id: 'strip-spread',
    kind: 'convention',
    title: "A strip plot spreads its dots by a fixed amount",
    why: "amCharts' scatter places every dot on its row's center, so items with the same value hide each other, and examples that spread them do it at random, which moves the dots on every render. Kilowatt spreads each dot up or down its row by a fixed amount from its place in its group, so equal values stay apart and the plot is the same every time; a threshold is a dashed line down the plot in `text.secondary`, named at its top on a plate of the card surface.",
    charts: ['StripPlot'],
    convention: {
      amchartsDefault: 'Dots on the row center, or a random jitter',
      kilowatt: "Each bullet's `locationY` from its index in its group; `references` as dashed axis ranges named at the plot's top",
      where: "Every chart of many items' values by group",
    },
    check: /locationY/,
  },
];
