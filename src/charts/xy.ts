import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import { formatUnit, type Unit } from '../lib/format';
import type { ThemeValues } from '../tokens';
import type { ChartSeries } from './types';

/** Shared XY chart construction so every kind gets the same chrome and cursor. */
export function createXYChart(root: am5.Root, options: { layout?: 'vertical' | 'horizontal' } = {}) {
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none',
      layout: options.layout === 'horizontal' ? root.horizontalLayout : root.verticalLayout,
      paddingLeft: 0,
      paddingRight: 8,
      paddingTop: 12,
      paddingBottom: 0,
    }),
  );
  chart.zoomOutButton.set('forceHidden', true);
  return chart;
}

export function createValueAxis(root: am5.Root, chart: am5xy.XYChart, unit: Unit | undefined, options: { min?: number } = {}) {
  const renderer = am5xy.AxisRendererY.new(root, { minGridDistance: 28 });
  const axis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      min: options.min,
      extraMax: 0.08,
      strictMinMax: false,
      renderer,
    }),
  );
  renderer.labels.template.adapters.add('text', (text, target) => {
    const value = (target.dataItem as am5.DataItem<am5xy.IValueAxisDataItem> | undefined)?.get('value');
    return typeof value === 'number' ? formatUnit(value, unit ?? 'count', { compact: true }) : text;
  });
  return axis;
}

/** The crosshair that finds the X. Tooltips are one readout per X, every series listed. */
export function addCursor(root: am5.Root, chart: am5xy.XYChart, xAxis: am5xy.Axis<am5xy.AxisRenderer>) {
  const cursor = chart.set('cursor', am5xy.XYCursor.new(root, { xAxis, behavior: 'none' }));
  cursor.lineY.set('visible', false);
  return cursor;
}

/**
 * Attaches a single tooltip to the chart that lists every visible series at the
 * hovered x. Values lead in the text token, labels follow; a line key in the
 * series color carries identity.
 */
export function addSharedTooltip(
  root: am5.Root,
  _chart: am5xy.XYChart,
  xAxis: am5xy.Axis<am5xy.AxisRenderer>,
  series: { id: string; label: string; unit?: Unit; color: string; item: am5xy.XYSeries }[],
  formatX: (x: number | string) => string,
  values: ThemeValues,
) {
  const tooltip = am5.Tooltip.new(root, {
    pointerOrientation: 'horizontal',
    labelText: '',
  });
  tooltip.label.setAll({ fill: am5.color(values.text) });
  xAxis.set('tooltip', tooltip);
  xAxis.get('tooltip')?.label.adapters.add('text', (text) => {
    const first = series.find((entry) => entry.item.get('visible') !== false);
    const dataItem = first?.item.get('tooltipDataItem');
    if (!dataItem) return text;
    const x = dataItem.get('valueX' as never) ?? dataItem.get('categoryX' as never);
    const head = `[${values.textSecondary}]${formatX(x as number | string)}[/]`;
    const lines = series
      .filter((entry) => entry.item.get('visible') !== false && !entry.item.isHidden())
      .map((entry) => {
        const item = entry.item.get('tooltipDataItem');
        const value = item?.get('valueY' as never) as number | undefined;
        const printed = typeof value === 'number' ? formatUnit(value, entry.unit ?? 'count') : '—';
        return `[${entry.color}]━[/] [${values.text}]${printed}[/] [${values.textSecondary}]${entry.label}[/]`;
      });
    return [head, ...lines].join('\n');
  });
  return tooltip;
}

export function seriesColorFor(series: ChartSeries, colors: Record<string, string>) {
  return colors[series.id];
}
