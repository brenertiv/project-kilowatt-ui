import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ComboChart } from 'src/charts/ComboChart';
import { monthlyUseAndBudget } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const whole = new Intl.NumberFormat('en-US');
const over = monthlyUseAndBudget.filter((row) => row.use > row.budget).length;
const peak = [...monthlyUseAndBudget].sort((a, b) => b.use - a.use)[0];
const useAndBudget = [
  { field: 'budget', name: 'Budget', target: true },
  { field: 'use', name: 'Energy use' },
];
const use = [{ field: 'use', name: 'Energy use' }];
// The normal is a variant of the degree days, so it shares their slot and differs by its dash.
const degreeDays = [
  { field: 'degreeDays', name: 'Cooling degree days', slot: 1 },
  { field: 'normal', name: '10-year normal', slot: 1, dashed: true },
];
const degreeDaysOnly = [{ field: 'degreeDays', name: 'Cooling degree days', slot: 1 }];

/**
 * Kilowatt's reference combined column and line chart: amCharts 5 through `useChart`, colored from the palette.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Combo',
  component: ComboChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof ComboChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An amount against its target, with what explains it: energy use in front of its budget (`target`, the wider neutral column) on the left axis, and degree days with their dashed normal on the right. */
export const AgainstTarget: Story = {
  name: 'Against a target',
  parameters: { card: { title: 'Energy Use, Budget and Weather' } },
  args: {
    data: monthlyUseAndBudget,
    columns: useAndBudget,
    lines: degreeDays,
    unit: 'kWh',
    lineUnit: '°F·days',
    summary: `Energy use ran over budget in ${over} of 12 months, peaking at ${whole.format(peak.use)} kWh in the month with the most cooling degree days.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /over budget/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** One set of columns and one line, with no target: an amount and the measure that drives it, in two units. */
export const ColumnsAndLine: Story = {
  name: 'Columns and a line',
  parameters: { card: { title: 'Energy Use and Weather' } },
  args: {
    data: monthlyUseAndBudget,
    columns: use,
    lines: degreeDaysOnly,
    unit: 'kWh',
    lineUnit: '°F·days',
    summary: `Energy use follows cooling degree days through the year, peaking at ${whole.format(peak.use)} kWh.`,
  },
};
