import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ParetoChart } from 'src/charts/ParetoChart';
import { opportunities } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const total = opportunities.reduce((sum, { savings }) => sum + savings, 0);
const sorted = [...opportunities].sort((a, b) => b.savings - a.savings);
const few = sorted.findIndex((_, i) => sorted.slice(0, i + 1).reduce((sum, { savings }) => sum + savings, 0) >= total * 0.8) + 1;

/**
 * Kilowatt's reference Pareto chart: amCharts 5 through `useChart`, amounts largest first with their cumulative share.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Pareto',
  component: ParetoChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof ParetoChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Annual savings per opportunity, largest first, with the cumulative share of the total and the 80% threshold. */
export const Opportunities: Story = {
  name: 'Savings by opportunity',
  parameters: { card: { title: 'Annual Savings by Opportunity' } },
  args: {
    data: opportunities,
    categoryField: 'opportunity',
    valueField: 'savings',
    name: 'Annual savings',
    unit: 'USD',
    summary: `${few} of ${opportunities.length} opportunities make up 80% of the annual savings on offer.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /make up 80%/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** The same, with no threshold line: the cumulative share alone. */
export const NoThreshold: Story = {
  name: 'Without a threshold',
  parameters: { card: { title: 'Annual Savings by Opportunity' } },
  args: { ...Opportunities.args, threshold: null },
};
