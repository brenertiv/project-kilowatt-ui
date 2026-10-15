import type { Meta, StoryObj } from '@storybook/react-vite';
import { demand } from 'src/fixtures/sampleData';
import { ChartFrame } from 'src/charts/ChartFrame';
import { TimeSeriesChart } from 'src/charts/TimeSeriesChart';

const meta = {
  title: 'Charts/TimeSeries',
  component: TimeSeriesChart,
  // The attached .mdx page replaces the generated docs page.
  tags: ['!autodocs'],
  args: {
    data: demand.pair,
    interval: 'hour',
    unit: 'kW',
    area: true,
    zeroBased: true,
    ariaLabel: 'Demand by hour',
  },
  argTypes: {
    data: { control: 'object' },
    interval: { control: 'select', options: ['minute', 'hour', 'day', 'week', 'month'] },
    unit: { control: 'select', options: ['kW', 'kWh', 'MWh', 'therms', 'gal', 'USD', 'percent', 'count', '°F', 'score'] },
    annotations: { control: 'object' },
  },
  render: (args) => (
    <ChartFrame title="Demand" subtitle="Hourly kW" data={args.data} legendShape="line" xKind="date" height={260}>
      <TimeSeriesChart {...args} />
    </ChartFrame>
  ),
} satisfies Meta<typeof TimeSeriesChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One series: no legend, the frame title names it. */
export const SingleSeries: Story = {
  args: { data: demand.single },
};

/** A series against a `role: 'comparison'` baseline, drawn in the neutral track color. */
export const TwoSeries: Story = {};

/** Several peer series, each with its own palette color and a toggleable legend entry. */
export const FourSeries: Story = {
  args: { data: demand.four, area: false, ariaLabel: 'Demand by system' },
};

/** Missing samples (`y: null`) break the line instead of interpolating across the gap. */
export const WithGaps: Story = {
  args: { data: demand.gaps },
};

/** Every sample is null: the frame shows its empty message instead of the plot. */
export const Empty: Story = {
  args: { data: demand.empty },
};

/** Lines only, with no wash: use `area={false}` when areas would overlap and muddy each other. */
export const LineOnly: Story = {
  args: { area: false },
};

/** A cropped value axis: `zeroBased={false}` only when the variation, not the magnitude, is the story. */
export const NotZeroBased: Story = {
  args: { data: demand.single, area: false, zeroBased: false },
};

/** A labelled point on one series, to call out an event such as the daily peak. */
export const WithAnnotation: Story = {
  args: {
    data: demand.single,
    annotations: [{ x: demand.single.series[0].points[14].x, seriesId: 'today', label: 'Peak' }],
  },
};
