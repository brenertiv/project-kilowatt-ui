import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { tooltipNumberFormat, type ChartInset } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One cell: where it sits, and its value or why it has none. */
export type HeatmapCell = {
  /** The row it sits in, one of `rows`. */
  row: string;
  /** The column it sits in, one of `columns`. */
  column: string;
  /** The value, in `unit`. Leave it out for a cell with no value, and say why with `state`. */
  value?: number;
  /** Why the cell has no value: `'noData'` (nothing recorded, or before metering began) or `'pending'` (still loading). Default `'noData'` when `value` is missing. */
  state?: 'noData' | 'pending';
};

export type HeatmapProps = {
  /** The row labels, top to bottom: buildings, meters. */
  rows: string[];
  /** The column labels, left to right: months, hours. */
  columns: string[];
  /** The cells, in any order; a row and column with no cell shows as no data. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  cells: HeatmapCell[];
  /** How values map to color. `'diverging'`: a change from a midpoint of 0, below it in `success` and above it in `error`, stronger the further from 0, up to `cap`; for a variance where less is better. `'sequential'`: a magnitude, on `chart.sequential`, light to dark. Default `'diverging'`. */
  scale?: 'diverging' | 'sequential';
  /** For a diverging scale, the distance from 0 at which a cell takes the full color; further values take it too. Default: the largest distance in `cells`. */
  cap?: number;
  /** The unit of the values, shown in the tooltip and the legend: `%`, `kWh`. */
  unit: string;
  /** For a diverging scale, what each side means, for the legend: `['Less than last year', 'More than last year']`. */
  sides?: [string, string];
  /** One sentence on what the heatmap shows, with the cells that matter. It isn't shown: it's the figure's accessible name, the heatmap's text alternative for screen readers. */
  summary: string;
  /** The height of each row in pixels. Default `32`. */
  rowHeight?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`). Default `2`. */
  inset?: ChartInset;
};

/** How many steps a diverging scale has on each side of 0: the cell's color at 25%, 50%, 75% and 100% strength. */
const steps = 4;

/** A value's strength on a diverging scale: 1 to `steps`, by its distance from 0 against `cap`. */
const strength = (value: number, cap: number) => Math.min(steps, Math.max(1, Math.ceil((Math.abs(value) / cap) * steps)));

const states = { noData: 'No data', pending: 'Loading' } as const;

/** A number with its unit: `%` sits against the number, every other unit after a space. */
const withUnit = (number: string, unit: string) => (unit === '%' ? `${number}%` : `${number} ${unit}`);

/**
 * A heatmap of values across two dimensions, such as buildings by month, in Kilowatt's chart theme
 * (Rules → Charts): a reference implementation that Enertiv's app rebuilds. A diverging scale shows
 * deviation from 0 in `success` and `error` either side of it, in four steps of strength; a sequential
 * scale shows magnitude on `chart.sequential`. Cells with no value take the range-band color and say
 * why in their tooltip. Every cell has a tooltip with its row, column and full value, and a legend
 * under the grid reads the scale in words. The chart sits in a `figure` named by `summary`.
 *
 * @summary A grid of cells colored by value across two dimensions, diverging or sequential, with a legend in words.
 * @import import { Heatmap } from 'src/charts/Heatmap';
 */
export function Heatmap({
  rows,
  columns,
  cells,
  scale = 'diverging',
  cap,
  unit,
  sides = ['Below', 'Above'],
  summary,
  rowHeight = 32,
  inset = 2,
}: HeatmapProps) {
  const values = cells.flatMap(({ value }) => (value === undefined ? [] : [value]));
  const limit = cap ?? Math.max(1, ...values.map(Math.abs));
  const [low, high] = [Math.min(...values), Math.max(...values)];

  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const yAxis = chart.yAxes.push(
        am5xy.CategoryAxis.new(root, { categoryField: 'row', renderer: am5xy.AxisRendererY.new(root, { inversed: true, minGridDistance: 1 }) }),
      );
      const xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, { categoryField: 'column', renderer: am5xy.AxisRendererX.new(root, { opposite: true, minGridDistance: 1 }) }),
      );
      // Cells sit edge to edge with a gap of the card surface, so the grid needs no gridlines of its own.
      for (const axis of [xAxis, yAxis] as am5xy.Axis<am5xy.AxisRenderer>[]) axis.get('renderer').grid.template.set('forceHidden', true);
      // Long row names (building addresses) truncate; each cell's tooltip names its row in full.
      yAxis.get('renderer').labels.template.setAll({ oversizedBehavior: 'truncate', maxWidth: 160, centerX: 0, paddingLeft: 0 });
      yAxis.data.setAll(rows.map((row) => ({ row })));
      xAxis.data.setAll(columns.map((column) => ({ column })));

      // The fill for a value: a diverging step of success or error, or a step of the sequential ramp.
      const fill = (value: number) => {
        if (scale === 'sequential') {
          const ramp = colors.sequential;
          const at = high === low ? 0 : (value - low) / (high - low);
          return { fill: ramp[Math.min(ramp.length - 1, Math.floor(at * ramp.length))], fillOpacity: 1 };
        }
        if (value === 0) return { fill: colors.neutral, fillOpacity: 0.25 };
        return { fill: value < 0 ? colors.status.success : colors.status.error, fillOpacity: strength(value, limit) / steps };
      };
      const byKey = new Map(cells.map((cell) => [`${cell.row}\u0000${cell.column}`, cell]));
      const data = rows.flatMap((row) =>
        columns.map((column) => {
          const cell = byKey.get(`${row}\u0000${column}`);
          const value = cell?.value;
          const note = value === undefined ? states[cell?.state ?? 'noData'] : undefined;
          return {
            row,
            column,
            value: value ?? 0,
            // A change is signed, so "+12%" and "−12%" don't rest on the cell's color.
            text: note ?? withUnit(`${scale === 'diverging' && value! > 0 ? '+' : ''}${root.numberFormatter.format(value!, tooltipNumberFormat)}`, unit),
            // A cell with no value takes the range-band color, so it reads as absent rather than as a value.
            cellSettings: note ? { fill: colors.band, fillOpacity: 1 } : fill(value!),
          };
        }),
      );

      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          xAxis,
          yAxis,
          categoryXField: 'column',
          categoryYField: 'row',
          valueField: 'value',
          clustered: false,
          tooltip: am5.Tooltip.new(root, {}),
        }),
      );
      series.columns.template.setAll({
        templateField: 'cellSettings',
        width: am5.percent(100),
        height: am5.percent(100),
        // The gap between cells is the card surface showing through.
        stroke: colors.surface,
        strokeWidth: 2,
        strokeOpacity: 1,
        cornerRadiusTL: 2,
        cornerRadiusTR: 2,
        cornerRadiusBL: 2,
        cornerRadiusBR: 2,
        tooltipText: '{row}, {column}: {text}',
      });
      series.data.setAll(data);
    },
    [rows, columns, cells, scale, limit, low, high, unit],
  );
  const ref = useChart(build);

  // The legend reads the scale in words under the grid, with swatches in the cells' colors.
  const swatch = (bgcolor: string, opacity = 1) => <Box key={`${bgcolor}${opacity}`} aria-hidden sx={{ width: 16, height: 12, borderRadius: 0.5, bgcolor, opacity }} />;
  const caption = (text: string) => (
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {text}
    </Typography>
  );
  const number = (value: number) => withUnit(new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value), unit);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height: rows.length * rowHeight + 32 }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 1 }}>
        {scale === 'diverging' ? (
          <>
            {caption(`${sides[0]} (−${number(limit)} or more)`)}
            {[4, 3, 2, 1].map((step) => swatch('success.main', step / steps))}
            {swatch('chart.neutral', 0.25)}
            {[1, 2, 3, 4].map((step) => swatch('error.main', step / steps))}
            {caption(`${sides[1]} (+${number(limit)} or more)`)}
          </>
        ) : (
          <>
            {caption(number(low))}
            {[0, 1, 2, 3, 4].map((step) => swatch(`chart.sequential.${step}`))}
            {caption(number(high))}
          </>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          {swatch('action.hover')}
          {caption('No data')}
        </Box>
      </Box>
    </Box>
  );
}
