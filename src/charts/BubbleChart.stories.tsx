import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { BubbleChart } from 'src/charts/BubbleChart';
import { opportunities } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const x = { field: 'cost', name: 'Upfront cost', unit: 'USD' };
const y = { field: 'savings', name: 'Annual savings', unit: 'USD' };
const size = { field: 'avoided', name: 'Avoided emissions', unit: 'tCO₂e/yr' };
const kinds = [{ value: 'Controls' }, { value: 'Lighting' }, { value: 'Equipment' }, { value: 'Electrification' }];
const biggest = [...opportunities].sort((a, b) => b.avoided - a.avoided)[0];

/**
 * Kilowatt's reference bubble chart: amCharts 5 through `useChart`, each bubble's area its amount.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Bubble',
  component: BubbleChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof BubbleChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each opportunity's upfront cost against its annual savings, sized by the emissions it avoids, all in one color. */
export const CostAndSavings: Story = {
  name: 'Cost against savings',
  parameters: { card: { title: 'Opportunities by Cost and Savings' } },
  args: {
    data: opportunities,
    labelField: 'opportunity',
    x,
    y,
    size,
    summary: `The cheapest opportunities save the most for what they cost; ${biggest.opportunity.toLowerCase()} avoids the most emissions, ${biggest.avoided} tCO₂e a year, at the highest cost.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /avoids the most emissions/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText(/Bubble area/)).toBeVisible();
  },
};

/** The same, colored by the kind of measure, with a legend. */
export const ByKind: Story = {
  name: 'Grouped by kind',
  parameters: { card: { title: 'Opportunities by Cost and Savings' } },
  args: { ...CostAndSavings.args, groupField: 'kind', groups: kinds },
};
