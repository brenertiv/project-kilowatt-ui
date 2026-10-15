import type { Meta, StoryObj } from '@storybook/react-vite';
import { categories } from '../fixtures/sampleData';
import { CategoryBarChart } from './CategoryBarChart';
import { ChartFrame } from './ChartFrame';

const meta = {
  title: 'Charts/CategoryBar',
  component: CategoryBarChart,
  args: {
    data: categories,
    unit: 'MWh',
    stacked: true,
    horizontal: false,
    ariaLabel: 'Energy by system',
  },
  argTypes: {
    data: { control: 'object' },
    unit: { control: 'select', options: ['kW', 'kWh', 'MWh', 'therms', 'gal', 'USD', 'percent', 'count', '°F', 'score'] },
    highlight: { control: 'select', options: [undefined, '1 WTC', '120 Broadway', '200 Vesey'] },
  },
  render: (args) => (
    <ChartFrame title="Energy by system" subtitle="Annual MWh" data={args.data} height={260}>
      <CategoryBarChart {...args} />
    </ChartFrame>
  ),
} satisfies Meta<typeof CategoryBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Series stacked on one bar per category: use when the total matters as much as the parts. */
export const Stacked: Story = {};

/** Series side by side: use to compare one series across categories. */
export const Grouped: Story = {
  args: { stacked: false },
};

/** Horizontal bars, for long category names that would not fit under a column. */
export const Horizontal: Story = {
  args: { horizontal: true },
};

/** One category drawn in the accent to carry the story while the rest recede. Single-series data only. */
export const Highlighted: Story = {
  args: { data: { ...categories, series: categories.series.slice(0, 1) }, highlight: '120 Broadway' },
};

/** Values printed at the bar tips: only for a single short series. */
export const ValueLabels: Story = {
  args: { data: { ...categories, series: categories.series.slice(0, 1) }, valueLabels: true },
};
