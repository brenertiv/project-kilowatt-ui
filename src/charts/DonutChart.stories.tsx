import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { DonutChart } from 'src/charts/DonutChart';
import { buildingTotals, utilityCost } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const share = (rows: { value: number }[], value: number) => percent.format(value / rows.reduce((sum, row) => sum + row.value, 0));

const buildingShares = buildingTotals.map(({ building, use }) => ({ category: building, value: use }));
const largestBuilding = buildingShares.reduce((max, row) => (row.value > max.value ? row : max));
const electricity = utilityCost[0];

/**
 * Kilowatt's reference donut chart: amCharts 5 through `useChart`, colored from the palette.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Donut',
  component: DonutChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Up to six parts of one whole, largest first, each labeled with its share. */
export const Parts: Story = {
  parameters: { card: { title: 'Energy Use by Building' } },
  args: {
    data: buildingShares,
    unit: 'kWh',
    summary: `${largestBuilding.category} used ${share(buildingShares, largestBuilding.value)} of the portfolio's energy.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /of the portfolio's energy/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** More than six parts: the five largest keep their slices, and the rest are grouped into a neutral "Other". */
export const GroupedIntoOther: Story = {
  name: 'Grouped into Other',
  parameters: { card: { title: 'Utility Cost' } },
  args: {
    data: utilityCost,
    unit: 'USD',
    summary: `Electricity was ${share(utilityCost, electricity.value)} of the building's utility cost; sanitation and fuel oil are grouped as Other.`,
  },
};
