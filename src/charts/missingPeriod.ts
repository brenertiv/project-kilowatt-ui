import type * as am5xy from '@amcharts/amcharts5/xy';

/**
 * A click on a period with no value (Rules → Charts: a gap is never bridged or drawn as zero). A chart draws
 * nothing where a row has no value, so there is no column or point to click: `LineChart`, `ColumnChart` and
 * `MonthLinesChart` listen on the plot instead and hand back the row under the pointer when none of the
 * chart's series has a value in it, so a page can open what explains the gap. This file holds the test and
 * the listener, so the three charts share one version.
 */

/**
 * Whether a row has no value in any of the fields: each is absent, `null`, or not a finite number. A `0` is a value.
 *
 * @param row - One row of a chart's `data`.
 * @param fields - The fields the chart's series plot.
 */
export function hasNoValue(row: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => typeof row[field] !== 'number' || !Number.isFinite(row[field]));
}

/**
 * Calls `onClick` with the row under a click on the plot, when that row has no value in any of `fields`.
 * The pointer is a hand over such a period. Pointer only: the charts draw on a canvas and have no focus of
 * their own, so a page that offers this also offers the same way through as a control or a table row.
 *
 * @param chart - The XY chart.
 * @param rowAt - The row at a place in the plot, given as fractions from its left and top edges (`0` to `1`), or none.
 * @param fields - The fields the chart's series plot.
 * @param onClick - Called with the row.
 */
export function missingPeriodClicks<Row extends Record<string, unknown>>(
  chart: am5xy.XYChart,
  rowAt: (across: number, down: number) => Row | undefined,
  fields: string[],
  onClick: (row: Row) => void,
) {
  const plot = chart.plotContainer;
  const missingAt = (point: { x: number; y: number }) => {
    const local = plot.toLocal(point);
    const [width, height] = [plot.width(), plot.height()];
    if (!width || !height || local.x < 0 || local.y < 0 || local.x > width || local.y > height) return undefined;
    const row = rowAt(local.x / width, local.y / height);
    return row && hasNoValue(row, fields) ? row : undefined;
  };
  plot.events.on('click', ({ point }) => {
    const row = missingAt(point);
    if (row) onClick(row);
  });
  plot.events.on('globalpointermove', ({ point }) => {
    plot.set('cursorOverStyle', missingAt(point) ? 'pointer' : 'default');
  });
}

/**
 * The row of a date axis's data whose interval holds a timestamp, or none: the last row that starts at or before it,
 * unless the timestamp is past the end of the last row's interval.
 *
 * @param rows - The chart's rows, oldest first.
 * @param dateField - The field that holds each row's UTC timestamp.
 * @param value - The timestamp under the pointer.
 * @param step - The axis's base interval, in milliseconds.
 */
export function rowAtDate<Row extends Record<string, number>>(rows: Row[], dateField: string, value: number, step: number): Row | undefined {
  let found: Row | undefined;
  for (const row of rows) {
    if (row[dateField]! > value) break;
    found = row;
  }
  // amCharts' base interval is nominal (a month is 30 days), so the last interval gets a little room.
  return found && value <= found[dateField]! + step * 1.1 ? found : undefined;
}
