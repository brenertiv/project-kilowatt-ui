import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import { formatPercent, formatUnit, type Unit } from '../lib/format';
import { useChartFrame } from './ChartFrame';
import type { ChartData } from './types';
import { motionDuration, useChartRoot } from './useChartRoot';

export type DonutChartProps = {
  /** One series per slice, each with one point: the slice value is the first point's y. The same object goes to `ChartFrame`. */
  data: ChartData;
  /** Formats slice values in tooltips and the default center total. Defaults to `'count'`. */
  unit?: Unit;
  /** Hero figure in the hole, as preformatted text. Defaults to the compact total of the visible slices, so it follows the legend. */
  centerValue?: string;
  /** Caption under the center figure, e.g. "Annual total". Omit it and only the figure shows. */
  centerLabel?: string;
  /** Accessible name for the plot, e.g. "Energy mix". Required: the plot is an image to assistive tech. */
  ariaLabel: string;
};

/**
 * Part-to-whole at a glance. Six slices at most; past that, fold into "Other" or use
 * `CategoryBarChart`, which also suits comparing parts precisely. Slices keep a 2px surface gap and
 * never pull out on hover. Render it inside `<ChartFrame>` (it throws otherwise); colors come from
 * series ids via the token palette, so never pass colors.
 *
 * @summary Donut chart for part-to-whole, with a total in the hole, inside ChartFrame.
 * @import import { DonutChart } from 'src/charts/DonutChart';
 */
export function DonutChart({ data, unit = 'count', centerValue, centerLabel, ariaLabel }: DonutChartProps) {
  const { hidden, colors } = useChartFrame();
  const sliceRef = useRef(new Map<string, am5.DataItem<am5percent.IPieSeriesDataItem>>());
  const centerRef = useRef<am5.Label | null>(null);
  const durationRef = useRef<number | undefined>(undefined);

  const slices = data.series.map((series) => ({
    id: series.id,
    category: series.label,
    value: series.points[0]?.y ?? 0,
  }));
  // Slices hidden from the legend drop out of the total and the percentages, as they do from the ring.
  const total = slices.reduce((sum, slice) => (hidden.has(slice.id) ? sum : sum + slice.value), 0);
  const totalRef = useRef(total);
  useEffect(() => {
    totalRef.current = total;
  });

  const hostRef = useChartRoot(
    ({ root, values, reduceMotion }) => {
      durationRef.current = motionDuration(reduceMotion);
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
        const shown = totalRef.current;
        return `[${values.textPrimary}]${formatUnit(value, unit)}[/] [${values.textSecondary}]${category} · ${formatPercent(shown ? value / shown : 0)}[/]`;
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
      centerRef.current = center.children.push(
        am5.Label.new(root, {
          text: centerValue ?? formatUnit(total, unit, { compact: true }),
          fontSize: 22,
          fontWeight: '500',
          fill: am5.color(values.textPrimary),
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
        centerRef.current = null;
      };
    },
    [data, unit, centerValue, centerLabel, colors],
  );

  useEffect(() => {
    for (const [id, item] of sliceRef.current) {
      if (hidden.has(id)) item.hide(durationRef.current);
      else item.show(durationRef.current);
    }
    if (centerValue === undefined) centerRef.current?.set('text', formatUnit(total, unit, { compact: true }));
  }, [hidden, total, unit, centerValue]);

  return <div ref={hostRef} className="chart-host chart-plot" role="img" aria-label={ariaLabel} />;
}
