import type { Meta, StoryObj } from '@storybook/react-vite';
import { energyMix } from '../data';
import type { ChartData } from './types';
import { ChartFrame } from './ChartFrame';
import { DonutChart } from './DonutChart';

/** One series per slice, each holding a single point: the shape `DonutChart` expects. */
function mix(count: number): ChartData {
  return {
    xLabel: 'System',
    series: energyMix.slice(0, count).map((slice) => ({
      id: slice.system.toLowerCase().replace(/\s+/g, '-'),
      label: slice.system,
      unit: 'MWh',
      points: [{ x: 'Annual', y: slice.mwh }],
    })),
  };
}

const meta = {
  title: 'Charts/Donut',
  component: DonutChart,
  args: {
    data: mix(energyMix.length),
    unit: 'MWh',
    centerLabel: 'Annual total',
    ariaLabel: 'Energy mix',
  },
  argTypes: {
    data: { control: 'object' },
    unit: { control: 'select', options: ['kW', 'kWh', 'MWh', 'therms', 'gal', 'USD', 'percent', 'count', '°F', 'score'] },
  },
  render: (args) => (
    <ChartFrame title="Energy mix" subtitle="Share of annual MWh" data={args.data} height={280}>
      <DonutChart {...args} />
    </ChartFrame>
  ),
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Part-to-whole with every slice; the hole shows the total under `centerLabel`. */
export const Default: Story = {};

/** A two-way split, the simplest case a donut reads well for. */
export const TwoSlices: Story = {
  args: { data: mix(2) },
};

/** A custom hero figure in the hole via `centerValue`, instead of the computed total. */
export const CenterValue: Story = {
  args: { centerValue: '62%', centerLabel: 'HVAC share' },
};
