import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ColumnChart } from 'src/charts/ColumnChart';
import { buildingTotals, monthlySupplyDelivery } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const kWh = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const most = buildingTotals.reduce((max, row) => (row.use > max.use ? row : max));
const least = buildingTotals.reduce((min, row) => (row.use < min.use ? row : min));
const peakMonth = monthlySupplyDelivery.reduce((max, row) => (row.supply + row.delivery > max.supply + max.delivery ? row : max));
const deliveryShare = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 }).format(
  monthlySupplyDelivery.reduce((sum, row) => sum + row.delivery, 0) /
    monthlySupplyDelivery.reduce((sum, row) => sum + row.supply + row.delivery, 0),
);

const totals = [{ field: 'use', name: 'Energy use' }];
const supplyDelivery = [
  { field: 'supply', name: 'Supply', slot: 0 },
  { field: 'delivery', name: 'Delivery', slot: 0, striped: true },
];

/**
 * Kilowatt's reference column chart: amCharts 5 through `useChart`, colored from the palette.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Column',
  component: ColumnChart,
  tags: ['!autodocs'],
  decorators: [inCard],
  args: { unit: 'kWh' },
} satisfies Meta<typeof ColumnChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One measure across categories: every column takes the first series color, since the categories are labeled on the axis. */
export const Categories: Story = {
  parameters: { card: { title: 'Energy Use by Building', subheader: 'September 2026 · kWh' } },
  args: {
    data: buildingTotals,
    categoryField: 'building',
    series: totals,
    summary: `${most.building} used the most, ${kWh.format(most.use)} kWh; ${least.building} the least, ${kWh.format(least.use)} kWh.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /used the most/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** Parts of a total, stacked: supply and delivery are variants of one meaning, so they share its slot and delivery is `striped`. */
export const StackedVariants: Story = {
  name: 'Stacked variants',
  parameters: { card: { title: 'Electricity Cost', subheader: '2026 by month · USD' } },
  args: {
    unit: 'USD',
    data: monthlySupplyDelivery,
    categoryField: 'month',
    series: supplyDelivery,
    stacked: true,
    summary: `Cost peaked in ${peakMonth.month}; delivery was ${deliveryShare} of the year's electricity cost.`,
  },
};
