import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import { formatPercent, formatUnit, type Unit } from '../lib/format';
import { useChartFrame } from './ChartFrame';
import type { ChartData } from './types';
import { useChartRoot } from './useChartRoot';

type DonutChartProps = {
  /** One point per series: the slice value is the first point's y. */
  data: ChartData;
  unit?: Unit;
  /** Hero figure in the hole. Defaults to the total. */
  centerValue?: string;
  centerLabel?: string;
  ariaLabel: string;
};

/**
 * Part-to-whole at a glance. Six slices at most; past that, fold into "Other"
 * or use a bar. Slices keep a 2px surface gap and never pull out on hover.
 */
export function DonutChart({ data, unit = 'count', centerValue, centerLabel, ariaLabel }: DonutChartProps) {
  const { hidden, colors } = useChartFrame();
  const sliceRef = useRef(new Map<string, am5.DataItem<am5percent.IPieSeriesDataItem>>());

  const slices = data.series.map((series) => ({
    id: series.id,
    category: series.label,
    value: series.points[0]?.y ?? 0,
  }));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  const hostRef = useChartRoot(
    ({ root, values }) => {
      const chart = root.container.children.push(
        am5percent.PieChart.new(root, {
          innerRadius: am5.percent(70),
          radius: am5.percent(96),
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 4,
          paddingRight: 4,
        }),
      );
      const series = chart.series.push(
        am5percent.PieSeries.new(root, {
          valueField: 'value',
          categoryField: 'category',
          alignLabels: false,
        }),
      );
      series.labels.template.set('forceHidden', true);
      series.ticks.template.set('forceHidden', true);
      series.slices.template.setAll({ toggleKey: 'none', cornerRadius: 3 });
      series.slices.template.states.create('hover', { scale: 1, shiftRadius: 0 });
      series.slices.template.states.create('active', { shiftRadius: 0 });
      series.slices.template.adapters.add('fill', (fill, target) => {
        const context = target.dataItem?.dataContext as { id?: string } | undefined;
        return context?.id && colors[context.id] ? am5.color(colors[context.id]) : fill;
      });
      series.slices.template.set(
        'tooltip',
        am5.Tooltip.new(root, { labelText: '' }),
      );
      series.slices.template.get('tooltip')?.label.adapters.add('text', (_text, target) => {
        const item = target.dataItem as am5.DataItem<am5percent.IPieSeriesDataItem> | undefined;
        const value = item?.get('value') ?? 0;
        const category = item?.get('category') ?? '';
        return `[${values.text}]${formatUnit(value, unit)}[/] [${values.textSecondary}]${category} · ${formatPercent(total ? value / total : 0)}[/]`;
      });

      series.data.setAll(slices);
      series.dataItems.forEach((item) => {
        const id = (item.dataContext as { id: string }).id;
        sliceRef.current.set(id, item);
        if (hidden.has(id)) item.hide(0);
      });

      const center = chart.seriesContainer.children.push(
        am5.Container.new(root, { centerX: am5.p50, centerY: am5.p50, layout: root.verticalLayout }),
      );
      center.children.push(
        am5.Label.new(root, {
          text: centerValue ?? formatUnit(total, unit, { compact: true }),
          fontSize: 22,
          fontWeight: '500',
          fill: am5.color(values.text),
          centerX: am5.p50,
          textAlign: 'center',
        }),
      );
      if (centerLabel) {
        center.children.push(
          am5.Label.new(root, {
            text: centerLabel,
            fill: am5.color(values.textSecondary),
            centerX: am5.p50,
            textAlign: 'center',
          }),
        );
      }

      return () => {
        sliceRef.current.clear();
      };
    },
    [data, unit, centerValue, centerLabel, colors],
  );

  useEffect(() => {
    for (const [id, item] of sliceRef.current) {
      if (hidden.has(id)) item.hide();
      else item.show();
    }
  }, [hidden]);

  return <div ref={hostRef} className="chart-host chart-plot" role="img" aria-label={ariaLabel} />;
}
