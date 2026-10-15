import type { Meta, StoryObj } from '@storybook/react-vite';
import { loadProfile } from '../data';
import type { ChartData } from './types';
import { ChartFrame } from './ChartFrame';
import { HeatScale, HeatmapChart } from './HeatmapChart';

/** One row per weekday, one column per hour. */
function profile(days: number): ChartData {
  return {
    xLabel: 'Day',
    series: loadProfile.slice(0, days).map((row) => ({
      id: row.day.toLowerCase(),
      label: row.day,
      unit: 'kW',
      points: row.hours.map((value, hour) => ({ x: `${hour}`, y: value })),
    })),
  };
}

function range(data: ChartData) {
  const values = data.series.flatMap((series) => series.points.map((point) => point.y ?? 0));
  return { min: Math.min(...values), max: Math.max(...values) };
}

const meta = {
  title: 'Charts/Heatmap',
  component: HeatmapChart,
  subcomponents: { HeatScale },
  args: {
    data: profile(7),
    unit: 'kW',
    steps: 7,
    cellLabels: false,
    ariaLabel: 'Load profile heatmap',
  },
  argTypes: {
    data: { control: 'object' },
    unit: { control: 'select', options: ['kW', 'kWh', 'MWh', 'therms', 'gal', 'USD', 'percent', 'count', '°F', 'score'] },
    steps: { control: { type: 'range', min: 3, max: 9, step: 1 } },
  },
  render: (args) => (
    <ChartFrame
      title="Load profile"
      subtitle="Average kW by weekday and hour"
      data={args.data}
      height={280}
      legend={false}
      scale={<HeatScale {...range(args.data)} unit={args.unit} steps={args.steps} />}
    >
      <HeatmapChart {...args} />
    </ChartFrame>
  ),
} satisfies Meta<typeof HeatmapChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A week of hourly load: hide the frame legend and put `<HeatScale>` in its `scale` slot. */
export const Default: Story = {};

/** A coarser ramp: fewer steps make bands easier to tell apart. Pass the same `steps` to `HeatScale`. */
export const FewerSteps: Story = {
  args: { steps: 4 },
};

/** Values printed in the cells: only when cells are wide enough, here with fewer rows. */
export const CellLabels: Story = {
  args: { data: profile(3), cellLabels: true },
};

/** Weekdays only, to show the grid sizes to however many rows the data has. */
export const Weekdays: Story = {
  args: { data: profile(5) },
};
