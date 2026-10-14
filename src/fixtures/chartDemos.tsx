import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy';
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5xy from '@amcharts/amcharts5/xy';
import { useChartFrame } from '../charts/ChartFrame';
import { useChartRoot } from '../charts/useChartRoot';
import type { ChartData } from '../charts/types';
import { energyBreakdown, systemScores } from '../data';

export const radarData: ChartData = {
  xLabel: 'System',
  series: [
    { id: 'building', label: '120 Broadway', unit: 'score', points: systemScores.map((s) => ({ x: s.system, y: s.building })) },
    {
      id: 'portfolio',
      label: 'Portfolio average',
      unit: 'score',
      role: 'comparison',
      points: systemScores.map((s) => ({ x: s.system, y: s.portfolio })),
    },
  ],
};

export function RadarPlot() {
  const { hidden, colors } = useChartFrame();
  const seriesRef = useRef(new Map<string, am5radar.RadarLineSeries>());

  const hostRef = useChartRoot(
    ({ root, values }) => {
      const chart = root.container.children.push(
        am5radar.RadarChart.new(root, {
          panX: false,
          panY: false,
          wheelX: 'none',
          wheelY: 'none',
          radius: am5.percent(82),
          paddingTop: 8,
          paddingBottom: 8,
        }),
      );
      chart.zoomOutButton.set('forceHidden', true);

      const xRenderer = am5radar.AxisRendererCircular.new(root, {});
      xRenderer.labels.template.setAll({ radius: 8, textType: 'adjusted' });
      const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: 'system', renderer: xRenderer }));
      const yRenderer = am5radar.AxisRendererRadial.new(root, { minGridDistance: 24 });
      yRenderer.labels.template.setAll({ fontSize: 10 });
      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, { min: 0, max: 100, strictMinMax: true, renderer: yRenderer }),
      );

      for (const series of [...radarData.series].reverse()) {
        const color = am5.color(colors[series.id]);
        const item = chart.series.push(
          am5radar.RadarLineSeries.new(root, {
            name: series.label,
            xAxis,
            yAxis,
            valueYField: series.id === 'building' ? 'building' : 'portfolio',
            categoryXField: 'system',
            stroke: color,
            fill: color,
            tooltip: am5.Tooltip.new(root, {
              labelText: `[${values.text}]{valueY}[/] [${values.textSecondary}]${series.label} · {categoryX}[/]`,
            }),
          }),
        );
        item.fills.template.setAll({ visible: true, fillOpacity: series.role === 'comparison' ? 0.35 : 0.1 });
        if (series.role !== 'comparison') {
          item.bullets.push((bulletRoot) =>
            am5.Bullet.new(bulletRoot, { sprite: am5.Circle.new(bulletRoot, { fill: color }) }),
          );
        }
        item.data.setAll(systemScores);
        seriesRef.current.set(series.id, item);
        if (hidden.has(series.id)) item.hide(0);
      }
      xAxis.data.setAll(systemScores);
      chart.set('cursor', am5radar.RadarCursor.new(root, { behavior: 'none' }));

      return () => seriesRef.current.clear();
    },
    [colors],
  );

  useEffect(() => {
    for (const [id, series] of seriesRef.current) {
      if (hidden.has(id)) series.hide();
      else series.show();
    }
  }, [hidden]);

  return (
    <div
      ref={hostRef}
      className="chart-host chart-plot"
      role="img"
      aria-label="System performance scores for 120 Broadway against the portfolio average"
    />
  );
}

const topConsumer = (energyBreakdown.children ?? [])[0]?.name;

// The largest tile among its siblings carries the accent at every drill level.
function isFocusNode(dataItem: am5.DataItem<am5hierarchy.ITreemapDataItem> | undefined) {
  const siblings = dataItem?.get('parent')?.get('children');
  if (!dataItem || !siblings) return false;
  const largest = Math.max(...siblings.map((sibling) => sibling.get('sum')));
  return dataItem.get('sum') === largest;
}

export function TreemapDemo() {
  const hostRef = useChartRoot(({ root, values, reduceMotion }) => {
    const container = root.container.children.push(
      am5.Container.new(root, { width: am5.p100, height: am5.p100, layout: root.verticalLayout }),
    );
    const series = am5hierarchy.Treemap.new(root, {
      singleBranchOnly: false,
      downDepth: 1,
      upDepth: 0,
      initialDepth: 1,
      valueField: 'value',
      categoryField: 'name',
      childDataField: 'children',
      nodePaddingOuter: 0,
      nodePaddingInner: 0,
      animationDuration: reduceMotion ? 0 : 400,
    });
    container.children.push(am5hierarchy.BreadcrumbBar.new(root, { series, paddingLeft: 0, paddingBottom: 8 }));
    container.children.push(series);

    series.nodes.template.set('tooltipText', `[${values.text}]{sum} MWh[/] [${values.textSecondary}]{category}[/]`);
    series.rectangles.template.adapters.add('fill', (_fill, target) =>
      am5.color(isFocusNode(target.dataItem as am5.DataItem<am5hierarchy.ITreemapDataItem>) ? values.accent : values.track),
    );
    series.labels.template.setAll({
      fontSize: 12,
      text: '{category}\n[fontSize: 11px]{sum} MWh[/]',
      textAlign: 'center',
    });
    series.labels.template.adapters.add('fill', (_fill, target) =>
      am5.color(isFocusNode(target.dataItem as am5.DataItem<am5hierarchy.ITreemapDataItem>) ? values.onAccent : values.text),
    );
    series.data.setAll([energyBreakdown]);
    series.set('selectedDataItem', series.dataItems[0]);
  });

  return (
    <div
      ref={hostRef}
      className="chart-host"
      role="img"
      aria-label={`Energy use by building, ${topConsumer} highlighted. Select a building to drill into its systems.`}
    />
  );
}

