import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import { formatUnit, type Unit } from '../lib/format';
import { useChartFrame } from './ChartFrame';
import { toRows, xValues, type ChartData } from './types';
import { useChartRoot } from './useChartRoot';
import { addCursor, addSharedTooltip, createValueAxis, createXYChart } from './xy';

export type CategoryBarChartProps = {
  /** The same `ChartData` passed to the enclosing `ChartFrame`. Each point's `x` is a category name. */
  data: ChartData;
  /** Formats the value axis, and tooltips for series without their own `unit`. Defaults to `count` formatting. */
  unit?: Unit;
  /** Stack series on one bar per category instead of grouping them side by side. Defaults to false. Use when the total matters. */
  stacked?: boolean;
  /** Horizontal bars read better for long category names. Defaults to false. */
  horizontal?: boolean;
  /** Category whose bar is drawn in the accent to carry the story. Applies to a single series only. */
  highlight?: string;
  /** Print the value at the bar tip. Defaults to false. Applies to a single series only; use for short ones. */
  valueLabels?: boolean;
  /** Accessible name for the plot, e.g. "Consumption by building". Required: the plot is an image to assistive tech. */
  ariaLabel: string;
};

/**
 * Bars over a category axis, grouped or stacked, vertical or horizontal. Columns cap at 24px, round
 * their data end, and keep a 2px surface gap from their neighbours. Use it to compare categories
 * such as buildings or systems; for change over time use `TimeSeriesChart`, and for a single number
 * use `StatCard`. Render it inside `<ChartFrame>` (it throws otherwise); colors come from series ids
 * via the token palette, so never pass colors.
 *
 * @summary Grouped, stacked or horizontal bar chart over categories, inside ChartFrame.
 * @import import { CategoryBarChart } from 'src/charts/CategoryBarChart';
 */
export function CategoryBarChart({
  data,
  unit,
  stacked = false,
  horizontal = false,
  highlight,
  valueLabels = false,
  ariaLabel,
}: CategoryBarChartProps) {
  const { hidden, colors } = useChartFrame();
  const seriesRef = useRef(new Map<string, am5xy.ColumnSeries>());

  const hostRef = useChartRoot(
    ({ root, values }) => {
      const chart = createXYChart(root);
      const categories = xValues(data).map((x) => ({ x }));

      const categoryRenderer = horizontal
        ? am5xy.AxisRendererY.new(root, { minGridDistance: 20, inversed: true })
        : am5xy.AxisRendererX.new(root, { minGridDistance: 24 });
      categoryRenderer.grid.template.set('forceHidden', true);
      const categoryAxis = am5xy.CategoryAxis.new(root, { categoryField: 'x', renderer: categoryRenderer });
      categoryAxis.data.setAll(categories);

      let xAxis: am5xy.Axis<am5xy.AxisRenderer>;
      let yAxis: am5xy.Axis<am5xy.AxisRenderer>;
      if (horizontal) {
        yAxis = chart.yAxes.push(categoryAxis);
        const valueRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 48 });
        xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, { min: 0, extraMax: 0.08, renderer: valueRenderer }));
        valueRenderer.labels.template.adapters.add('text', (text, target) => {
          const value = (target.dataItem as am5.DataItem<am5xy.IValueAxisDataItem> | undefined)?.get('value');
          return typeof value === 'number' ? formatUnit(value, unit ?? 'count', { compact: true }) : text;
        });
      } else {
        xAxis = chart.xAxes.push(categoryAxis);
        yAxis = createValueAxis(root, chart, unit, { min: 0 });
      }

      const rows = toRows(data);
      const built = data.series.map((series) => {
        const color = am5.color(colors[series.id]);
        const item = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name: series.label,
            xAxis,
            yAxis,
            stacked,
            clustered: !stacked,
            ...(horizontal
              ? { valueXField: series.id, categoryYField: 'x' }
              : { valueYField: series.id, categoryXField: 'x' }),
            fill: color,
            stroke: color,
          }),
        );
        // Thickness runs across the category axis; the value axis side stays free to grow.
        item.columns.template.setAll(
          horizontal
            ? {
                height: am5.percent(stacked ? 60 : 80),
                maxHeight: 24,
                cornerRadiusTL: 0,
                cornerRadiusTR: 4,
                cornerRadiusBL: 0,
                cornerRadiusBR: 4,
              }
            : { width: am5.percent(stacked ? 60 : 80), maxWidth: 24 },
        );
        if (highlight && data.series.length === 1) {
          item.columns.template.adapters.add('fill', (fill, target) => {
            const context = target.dataItem?.dataContext as { x?: string | number } | undefined;
            return context?.x === highlight ? am5.color(values.secondaryMain) : fill;
          });
          item.columns.template.adapters.add('stroke', (stroke, target) => {
            const context = target.dataItem?.dataContext as { x?: string | number } | undefined;
            return context?.x === highlight ? am5.color(values.secondaryMain) : stroke;
          });
        }
        if (valueLabels && data.series.length === 1) {
          item.bullets.push((bulletRoot) =>
            am5.Bullet.new(bulletRoot, {
              locationY: horizontal ? 0.5 : 1,
              locationX: horizontal ? 1 : 0.5,
              sprite: am5.Label.new(bulletRoot, {
                text: '{valueY}{valueX}',
                populateText: true,
                centerX: horizontal ? 0 : am5.p50,
                centerY: horizontal ? am5.p50 : am5.p100,
                dx: horizontal ? 6 : 0,
                dy: horizontal ? 0 : -4,
                fill: am5.color(values.textSecondary),
              }),
            }),
          );
        }
        item.data.setAll(rows);
        seriesRef.current.set(series.id, item);
        if (hidden.has(series.id)) item.hide(0);
        return { id: series.id, label: series.label, unit: series.unit ?? unit, color: colors[series.id], item };
      });

      if (!horizontal) {
        addCursor(root, chart, xAxis);
        addSharedTooltip(root, chart, xAxis, built, (x) => String(x), values);
      } else {
        for (const entry of built) {
          entry.item.set(
            'tooltip',
            am5.Tooltip.new(root, {
              labelText: `[${values.textPrimary}]{valueX.formatNumber("#,###.#")}[/] [${values.textSecondary}]${entry.label}[/]`,
            }),
          );
        }
      }

      return () => {
        seriesRef.current.clear();
      };
    },
    [data, unit, stacked, horizontal, highlight, valueLabels, colors],
  );

  useEffect(() => {
    for (const [id, series] of seriesRef.current) {
      if (hidden.has(id)) series.hide();
      else series.show();
    }
  }, [hidden]);

  return <div ref={hostRef} className="chart-host chart-plot" role="img" aria-label={ariaLabel} />;
}
