import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import { formatUnit, type Unit } from '../lib/format';
import { useTheme } from '../theme/ThemeProvider';
import { inkOn, rampIndex, sequentialRamp } from './color';
import type { ChartData } from './types';
import { useChartRoot } from './useChartRoot';

export type HeatmapChartProps = {
  /** Each series is a row; each point's x is a column. Null points leave the cell empty. The same object goes to `ChartFrame`. */
  data: ChartData;
  /** Formats values in tooltips and cell labels. Defaults to `'count'`. */
  unit?: Unit;
  /** Number of bands in the color ramp. Defaults to 7. Fewer bands are easier to tell apart; pass the same value to `HeatScale`. */
  steps?: number;
  /** Print values inside cells. Defaults to false. Only when cells are wide enough to hold them. */
  cellLabels?: boolean;
  /** Accessible name for the plot, e.g. "Load profile heatmap". Required: the plot is an image to assistive tech. */
  ariaLabel: string;
};

export type HeatScaleProps = {
  /** The lowest value in the heatmap's data. */
  min: number;
  /** The highest value in the heatmap's data. */
  max: number;
  /** Formats the two end labels. Defaults to `'count'`; match the heatmap's `unit`. */
  unit?: Unit;
  /** Number of bands. Defaults to 7; match the heatmap's `steps`. */
  steps?: number;
};

/** Which categorical slot the ramp is built from. Blue by default, per the palette. */
const rampSlot = 'chart1';

/**
 * Magnitude over two categorical axes, such as load by weekday and hour. One hue, light to dark,
 * flipped in dark mode so "more" always reads as more. Render it inside `<ChartFrame>` with
 * `legend={false}` and a `<HeatScale>` in the frame's `scale` slot. Colors come from the token ramp,
 * never from props. For a few categories compared on one measure, use `CategoryBarChart` instead.
 *
 * @summary Heatmap over two category axes with a one-hue sequential ramp, inside ChartFrame.
 * @import import { HeatmapChart } from 'src/charts/HeatmapChart';
 */
export function HeatmapChart({ data, unit = 'count', steps = 7, cellLabels = false, ariaLabel }: HeatmapChartProps) {
  const cells = data.series.flatMap((series) =>
    series.points
      .filter((point) => point.y !== null)
      .map((point) => ({ row: series.label, column: String(point.x), value: point.y as number })),
  );
  const min = Math.min(...cells.map((cell) => cell.value));
  const max = Math.max(...cells.map((cell) => cell.value));

  const hostRef = useChartRoot(
    ({ root, values, scheme }) => {
      const ramp = sequentialRamp(values[rampSlot], steps, scheme);
      const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
          panX: false,
          panY: false,
          wheelX: 'none',
          wheelY: 'none',
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          layout: root.verticalLayout,
        }),
      );
      chart.zoomOutButton.set('forceHidden', true);

      const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 24, opposite: false });
      xRenderer.grid.template.set('forceHidden', true);
      const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: 'column', renderer: xRenderer }));
      const yRenderer = am5xy.AxisRendererY.new(root, { minGridDistance: 16, inversed: true });
      yRenderer.grid.template.set('forceHidden', true);
      const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, { categoryField: 'row', renderer: yRenderer }));

      const columns = [...new Set(cells.map((cell) => cell.column))].map((column) => ({ column }));
      const rows = data.series.map((series) => ({ row: series.label }));
      xAxis.data.setAll(columns);
      yAxis.data.setAll(rows);

      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          xAxis,
          yAxis,
          categoryXField: 'column',
          categoryYField: 'row',
          valueField: 'value',
          calculateAggregates: true,
        }),
      );
      series.columns.template.setAll({
        width: am5.percent(100),
        height: am5.percent(100),
        maxWidth: undefined,
        maxHeight: undefined,
        cornerRadiusTL: 2,
        cornerRadiusTR: 2,
        cornerRadiusBL: 2,
        cornerRadiusBR: 2,
        strokeWidth: 2,
        stroke: am5.color(values.backgroundPaper),
        tooltipText: '',
      });
      series.columns.template.adapters.add('fill', (fill, target) => {
        const value = (target.dataItem?.dataContext as { value?: number } | undefined)?.value;
        return typeof value === 'number' ? am5.color(ramp[rampIndex(value, min, max, steps)]) : fill;
      });
      series.columns.template.states.create('hover', { strokeWidth: 2, stroke: am5.color(values.textPrimary) });
      series.columns.template.set('tooltip', am5.Tooltip.new(root, { labelText: '' }));
      series.columns.template.get('tooltip')?.label.adapters.add('text', (_text, target) => {
        const context = target.dataItem?.dataContext as { row: string; column: string; value: number } | undefined;
        if (!context) return '';
        return `[${values.textPrimary}]${formatUnit(context.value, unit)}[/] [${values.textSecondary}]${context.row} · ${context.column}[/]`;
      });

      if (cellLabels) {
        series.bullets.push((bulletRoot, _series, dataItem) => {
          const context = dataItem.dataContext as { value: number };
          const fill = ramp[rampIndex(context.value, min, max, steps)];
          return am5.Bullet.new(bulletRoot, {
            sprite: am5.Label.new(bulletRoot, {
              text: formatUnit(context.value, unit, { compact: true }),
              centerX: am5.p50,
              centerY: am5.p50,
              populateText: false,
              fill: am5.color(inkOn(fill, values.primaryContrastText, values.textPrimary)),
              fontSize: 10,
            }),
          });
        });
      }

      series.data.setAll(cells);
    },
    [data, unit, steps, cellLabels, min, max],
  );

  return <div ref={hostRef} className="chart-host chart-plot" role="img" aria-label={ariaLabel} />;
}

/**
 * Color key for a heatmap: the ramp with its min and max. Pass it to `ChartFrame`'s `scale` slot next
 * to a `HeatmapChart`, with the same `unit` and `steps`. For categorical series, the frame's legend is the key instead.
 *
 * @summary The min-to-max color ramp key for a HeatmapChart.
 * @import import { HeatScale } from 'src/charts/HeatmapChart';
 */
export function HeatScale({ min, max, unit = 'count', steps = 7 }: HeatScaleProps) {
  const { values, colorScheme } = useTheme();
  const ramp = sequentialRamp(values[rampSlot], steps, colorScheme);
  return (
    <div className="heat-scale" aria-label={`Scale from ${formatUnit(min, unit)} to ${formatUnit(max, unit)}`}>
      <span className="heat-scale-end">{formatUnit(min, unit, { compact: true })}</span>
      <span className="heat-scale-ramp" aria-hidden="true">
        {ramp.map((step) => (
          <span key={step} style={{ background: step }} />
        ))}
      </span>
      <span className="heat-scale-end">{formatUnit(max, unit, { compact: true })}</span>
    </div>
  );
}
