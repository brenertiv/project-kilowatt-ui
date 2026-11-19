import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { ColumnChart } from 'src/charts/ColumnChart';
import {
  buildingRanking,
  buildingTotals,
  monthlySupplyDelivery,
  plannedProperties,
  yearlyCapitalSpend,
  yearlySpendSavings,
} from 'src/fixtures/charts';
import { clickColumn, clickPlot, hasColumns, hasPlot } from 'src/stories/chartClicks';
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

/** January to October, with October billed for 11 of the 18 properties in scope so far: under nine in ten, so still being billed. */
const billedSoFar = monthlySupplyDelivery
  .slice(0, 10)
  .map((row) => (row.month === 'Oct' ? { ...row, supply: Math.round((row.supply * 11) / 18), delivery: Math.round((row.delivery * 11) / 18) } : row));
const octoberBilling = [{ month: 'Oct', billed: 11, properties: 18 }];

/** Open alerts by building, most first: synthetic counts. Two buildings share a name, so each row has its own id. */
const openAlerts = [
  { id: 'b-104', building: 'Canal Works', alerts: 4 },
  { id: 'b-221', building: 'Foundry Row', alerts: 3 },
  { id: 'b-187', building: 'Canal Works', alerts: 2 },
  { id: 'b-090', building: 'Tannery Yard', alerts: 1 },
];
const alertSeries = [{ field: 'alerts', name: 'Open alerts' }];

/** Gas use by month, synthetic, with no reading for April: the row is there with its month and no value. */
const gasByMonth: Record<string, string | number>[] = [
  { month: 'Jan', gas: 1840 },
  { month: 'Feb', gas: 1710 },
  { month: 'Mar', gas: 1390 },
  { month: 'Apr' },
  { month: 'May', gas: 760 },
  { month: 'Jun', gas: 540 },
];
const gasSeries = [{ field: 'gas', name: 'Gas use' }];

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

/** A trailing month still being billed: `stillBilling` draws its columns as dashed outlines in their own hue and says how many properties are billed so far, in the tooltip and under the chart. */
export const StillBeingBilled: Story = {
  name: 'Still being billed',
  parameters: { card: { title: 'Electricity Cost' } },
  args: {
    unit: 'USD',
    data: billedSoFar,
    categoryField: 'month',
    series: supplyDelivery,
    stacked: true,
    stillBilling: octoberBilling,
    summary: `Electricity cost by month, January to October; cost peaked in ${peakMonth.month}. October is still being billed: 11 of 18 properties have a bill so far.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /October is still being billed/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText('Still being billed: 11 of 18 properties')).toBeVisible();
  },
};

/** A chart that narrows what's beside it: `onCategoryClick` hands back the row of the column that was clicked, and the columns take a hand pointer. */
export const CategoryClick: Story = {
  name: 'Category click',
  parameters: { card: { title: 'Open Alerts by Building' } },
  args: {
    unit: 'alerts',
    data: openAlerts,
    categoryField: 'id',
    categoryLabelField: 'building',
    series: alertSeries,
    horizontal: true,
    integerValues: true,
    onCategoryClick: fn(),
    summary: 'Open alerts by building: one Canal Works building has the most, 4; Tannery Yard the fewest, 1.',
  },
  play: async ({ args, canvas }) => {
    const figure = canvas.getByRole('figure', { name: /Open alerts by building/ });
    await waitFor(() => expect(hasColumns(figure)).toBe(true));
    clickColumn(figure, 1);
    await expect(args.onCategoryClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'b-221', building: 'Foundry Row' }));
  },
};

/** A count of records: `integerValues` keeps the value axis to whole numbers, since half an alert means nothing. */
export const WholeNumbers: Story = {
  name: 'Whole numbers',
  parameters: { card: { title: 'Open Alerts by Building' } },
  args: {
    unit: 'alerts',
    data: openAlerts.filter(({ id }) => id !== 'b-187'),
    categoryField: 'building',
    series: alertSeries,
    integerValues: true,
    summary: 'Open alerts by building: Canal Works has 4, Foundry Row 3 and Tannery Yard 1.',
  },
};

/** Two categories with one name: `categoryField` holds each row's id and `categoryLabelField` the name to show, so the two Canal Works buildings stay two bars. */
export const CategoryLabels: Story = {
  name: 'Category labels',
  parameters: { card: { title: 'Open Alerts by Building' } },
  args: {
    unit: 'alerts',
    data: openAlerts,
    categoryField: 'id',
    categoryLabelField: 'building',
    series: alertSeries,
    horizontal: true,
    integerValues: true,
    summary: 'Open alerts by building: the two Canal Works buildings have 4 and 2, Foundry Row 3 and Tannery Yard 1.',
  },
};

/** A month with no value draws no column; with `onMissingClick`, a click on its place in the plot hands back its row, so the page can open what explains the gap. */
export const MissingPeriod: Story = {
  name: 'Missing period',
  parameters: { card: { title: 'Gas Use' } },
  args: {
    unit: 'therms',
    data: gasByMonth,
    categoryField: 'month',
    series: gasSeries,
    onMissingClick: fn(),
    summary: 'Gas use by month, January to June, falling from 1,840 therms in January to 540 in June; April has no reading.',
  },
  play: async ({ args, canvas }) => {
    const figure = canvas.getByRole('figure', { name: /April has no reading/ });
    await waitFor(() => expect(hasPlot(figure)).toBe(true));
    // March has a value, so a click on it is not a missing period's; April, the fourth of six, has none.
    // The axis may still be settling when the plot first has a width, so click until the missing period answers.
    await waitFor(() => {
      clickPlot(figure, 3.5 / 6);
      expect(args.onMissingClick).toHaveBeenCalledWith({ month: 'Apr' });
    });
    clickPlot(figure, 2.5 / 6);
    await expect(args.onMissingClick).not.toHaveBeenCalledWith(expect.objectContaining({ month: 'Mar' }));
  },
};
