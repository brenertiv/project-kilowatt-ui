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
export type ChartName = 'LineChart' | 'ColumnChart' | 'DonutChart' | 'Sparkline' | 'Heatmap' | 'IntervalChart';

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

const all: ChartName[] = ['LineChart', 'ColumnChart', 'DonutChart', 'Sparkline', 'Heatmap', 'IntervalChart'];
const xy: ChartName[] = ['LineChart', 'ColumnChart', 'IntervalChart'];

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
    why: "amCharts fills a tooltip with its series' color and picks a text color to match. amCharts fills an axis's tooltip (the cursor's date or value) dark and square. Kilowatt shows every tooltip, an axis's included, on the menu surface (`background.level3`) with `text.primary`, outlined in `border.level1` and rounded with the theme radius, like a menu, so tooltips read the same on every series and axis.",
    charts: all,
    apply: ({ theme, mui, color }) => {
      theme.rule('Tooltip').setAll({ getFillFromSprite: false, getStrokeFromSprite: false, autoTextColor: false });
      const surface = {
        fill: color(mui.palette.background.level3),
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
    title: 'One value axis on the right',
    why: 'amCharts puts a value axis on the left. Kilowatt puts a chart\'s one value axis on the right; a chart with two units puts its first on the left and its second on the right, two at most.',
    charts: xy,
    convention: {
      amchartsDefault: '`AxisRendererY` with `opposite: false`',
      kilowatt: '`opposite: true` for a single value axis; left then right for two units; along the bottom for horizontal bars',
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
    charts: xy,
    convention: {
      amchartsDefault: 'A single-row legend wherever it is pushed',
      kilowatt: '`legend(root)` below the plot, for two or more series',
      where: 'Every chart with a legend',
    },
    check: /legend\(root\)/,
  },
  {
    id: 'reference-lines',
    kind: 'convention',
    title: 'Targets and benchmarks as dashed lines',
    why: "amCharts draws an axis range as a solid gridline with an axis label. Kilowatt draws a target or benchmark as a dashed line in `text.secondary`, labeled with its name, full value and unit at the plot's left edge on a plate of the card surface, over the series, so it reads as a reference rather than data, no line runs through its label, and the label never covers the latest values at the right. An `IntervalChart` target, which the readings are judged against as you zoom, keeps amCharts' own label for the line, centered on it at the right edge, so amCharts moves the two together.",
    charts: ['LineChart', 'Sparkline', 'IntervalChart'],
    convention: {
      amchartsDefault: 'An axis range: a solid gridline in the grid color, its label among the axis numbers',
      kilowatt: '`references`, drawn by `referenceLines` from `src/charts/theme`: a dashed `text.secondary` line, labeled "Name: value unit" at the left edge of the plot on the card surface; an `IntervalChart` target is labeled by amCharts\' own axis-range label instead, centered on its line at the plot\'s right edge on `action.hover` (`onLine`)',
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
    why: "amCharts draws no markers until a bullet is added, and charts then tend to mark every point. Kilowatt draws none by default; `markers: 'last'` marks the latest reading, and `'all'` marks every point of sparse data, where each point is a reading. A marker is a 4px dot in the line's color (or its band's) ringed in the card surface, so it stays legible where lines cross.",
    charts: ['LineChart', 'Sparkline'],
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
    title: 'Heatmaps color by deviation or magnitude, in steps',
    why: "amCharts' heat rules blend continuously between two colors of the chart's choosing. Kilowatt's heatmap uses the chart color jobs (Rules → Charts): a deviation from 0 in `success` below and `error` above, in four steps of strength up to a cap, around a neutral midpoint; a magnitude in the steps of `chart.sequential`. Cells with no value take the range-band color and say why in the tooltip, and a legend in words reads the scale, so no cell rests on color alone.",
    charts: ['Heatmap'],
    convention: {
      amchartsDefault: '`heatRules` blending between any two colors, continuously',
      kilowatt: "`scale=\"diverging\"`: `success`/`error` at 25–100% strength by distance from 0, capped; `scale=\"sequential\"`: `chart.sequential` steps; no data in `action.hover`; a legend in words under the grid",
      where: 'Every heatmap',
    },
    check: /colors\.status\.success/,
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
];
