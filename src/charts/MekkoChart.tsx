import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { stackOrder } from './stackOrder';
import { axisUnit, legend, seriesColors, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One part of every column: the data field that holds its share, its name in the legend and tooltip, and how it takes its color. */
export type MekkoPart = SeriesColor & {
  /** The field in each row that holds this part's share of the column, in percent. A column's parts add up to 100. */
  field: string;
  /** The part's name in the legend and tooltip, in sentence case: `Office`. */
  name: string;
};

export type MekkoChartProps = {
  /** The columns, left to right, each with its name in `categoryField`, its size in `widthField` and a share per part. Sort largest first. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, string | number>[];
  /** The field in each row that holds the column's name, written under it. */
  categoryField: string;
  /** The field in each row that holds the column's size, which sets its width: floor area. */
  widthField: string;
  /** The unit of the size, under each column's name and in the tooltips: `sq ft`. */
  widthUnit: string;
  /** The parts of each column, in legend order. Up to six. Keep it stable, like `data`. */
  parts: MekkoPart[];
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The plot's height in pixels. Default `280`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** The compact size under each column's name, in the viewer's locale: 4.2M. */
const compact = new Intl.NumberFormat(undefined, { notation: 'compact' });

/**
 * A Mekko (Marimekko) chart: columns whose widths are their size and whose stacks are the shares of
 * their parts, in Kilowatt's chart theme (Rules → Charts). It's a reference implementation that
 * Enertiv's app rebuilds. Each column is a whole (a fund), as wide as its share of the total
 * (`widthField`, floor area), and its parts (property types) stack to 100% in `chart.series` colors,
 * ordered dark to light as every stack is (`stackOrder`). Columns and parts are parted by 2px of the
 * card surface, each column is named with its size under it, and every rectangle's tooltip gives its
 * share and its amount. The chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A Mekko chart: columns as wide as their size, each stacked to 100% by its parts.
 * @import import { MekkoChart } from 'src/charts/MekkoChart';
 */
export function MekkoChart({ data, categoryField, widthField, widthUnit, parts, summary, height = 280, inset = 2 }: MekkoChartProps) {
  const build = useCallback(
    ({ root, scheme, colors }: ChartContext) => {
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }));
      const total = data.reduce((sum, row) => sum + Number(row[widthField]), 0);
      // Across: each column's place in the total size. Its numbers mean nothing alone, so the columns are named instead.
      const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, { min: 0, max: total, strictMinMax: true, renderer: am5xy.AxisRendererX.new(root, {}) }));
      xAxis.get('renderer').labels.template.set('forceHidden', true);
      xAxis.get('renderer').grid.template.set('forceHidden', true);
      // Up: the share of each column, 0 to 100%, on the left as a chart's one value axis is.
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, max: 100, strictMinMax: true, renderer: am5xy.AxisRendererY.new(root, { opposite: false }) }));
      axisUnit(root, chart, yAxis, '%');

      // Each column's span across the total, named under it with its size.
      let start = 0;
      const spans = data.map((row) => {
        const size = Number(row[widthField]);
        const span = { row, from: start, to: start + size, size };
        start += size;
        const item = xAxis.makeDataItem({ value: span.from, endValue: span.to });
        xAxis.createAxisRange(item);
        const label = item.get('label');
        label?.setAll({
          forceHidden: false,
          text: `${row[categoryField]}\n${compact.format(size)} ${widthUnit}`,
          location: 0.5,
          textAlign: 'center',
          oversizedBehavior: 'truncate',
          populateText: false,
        });
        // A name fits its own column, truncated where the column is narrow; its rectangles' tooltips name it in full.
        label?.adapters.add('maxWidth', () => Math.max(24, (xAxis.width() * size) / total - 8));
        item.get('grid')?.set('forceHidden', true);
        return span;
      });

      // A stack runs dark to light (darkest at the bottom), so the parts are stacked in that order; the legend keeps `parts`' order.
      const fills = seriesColors(parts, colors);
      const order = stackOrder(fills.map((fill) => fill.toCSSHex()), scheme);
      const below = spans.map(() => 0);
      const sets: am5xy.ColumnSeries[] = [];
      for (const i of order) {
        const { field, name } = parts[i];
        const set = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name,
            xAxis,
            yAxis,
            openValueXField: 'x0',
            valueXField: 'x1',
            openValueYField: 'y0',
            valueYField: 'y1',
            clustered: false,
            fill: fills[i],
            stroke: colors.surface,
          }),
        );
        // Parted by 2px of the card surface, so neighboring columns and parts read apart.
        set.columns.template.setAll({ width: am5.percent(100), strokeWidth: 2, strokeOpacity: 1, tooltipText: '{tip}' });
        set.data.setAll(
          spans.map(({ row, from, to, size }, c) => {
            const share = Number(row[field]) || 0;
            const y0 = below[c];
            below[c] += share;
            return {
              x0: from,
              x1: to,
              y0,
              y1: y0 + share,
              // Each part shows its share and its amount on hover.
              tip: `${row[categoryField]}, ${name}: ${share}% (${root.numberFormatter.format((size * share) / 100, tooltipNumberFormat)} ${widthUnit})`,
            };
          }),
        );
        sets[i] = set;
      }
      chart.children.push(legend(root)).data.setAll(sets);
    },
    [data, categoryField, widthField, widthUnit, parts],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
