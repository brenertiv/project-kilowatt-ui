import * as am5 from '@amcharts/amcharts5';
import type * as am5xy from '@amcharts/amcharts5/xy';

/**
 * Clicks inside a reference chart, for a story's `play` function. A chart draws on a canvas, so there is
 * no element to click: these find the amCharts chart drawn inside a `figure` and send the click to the
 * column or the place in the plot the story names, as a pointer would.
 */

/** The XY chart drawn inside a figure, once amCharts has made it. */
function xyChartIn(figure: HTMLElement): am5xy.XYChart | undefined {
  const root = (am5.registry.rootElements as am5.Root[]).find((candidate) => figure.contains(candidate.dom));
  return root?.container.children.getIndex(0) as am5xy.XYChart | undefined;
}

const click = (target: am5.Sprite, point: { x: number; y: number }) =>
  target.events.dispatch('click', { type: 'click', target, point, originalEvent: new MouseEvent('click'), simulated: true, native: false } as never);

/**
 * Whether the chart in a figure has drawn its columns: wait for it before `clickColumn`.
 *
 * @param figure - The chart's `figure`.
 */
export function hasColumns(figure: HTMLElement): boolean {
  const series = xyChartIn(figure)?.series.getIndex(0) as am5xy.ColumnSeries | undefined;
  return (series?.columns.length ?? 0) > 0;
}

/**
 * Clicks the first series' column for a row.
 *
 * @param figure - The chart's `figure`.
 * @param index - The row's index in the chart's `data`.
 */
export function clickColumn(figure: HTMLElement, index: number) {
  const series = xyChartIn(figure)?.series.getIndex(0) as am5xy.ColumnSeries | undefined;
  const column = series?.dataItems[index]?.get('graphics');
  if (!column) throw new Error(`The chart has no column for row ${index}.`);
  click(column, column.toGlobal({ x: 0, y: 0 }));
}

/**
 * Clicks a place in the plot, given as fractions from its left and top edges.
 *
 * @param figure - The chart's `figure`.
 * @param across - How far across the plot, `0` (left) to `1` (right).
 * @param down - How far down the plot, `0` (top) to `1` (bottom). Default `0.5`.
 */
export function clickPlot(figure: HTMLElement, across: number, down = 0.5) {
  const plot = xyChartIn(figure)?.plotContainer;
  if (!plot || !plot.width()) throw new Error('The chart has no plot yet.');
  click(plot, plot.toGlobal({ x: plot.width() * across, y: plot.height() * down }));
}

/**
 * Whether the chart in a figure has laid out its plot: wait for it before `clickPlot`.
 *
 * @param figure - The chart's `figure`.
 */
export function hasPlot(figure: HTMLElement): boolean {
  return (xyChartIn(figure)?.plotContainer.width() ?? 0) > 0;
}
