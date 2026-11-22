import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { legend, seriesColors, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One outline: the data field it plots, its name in the legend and tooltip, and how it takes its color. */
export type RadarSeries = SeriesColor & {
  /** The field in each data row that holds this series' values. */
  field: string;
  /** The series' name in the legend and tooltip, in sentence case. */
  name: string;
  /** Draws the outline dashed with no fill: a variant or a comparison (the previous period), usually with `neutral`. Default `false`. */
  dashed?: boolean;
};

export type RadarChartProps = {
  /** The rows to plot, one per spoke, each with the category's label in `categoryField` and a number per series. Five to ten rows read well. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, string | number>[];
  /** The field in each row that holds the category, the spoke's label. */
  categoryField: string;
  /** The series, in legend order. Two or three read well; up to six colored series, plus any `neutral` ones. Keep it stable, like `data`. */
  series: RadarSeries[];
  /** The unit of the values, shown at the chart's top left and in the tooltip: `kBtu/sq ft`, `pts`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The top of the value range, for a measure with a fixed top: `100` for a score. Default: it fits the data. */
  max?: number;
  /** The chart's height in pixels, the legend included. Default `320`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

const dash = [4, 4];

/**
 * A radar chart of one measure across five to ten categories, in Kilowatt's chart theme (Rules →
 * Charts): a reference implementation that Enertiv's app rebuilds. Each category is a spoke and each
 * series an outline around them, so a shape shows which categories stand out; values start at 0 at
 * the center. Series take `chart.series` colors in order, or a fixed `slot`; a `neutral` series (the
 * previous period) is context, and a `dashed` one has no fill. Every point is marked and has a
 * full-value tooltip. It doesn't zoom or pan. The chart sits in a `figure` named by `summary`. Put it
 * in a `Card` under a `CardHeader`.
 *
 * @summary A radar chart of one measure across five to ten categories, each series an outline over the spokes.
 * @import import { RadarChart } from 'src/charts/RadarChart';
 */
export function RadarChart({ data, categoryField, series, unit, summary, max, height = 320, inset = 2 }: RadarChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      if (data.length < 3) console.warn('A RadarChart needs at least three categories to draw a shape; use a column chart for fewer.');
      const chart = root.container.children.push(am5radar.RadarChart.new(root, { panX: false, panY: false, layout: root.verticalLayout, radius: am5.percent(78) }));
      // The unit sits at the chart's top left, read horizontally, as it sits above a value axis on an XY chart.
      root.container.children.push(am5.Label.new(root, { text: unit, x: 0, y: 0, paddingTop: 0, paddingLeft: 0 }));
      const spokes = am5radar.AxisRendererCircular.new(root, { minGridDistance: 20 });
      const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField, maxDeviation: 0, renderer: spokes }));
      // Category names read level beside their spoke, rather than bent along the ring, and long ones (building addresses) wrap.
      spokes.labels.template.setAll({ textType: 'adjusted', radius: 10, oversizedBehavior: 'wrap', maxWidth: 96, textAlign: 'center' });
      // Values start at 0 at the center, so a distance reads as an amount.
      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, { min: 0, ...(max !== undefined ? { max, strictMinMax: true } : {}), renderer: am5radar.AxisRendererRadial.new(root, { minGridDistance: 28 }) }),
      );
      const strokes = seriesColors(series, colors);
      const lines = series.map(({ field, name, dashed }, i) => {
        const line = chart.series.push(
          am5radar.RadarLineSeries.new(root, { name, xAxis, yAxis, categoryXField: categoryField, valueYField: field, stroke: strokes[i], fill: strokes[i] }),
        );
        line.strokes.template.setAll({ strokeWidth: 2, ...(dashed ? { strokeDasharray: dash } : {}) });
        // A light fill makes the outline read as a shape; a dashed variant stays an outline.
        if (!dashed) line.fills.template.setAll({ visible: true, fillOpacity: 0.16 });
        // Each point is a reading: a 4px dot ringed in the card surface, with its exact value on hover.
        line.bullets.push((bulletRoot) =>
          am5.Bullet.new(bulletRoot, {
            sprite: am5.Circle.new(bulletRoot, {
              radius: 4,
              fill: strokes[i],
              stroke: colors.surface,
              strokeWidth: 2,
              tooltipText: `${name}, {categoryX}: {valueY.formatNumber('${tooltipNumberFormat}')} ${unit}`,
            }),
          }),
        );
        return line;
      });
      xAxis.data.setAll(data);
      if (lines.length > 1) chart.children.push(legend(root)).data.setAll(lines);
      for (const line of lines) line.data.setAll(data);
    },
    [data, categoryField, series, unit, max],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
