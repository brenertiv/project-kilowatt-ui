import { energyMix, loadProfile } from '../data';
import { radarData, RadarPlot } from '../fixtures/chartDemos';
import { CategoryBarChart } from './CategoryBarChart';
import { ChartFrame } from './ChartFrame';
import { DonutChart } from './DonutChart';
import { HeatScale, HeatmapChart } from './HeatmapChart';
import { TimeSeriesChart } from './TimeSeriesChart';
import type { ChartData } from './types';
import { categories, demand } from '../fixtures/sampleData';
import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';

const frameStates = ['ready', 'loading', 'fetching', 'error'] as const;

function TimeSeries() {
  const [dataSet] = useFixtureSelect('data', { options: [...(['single', 'pair', 'four', 'gaps', 'empty'] as const)], defaultValue: 'pair' });
  const [state] = useFixtureSelect('state', { options: [...frameStates] });
  const [area] = useFixtureInput('area', true);
  const [zeroBased] = useFixtureInput('zero based', true);
  const [height] = useFixtureInput('height', 260);
  const data = demand[dataSet];
  return (
    <ChartFrame
      title="Demand"
      subtitle="Hourly kW"
      data={data}
      legendShape="line"
      xKind="date"
      height={height}
      loading={state === 'loading'}
      fetching={state === 'fetching'}
      error={state === 'error' ? 'Interval data is unavailable.' : null}
      onRetry={() => undefined}
    >
      <TimeSeriesChart data={data} interval="hour" unit="kW" area={area} zeroBased={zeroBased} ariaLabel="Demand by hour" />
    </ChartFrame>
  );
}

function Bars() {
  const [stacked] = useFixtureInput('stacked', true);
  const [horizontal] = useFixtureInput('horizontal', false);
  const [state] = useFixtureSelect('state', { options: [...frameStates] });
  return (
    <ChartFrame
      title="Energy by system"
      subtitle="Annual MWh"
      data={categories}
      height={260}
      loading={state === 'loading'}
      fetching={state === 'fetching'}
      error={state === 'error' ? 'Could not load energy totals.' : null}
    >
      <CategoryBarChart data={categories} unit="MWh" stacked={stacked} horizontal={horizontal} ariaLabel="Energy by system" />
    </ChartFrame>
  );
}

function Donut() {
  const [slices] = useFixtureInput('slice count', energyMix.length);
  const [centerLabel] = useFixtureInput('center label', 'Annual total');
  const data: ChartData = {
    xLabel: 'System',
    series: energyMix.slice(0, Math.max(1, Math.min(energyMix.length, slices))).map((slice) => ({
      id: slice.system.toLowerCase().replace(/\s+/g, '-'),
      label: slice.system,
      unit: 'MWh',
      points: [{ x: 'Annual', y: slice.mwh }],
    })),
  };
  return (
    <ChartFrame title="Energy mix" subtitle="Share of annual MWh" data={data} height={280}>
      <DonutChart data={data} unit="MWh" centerLabel={centerLabel} ariaLabel="Energy mix" />
    </ChartFrame>
  );
}

function Heatmap() {
  const [steps] = useFixtureInput('ramp steps', 7);
  const [cellLabels] = useFixtureInput('cell labels', false);
  const [days] = useFixtureInput('day count', 7);
  const rows = loadProfile.slice(0, Math.max(1, Math.min(7, days)));
  const data: ChartData = {
    xLabel: 'Day',
    series: rows.map((row) => ({
      id: row.day.toLowerCase(),
      label: row.day,
      unit: 'kW',
      points: row.hours.map((value, hour) => ({ x: `${hour}`, y: value })),
    })),
  };
  const values = rows.flatMap((row) => row.hours);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const clampedSteps = Math.max(3, Math.min(9, steps));
  return (
    <ChartFrame
      title="Load profile"
      subtitle="Average kW by weekday and hour"
      data={data}
      height={280}
      legend={false}
      scale={<HeatScale min={min} max={max} unit="kW" steps={clampedSteps} />}
    >
      <HeatmapChart data={data} unit="kW" steps={clampedSteps} cellLabels={cellLabels} ariaLabel="Load profile heatmap" />
    </ChartFrame>
  );
}

function Radar() {
  return (
    <ChartFrame title="System performance" subtitle="Score out of 100" data={radarData} legendShape="line" height={300}>
      <RadarPlot />
    </ChartFrame>
  );
}

export default {
  'Time series': TimeSeries,
  Bars,
  Donut,
  Heatmap,
  Radar,
};
