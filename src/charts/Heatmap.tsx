import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import type { WorseSide } from './deviation';
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
  /** How values map to color. Every cell is one end color over the card at an opacity of its value, fading to the bare card. `'diverging'`: a distance from a midpoint of 0, stronger the further from 0, full from `cap` on. `'sequential'`: a magnitude, `chart.sequential[3]` at the cell's place between the lowest and highest value. Default `'diverging'`. */
  scale?: 'diverging' | 'sequential';
  /** For a diverging scale, which side of 0 is worse: `'above'` where less is better (energy, cost, emissions) and `'below'` where more is (occupancy, data coverage), the worse side in `error` and the better in `chart.neutral`; or `'none'` for a comparison where neither side is worse (this month against a year earlier), on `chart.diverging`, brand blue below and parchment above. Default `'above'`. */
  worse?: WorseSide | 'none';
  /** For a diverging scale, the distance from 0 at which a cell takes the full color; further values take it too. Set it to the change that matters. Default: the largest distance in `cells`. */
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

const states = { noData: 'No data', pending: 'Loading' } as const;

/** A number with its unit: `%` sits against the number, every other unit after a space. */
const withUnit = (number: string, unit: string) => (unit === '%' ? `${number}%` : `${number} ${unit}`);

/**
 * A heatmap of values across two dimensions, such as buildings by month, in Kilowatt's chart theme
 * (Rules → Charts): a reference implementation that Enertiv's app rebuilds. Every cell is an overlay:
 * one end color over the card at an opacity of its value, continuous, full from the cap and fading to
 * the bare card at no change. A diverging scale shows a distance from 0: a deviation, the worse side in
 * `error` and the better side in `chart.neutral`, or with `worse="none"` a comparison on `chart.diverging`;
 * a sequential scale shows magnitude on `chart.sequential[3]` against the range. Cells with no value are
 * hatched and say why in their tooltip. Every cell has a tooltip with its row, column and full value, and a
 * legend under the grid draws the scale as a gradient with the cap or the range named at its ends. The chart
 * sits in a `figure` named by `summary`.
 *
 * @summary A grid of cells colored by value across two dimensions, a deviation, a comparison or a magnitude, with a gradient legend.
 * @import import { Heatmap } from 'src/charts/Heatmap';
 */
export function Heatmap({
  rows,
  columns,
  cells,
  scale = 'diverging',
  worse = 'above',
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

      // The fill for a value: one end color over the card at an opacity of the value over its cap or range,
      // blended to a solid color, since the canvas can't blend through CSS. No change is the bare card.
      const fill = (value: number) => {
        if (scale === 'sequential') return { fill: colors.heat.magnitude(high === low ? 0 : (value - low) / (high - low)) };
        const strength = Math.abs(value) / limit;
        if (worse === 'none') return { fill: (value < 0 ? colors.heat.below : colors.heat.above)(strength) };
        const isWorse = worse === 'above' ? value > 0 : value < 0;
        return { fill: (isWorse ? colors.heat.error : colors.heat.neutral)(strength) };
      };
      // No data is hatched in border.level3 over the card, so it reads as absent rather than as a value or as no change.
      const hatch = am5.LinePattern.new(root, { color: colors.hatch, rotation: 45, strokeWidth: 1, gap: 4 });
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
            cellSettings: note ? { fill: colors.surface, fillPattern: hatch } : fill(value!),
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
        // Every fill is a solid color already blended over the card, so no cell is translucent.
        fillOpacity: 1,
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
    [rows, columns, cells, scale, worse, limit, low, high, unit],
  );
  const ref = useChart(build);

  // The legend draws the scale as the cells do, an end color fading to the card (transparent), with its ends in words.
  type VarsPalette = NonNullable<Theme['vars']>['palette'];
  const gradient = (stops: (palette: VarsPalette) => string) => (
    <Box
      aria-hidden
      sx={(theme) => ({ width: theme.spacing(18), height: theme.spacing(1.5), borderRadius: 0.5, background: `linear-gradient(to right, ${stops(theme.vars!.palette)})` })}
    />
  );
  // The ends of a diverging scale, left (below 0) to right (above 0).
  const ends = (palette: VarsPalette): [string, string] => {
    if (worse === 'none') return [palette.chart.diverging.below, palette.chart.diverging.above];
    return worse === 'above' ? [palette.chart.neutral, palette.error.main] : [palette.error.main, palette.chart.neutral];
  };
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
            {gradient((palette) => `${ends(palette)[0]}, transparent 50%, ${ends(palette)[1]}`)}
            {caption(`${sides[1]} (+${number(limit)} or more)`)}
          </>
        ) : (
          <>
            {caption(number(low))}
            {gradient((palette) => `transparent, ${palette.chart.sequential[3]}`)}
            {caption(number(high))}
          </>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Box
            aria-hidden
            sx={{
              width: 16,
              height: 12,
              borderRadius: 0.5,
              backgroundImage: (theme) => `repeating-linear-gradient(-45deg, ${theme.vars!.palette.border.level3} 0 1px, transparent 1px 5px)`,
            }}
          />
          {caption('No data')}
        </Box>
      </Box>
    </Box>
  );
}
