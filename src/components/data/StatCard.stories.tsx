import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingIcon } from '../../icons';
import { StatCard } from './StatCard';

const meta = {
  title: 'Data/StatCard',
  component: StatCard,
  decorators: [
    (Story) => (
      // A plain div, not Box: story imports end up in the snippet agents copy.
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Consumption, last 30 days',
    value: 12853,
    unit: 'kWh',
    delta: -0.042,
    goodDirection: 'down',
    period: 'vs previous 30 days',
  },
  argTypes: {
    unit: { control: 'select', options: ['kWh', 'kW', 'MWh', 'USD', 'percent', 'count', 'score'] },
    goodDirection: { control: 'inline-radio', options: ['down', 'up', 'none'] },
    icon: { control: false },
    state: { control: 'object' },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The usual card: a value, its change, and the period. Energy going down is good, so the drop shows green. */
export const Default: Story = {};

/** With a leading icon naming the subject. */
export const WithIcon: Story = {
  args: { icon: <BuildingIcon /> },
};

/** A rise in a metric where up is bad (peak demand) shows red. Set `goodDirection` per metric. */
export const BadChange: Story = {
  args: { label: 'Peak demand', value: 418.6, unit: 'kW', delta: 0.071, goodDirection: 'down' },
};

/** Money with `compact`, for large totals in a tight grid. */
export const CompactCurrency: Story = {
  args: { label: 'Utility spend', value: 88200.87, unit: 'USD', compact: true, delta: 0.012, period: 'this quarter' },
};

/** A count with an absolute change: set `deltaUnit` to match when the delta is not a fraction. */
export const CountDelta: Story = {
  args: { label: 'Open work orders', value: 17, unit: 'count', delta: -3, deltaUnit: 'count', period: 'since Monday' },
};

/** No reading yet: `value` is null, so the card shows the no-value dash and hides the delta. */
export const NoValue: Story = {
  args: { label: 'Consumption', value: null, delta: undefined, period: 'awaiting first bill' },
};

/** First load: pass `state={{ status: 'loading' }}` and the card shows a skeleton. */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
};

/** Data on screen while newer data loads: the value dims and the card is marked busy. */
export const Refreshing: Story = {
  args: { state: { status: 'fetching' } },
};

/** The request failed: the card shows the message and a retry button wired to `state.onRetry`. */
export const Failed: Story = {
  args: { value: null, state: { status: 'error', error: 'Readings unavailable.', onRetry: () => undefined } },
};
