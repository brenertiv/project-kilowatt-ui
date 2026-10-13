import { useEffect, useMemo, useRef, useState } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy';
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5xy from '@amcharts/amcharts5/xy';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { CategoryBarChart } from '../charts/CategoryBarChart';
import { ChartFrame, useChartFrame } from '../charts/ChartFrame';
import { DonutChart } from '../charts/DonutChart';
import { HeatScale, HeatmapChart } from '../charts/HeatmapChart';
import { TimeSeriesChart } from '../charts/TimeSeriesChart';
import { useChartRoot } from '../charts/useChartRoot';
import type { ChartData } from '../charts/types';
import { demandDay, energyBreakdown, energyMix, loadProfile, systemScores } from '../data';
import { formatKilowatts, formatUnit } from '../lib/format';
import type { Demo } from './demos';

const peak = demandDay.reduce((best, sample) => (sample.today > best.today ? sample : best));

const demandData: ChartData = {
  xLabel: 'Hour',
  series: [
    {
      id: 'today',
      label: 'Today',
      unit: 'kW',
      points: demandDay.map((sample) => ({ x: sample.time, y: sample.today })),
    },
    {
      id: 'baseline',
      label: 'Same day last week',
      unit: 'kW',
      role: 'comparison',
      points: demandDay.map((sample) => ({ x: sample.time, y: sample.baseline })),
    },
  ],
};

function DemandTrendDemo() {
  return (
    <ChartFrame
      title="Demand"
      subtitle="Hourly kW, 120 Broadway"
      data={demandData}
      legendShape="line"
      xKind="date"
    >
      <TimeSeriesChart
        data={demandData}
        interval="hour"
        unit="kW"
        area
        annotations={[{ x: peak.time, seriesId: 'today', label: formatKilowatts(peak.today) }]}
        ariaLabel={`Demand today against last week, peaking at ${formatKilowatts(peak.today)}`}
      />
    </ChartFrame>
  );
}

const systems = ['HVAC', 'Lighting', 'Plug load', 'Elevators'];
const energyBySystem: ChartData = {
  xLabel: 'Building',
  series: systems.map((system) => ({
    id: system.toLowerCase().replace(/\s+/g, '-'),
    label: system,
    unit: 'MWh',
    points: (energyBreakdown.children ?? []).map((building) => ({
      x: building.name,
      y: building.children?.find((child) => child.name === system)?.value ?? null,
    })),
  })),
};

function EnergyBySystemDemo() {
  return (
    <ChartFrame title="Energy by system" subtitle="Annual MWh per building" data={energyBySystem}>
      <CategoryBarChart
        data={energyBySystem}
        unit="MWh"
        stacked
        horizontal
        ariaLabel="Annual energy by building, stacked by HVAC, lighting, plug load and elevators"
      />
    </ChartFrame>
  );
}

const energyMixData: ChartData = {
  xLabel: 'System',
  series: energyMix.map((slice) => ({
    id: slice.system.toLowerCase().replace(/\s+/g, '-'),
    label: slice.system,
    unit: 'MWh',
    points: [{ x: 'Annual', y: slice.mwh }],
  })),
};

function EnergyMixDemo() {
  const total = energyMix.reduce((sum, slice) => sum + slice.mwh, 0);
  return (
    <ChartFrame title="Energy mix" subtitle="Share of annual MWh by end use" data={energyMixData}>
      <DonutChart
        data={energyMixData}
        unit="MWh"
        centerLabel="Annual total"
        ariaLabel={`Energy mix across ${energyMix.length} end uses totalling ${formatUnit(total, 'MWh')}`}
      />
    </ChartFrame>
  );
}

const loadProfileData: ChartData = {
  xLabel: 'Day',
  series: loadProfile.map((row) => ({
    id: row.day.toLowerCase(),
    label: row.day,
    unit: 'kW',
    points: row.hours.map((value, hour) => ({ x: `${hour}`, y: value })),
  })),
};
const loadValues = loadProfile.flatMap((row) => row.hours);
const loadMin = Math.min(...loadValues);
const loadMax = Math.max(...loadValues);

