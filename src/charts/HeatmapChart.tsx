import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import { formatUnit, type Unit } from '../lib/format';
import { useTheme } from '../theme/ThemeProvider';
import { inkOn, rampIndex, sequentialRamp } from './color';
import type { ChartData } from './types';
import { useChartRoot } from './useChartRoot';

type HeatmapChartProps = {
  /** Each series is a row; each point's x is a column. */
  data: ChartData;
  unit?: Unit;
  steps?: number;
  /** Print values inside cells. Only when cells are wide enough to hold them. */
  cellLabels?: boolean;
  ariaLabel: string;
};

/** Which categorical slot the ramp is built from. Blue by default, per the palette. */
const rampSlot = 'chart1';

/**
 * Magnitude over two categorical axes. One hue, light to dark, flipped in dark
 * mode so "more" always reads as more. Pair with `<HeatScale>` in the frame's scale slot.
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
        stroke: am5.color(values.surface),
        tooltipText: '',
      });
      series.columns.template.adapters.add('fill', (fill, target) => {
        const value = (target.dataItem?.dataContext as { value?: number } | undefined)?.value;
        return typeof value === 'number' ? am5.color(ramp[rampIndex(value, min, max, steps)]) : fill;
      });
      series.columns.template.states.create('hover', { strokeWidth: 2, stroke: am5.color(values.text) });
      series.columns.template.set('tooltip', am5.Tooltip.new(root, { labelText: '' }));
      series.columns.template.get('tooltip')?.label.adapters.add('text', (_text, target) => {
        const context = target.dataItem?.dataContext as { row: string; column: string; value: number } | undefined;
        if (!context) return '';
        return `[${values.text}]${formatUnit(context.value, unit)}[/] [${values.textSecondary}]${context.row} · ${context.column}[/]`;
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
              fill: am5.color(inkOn(fill, values.onSolid, values.text)),
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

/** Color key for a heatmap: the ramp with its min and max. */
export function HeatScale({ min, max, unit = 'count', steps = 7 }: { min: number; max: number; unit?: Unit; steps?: number }) {
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
