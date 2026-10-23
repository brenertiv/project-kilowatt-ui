import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ColumnChart } from 'src/charts/ColumnChart';
import {
  buildingRanking,
  buildingTotals,
  monthlySupplyDelivery,
  plannedProperties,
  yearlyCapitalSpend,
  yearlySpendSavings,
} from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const kWh = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const most = buildingTotals.reduce((max, row) => (row.use > max.use ? row : max));
const least = buildingTotals.reduce((min, row) => (row.use < min.use ? row : min));
const peakMonth = monthlySupplyDelivery.reduce((max, row) => (row.supply + row.delivery > max.supply + max.delivery ? row : max));
const deliveryShare = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 }).format(
  monthlySupplyDelivery.reduce((sum, row) => sum + row.delivery, 0) /
    monthlySupplyDelivery.reduce((sum, row) => sum + row.supply + row.delivery, 0),
);

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const totals = [{ field: 'use', name: 'Energy use' }];
const spendSavings = [
  { field: 'spend', name: 'Project spend' },
  { field: 'savings', name: 'Energy-cost savings' },
];
const byProperty = plannedProperties.map((name, p) => ({ field: `p${p}`, name }));
const firstYear = yearlySpendSavings[0];
const lastYear = yearlySpendSavings[yearlySpendSavings.length - 1];
const plannedTotal = yearlyCapitalSpend.reduce((sum, row) => sum + plannedProperties.reduce((s, _, p) => s + row[`p${p}`], 0), 0);
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
  parameters: { card: { title: 'Energy Use by Building' } },
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
  parameters: { card: { title: 'Electricity Cost' } },
  args: {
    unit: 'USD',
    data: monthlySupplyDelivery,
    categoryField: 'month',
    series: supplyDelivery,
    stacked: true,
    summary: `Cost peaked in ${peakMonth.month}; delivery was ${deliveryShare} of the year's electricity cost.`,
  },
};

/** Two measures per category, side by side, told apart by series color: what's spent each year against what it saves. */
export const SideBySide: Story = {
  name: 'Side by side',
  parameters: { card: { title: 'Project Spend and Savings' } },
  args: {
    unit: 'USD',
    data: yearlySpendSavings,
    categoryField: 'year',
    series: spendSavings,
    summary: `Project spend falls from ${usd.format(firstYear.spend)} in ${firstYear.year} to ${usd.format(lastYear.spend)} in ${lastYear.year}, while yearly savings grow to ${usd.format(lastYear.savings)}.`,
  },
};

/** A ranking: `horizontal` bars, largest first, with long building names down the left and the values along the bottom. */
export const Ranking: Story = {
  parameters: { card: { title: 'Energy Use by Building' } },
  args: {
    data: buildingRanking,
    categoryField: 'building',
    series: totals,
    horizontal: true,
    summary: `${buildingRanking[0].building} used the most, ${kWh.format(buildingRanking[0].use)} kWh; ${buildingRanking[buildingRanking.length - 1].building} the least.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /used the most/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** More than six series, stacked: the five largest keep their colors and the rest are summed into a neutral "Other", rather than nine hues no one can tell apart. */
export const GroupedIntoOther: Story = {
  name: 'Grouped into Other',
  parameters: { card: { title: 'Planned Capital Spend' } },
  args: {
    unit: 'USD',
    data: yearlyCapitalSpend,
    categoryField: 'year',
    series: byProperty,
    stacked: true,
    height: 280,
    summary: `${usd.format(plannedTotal)} of capital spend is planned across ${plannedProperties.length} properties from 2027 to 2031; the five largest are shown, the rest grouped as Other.`,
  },
};