function LoadProfileDemo() {
  return (
    <ChartFrame
      title="Load profile"
      subtitle="Average kW by weekday and hour"
      data={loadProfileData}
      legend={false}
      scale={<HeatScale min={loadMin} max={loadMax} unit="kW" />}
    >
      <HeatmapChart
        data={loadProfileData}
        unit="kW"
        ariaLabel={`Load profile heatmap, ${formatKilowatts(loadMin)} to ${formatKilowatts(loadMax)}, weekday afternoons highest`}
      />
    </ChartFrame>
  );
}

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

function RadarChartDemo() {
  return (
    <ChartFrame title="System performance" subtitle="Score out of 100" data={radarData} legendShape="line">
      <RadarPlot />
    </ChartFrame>
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

type FrameState = 'ready' | 'loading' | 'fetching' | 'empty' | 'error';

function ChartStatesDemo() {
  const [state, setState] = useState<FrameState>('ready');
  const data = useMemo<ChartData>(
    () =>
      state === 'empty'
        ? { ...demandData, series: demandData.series.map((s) => ({ ...s, points: s.points.map((p) => ({ ...p, y: null })) })) }
        : demandData,
    [state],
  );
  const toolbar = (
    <ToggleGroup
      value={[state]}
      onValueChange={(next) => next[0] && setState(next[0] as FrameState)}
      className="ui-toggle-group"
      aria-label="Frame state"
    >
      {(['ready', 'loading', 'fetching', 'empty', 'error'] as FrameState[]).map((value) => (
        <Toggle key={value} value={value} className="ui-toggle chart-state-toggle">
          {value}
        </Toggle>
      ))}
    </ToggleGroup>
  );
  return (
    <ChartFrame
      title="Frame states"
      subtitle="Loading, fetching, empty and error share one frame height"
      data={data}
      legendShape="line"
      xKind="date"
      toolbar={toolbar}
      loading={state === 'loading'}
      fetching={state === 'fetching'}
      error={state === 'error' ? 'Interval data is unavailable for this meter.' : null}
      onRetry={() => setState('ready')}
    >
      <TimeSeriesChart data={data} interval="hour" unit="kW" ariaLabel="Demand today against last week" />
    </ChartFrame>
  );
}

export const chartDemos: Demo[] = [
  { id: 'line-chart', title: 'Time series', group: 'Data', render: DemandTrendDemo, fixture: { path: 'src/charts/ChartFrame.fixture.tsx', name: 'Time series' } },
  { id: 'stacked-bars', title: 'Stacked bars', group: 'Data', render: EnergyBySystemDemo, fixture: { path: 'src/charts/ChartFrame.fixture.tsx', name: 'Bars' } },
  { id: 'donut', title: 'Donut', group: 'Data', render: EnergyMixDemo, fixture: { path: 'src/charts/ChartFrame.fixture.tsx', name: 'Donut' } },
  { id: 'heatmap', title: 'Heatmap', group: 'Data', render: LoadProfileDemo, fixture: { path: 'src/charts/ChartFrame.fixture.tsx', name: 'Heatmap' } },
  { id: 'radar-chart', title: 'Radar', group: 'Data', render: RadarChartDemo, fixture: { path: 'src/charts/ChartFrame.fixture.tsx', name: 'Radar' } },
  { id: 'treemap', title: 'Energy drill-down treemap', group: 'Data', render: TreemapDemo, fixture: { path: 'src/gallery/Treemap.fixture.tsx', name: null } },
  { id: 'chart-states', title: 'Chart states', group: 'Data', render: ChartStatesDemo, fixture: { path: 'src/charts/ChartFrame.fixture.tsx', name: 'Time series' } },
];
