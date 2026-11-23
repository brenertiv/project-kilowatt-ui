import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { WaterfallChart } from 'src/charts/WaterfallChart';
import { costBridge, savingsBridge } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const august = costBridge[0].value ?? 0;
const september = costBridge.reduce((sum, { value, total }) => (total ? sum : sum + (value ?? 0)), august);
const identified = savingsBridge[0].value ?? 0;
const realised = savingsBridge.reduce((sum, { value, total }) => (total ? sum : sum + (value ?? 0)), identified);

/**
 * Kilowatt's reference waterfall chart: amCharts 5 through `useChart`, its changes colored by which way is worse.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Waterfall',
  component: WaterfallChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof WaterfallChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A cost bridge: last month's utility cost, what moved it (rate, weather, consumption, properties added and sold), and this month's. Increases are worse, so they take `error`. */
export const CostBridge: Story = {
  name: 'Cost bridge',
  parameters: { card: { title: 'What Changed Utility Cost' } },
  args: {
    steps: costBridge,
    unit: 'USD',
    worse: 'increase',
    summary: `Utility cost rose from ${usd.format(august)} in August to ${usd.format(september)} in September 2026, mostly from properties added and a higher rate, offset by milder weather and properties sold.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /Utility cost rose/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** Savings from identified to realised, with subtotals between: each drop is savings lost, so decreases are worse and take `error`. */
export const SavingsStages: Story = {
  name: 'Savings by stage',
  parameters: { card: { title: 'Savings From Identified to Realised' } },
  args: {
    steps: savingsBridge,
    unit: 'USD',
    worse: 'decrease',
    summary: `Of ${usd.format(identified)} in annual savings identified, ${usd.format(realised)} is realised; the largest drop is the ${usd.format(310_000)} dismissed.`,
  },
};
