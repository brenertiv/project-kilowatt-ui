import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { MekkoChart } from 'src/charts/MekkoChart';
import { fundMix } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const types = [
  { field: 'office', name: 'Office' },
  { field: 'multifamily', name: 'Multifamily' },
  { field: 'retail', name: 'Retail' },
  { field: 'industrial', name: 'Industrial' },
];
const compact = new Intl.NumberFormat('en-US', { notation: 'compact' });
const total = fundMix.reduce((sum, { area }) => sum + area, 0);

/**
 * Kilowatt's reference Mekko chart: amCharts 5 through `useChart`, each column as wide as its size.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Mekko',
  component: MekkoChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof MekkoChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One column per fund, as wide as its floor area, stacked by the share of each property type. */
export const FundsByType: Story = {
  name: 'Funds by property type',
  parameters: { card: { title: 'Floor Area by Fund and Type' } },
  args: {
    data: fundMix,
    categoryField: 'fund',
    widthField: 'area',
    widthUnit: 'sq ft',
    parts: types,
    summary: `Core Fund I holds ${compact.format(fundMix[0].area)} of the portfolio's ${compact.format(total)} square feet, ${fundMix[0].office}% of it office; Industrial Fund III is ${fundMix[2].industrial}% industrial.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /Core Fund I holds/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};
