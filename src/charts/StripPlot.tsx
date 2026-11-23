import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import { tooltipNumberFormat, type ChartInset, type ReferenceLine } from './theme';
import { useChart, type ChartContext } from './useChart';

export type StripPlotProps = {
  /** The items, one dot each, with a name in `labelField`, a group in `categoryField` and a value in `valueField`. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, string | number>[];
  /** The field in each row that holds the item's group, one row of dots each, in the order they first appear: a property type. */
  categoryField: string;
  /** The field in each row that holds the item's value. */
  valueField: string;
  /** The field in each row that holds the item's name, in its tooltip. */
  labelField: string;
  /** What the value is, in sentence case, in the tooltips: `ENERGY STAR score`. */
  name: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The unit of the values, at the end of the value axis and in the tooltips. Empty for a score. Default `''`. */
  unit?: string;
  /** Thresholds the values are read against (certification at 75), each a dashed line down the plot, named at its top. Keep it stable, like `data`. Default none. */
  references?: ReferenceLine[];
  /** The end of the scale, for a measure with one (100 for a score). Default: the axis fits the data. */
  max?: number;
  /** The plot's height in pixels. Default: 48px a group, plus the axis. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

const noReferences: ReferenceLine[] = [];

/** A dot's radius: 5px, small enough that a group's dots overlap only where their values are close. */
const dot = 5;

/** How far a dot may sit from its row's center, as a share of the row: spread so dots of equal value don't hide each other. */
const spread = 0.3;

/**
 * A strip plot: every item's value as a dot, one row per group, in Kilowatt's chart theme
 * (Rules → Charts). It's a reference implementation that Enertiv's app rebuilds, built on amCharts'
 * scatter (an XY chart of bullets with no lines). Each item is a dot in the first series color, ringed in
 * the card surface, placed along the value axis and spread up and down its row by a fixed amount per item
 * (not random, so it doesn't move between renders), so dots of equal value stay apart. A `reference` is a
 * dashed line down the plot in `text.secondary`, named with its value at its top, on a plate of the card
 * surface. The chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A strip plot: every item's value as a dot, one row per group, against a threshold.
 * @import import { StripPlot } from 'src/charts/StripPlot';
 */
export function StripPlot({ data, categoryField, valueField, labelField, name, summary, unit = '', references = noReferences, max, height, inset = 2 }: StripPlotProps) {
  const groups = new Set(data.map((row) => String(row[categoryField]))).size;
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      // Room at the right for a dot at the end of the scale, and at the top for the references' names.
      const chart = root.container.children.push(am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: dot + 2, paddingTop: 24 }));
      // Groups down the left, first at the top, and the values along the bottom.
      const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, { categoryField: 'category', renderer: am5xy.AxisRendererY.new(root, { inversed: true, minGridDistance: 16 }) }));
      yAxis.get('renderer').labels.template.setAll({ oversizedBehavior: 'truncate', maxWidth: Math.min(160, root.width() * 0.4), centerX: 0, paddingLeft: 0 });
      const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, { min: 0, ...(max === undefined ? {} : { max, strictMinMax: true }), renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }) }),
      );
      xAxis.get('renderer').labels.template.set('maxPosition', 0.97);
      if (unit) xAxis.children.push(am5.Label.new(root, { text: unit, x: am5.p100, centerX: am5.p100, paddingTop: 4, paddingRight: 0 }));

      // Each reference: a dashed line down the plot, named with its value at the top on a plate of the card surface.
      for (const { value, label } of references) {
        const item = xAxis.makeDataItem({ value });
        xAxis.createAxisRange(item);
        const grid = item.get('grid');
        grid?.setAll({ forceHidden: false, stroke: colors.reference, strokeOpacity: 1, strokeDasharray: [4, 4], location: 0 });
        item.get('label')?.set('forceHidden', true);
        const plate = chart.plotContainer.children.push(
          am5.Label.new(root, {
            text: `${label}: ${root.numberFormatter.format(value, tooltipNumberFormat)}${unit ? ` ${unit}` : ''}`,
            fill: colors.reference,
            y: 0,
            centerX: am5.p50,
            centerY: am5.p100,
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 4,
            paddingRight: 4,
            background: am5.Rectangle.new(root, { fill: colors.surface, fillOpacity: 1 }),
          }),
        );
        // The label follows its line, which amCharts moves as the axis lays out.
        const follow = () => plate.set('x', grid?.x() ?? 0);
        grid?.on('x', follow);
        follow();
      }

      // A fixed spread per item, from its place in its group, so the dots don't move between renders.
      const seen = new Map<string, number>();
      const rows = data.map((row) => {
        const category = String(row[categoryField]);
        const n = seen.get(category) ?? 0;
        seen.set(category, n + 1);
        const value = Number(row[valueField]);
        return {
          ...row,
          category,
          value,
          offset: 0.5 + spread * Math.sin(n * 2.399),
          // Each dot names its item and shows its exact value on hover.
          tip: `${row[labelField]} (${category}), ${name}: ${root.numberFormatter.format(value, tooltipNumberFormat)}${unit ? ` ${unit}` : ''}`,
        };
      });
      const dots = chart.series.push(am5xy.LineSeries.new(root, { xAxis, yAxis, categoryYField: 'category', valueXField: 'value', fill: colors.series[0], stroke: colors.series[0] }));
      dots.strokes.template.set('forceHidden', true);
      dots.bullets.push((bulletRoot, _series, dataItem) =>
        am5.Bullet.new(bulletRoot, {
          locationY: (dataItem.dataContext as (typeof rows)[number]).offset,
          sprite: am5.Circle.new(bulletRoot, { radius: dot, fill: colors.series[0], stroke: colors.surface, strokeWidth: 1.5, tooltipText: '{tip}' }),
        }),
      );
      yAxis.data.setAll([...seen.keys()].map((category) => ({ category })));
      dots.data.setAll(rows);
    },
    [data, categoryField, valueField, labelField, name, unit, references, max],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height: height ?? groups * 48 + 64 }} />
    </Box>
  );
}
