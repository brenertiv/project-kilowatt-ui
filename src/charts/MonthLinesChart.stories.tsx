import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { MonthLinesChart } from 'src/charts/MonthLinesChart';
import { inCard } from 'src/stories/decorators';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Synthetic site electricity, kWh by month: three full years, then the current year to October. */
const years: Record<string, (number | undefined)[]> = {
  y2023: [61200, 57800, 59400, 55100, 60300, 72400, 84100, 86900, 74200, 62800, 58900, 63400],
  y2024: [59100, 55900, 57200, 53800, 58700, 70100, 81800, 83600, 71900, 60500, 57100, 61200],
  y2025: [57400, 54200, undefined, 52100, 56900, 68300, 79200, 81400, 69800, 58700, undefined, undefined],
};
const data = monthNames.map((month, i) => {
  const row: Record<string, string | number> = { month };
  for (const [field, values] of Object.entries(years)) if (values[i] !== undefined) row[field] = values[i]!;
  return row;
});
const series = [
  { field: 'y2023', name: '2023' },
  { field: 'y2024', name: '2024' },
  { field: 'y2025', name: '2025' },
];

/**
 * Kilowatt's `MonthLinesChart`: a line per year across January to December, built through `useChart`. Each story shows
 * it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Month lines',
  component: MonthLinesChart,
  tags: ['!autodocs'],
  decorators: [inCard],
  args: {
    data,
    categoryField: 'month',
    series,
    unit: 'kWh',
    summary: 'Electricity by month, 2023 to 2025: each year lower than the one before, peaking in August at 86,900 kWh in 2023 and 81,400 kWh in 2025; March and November 2025 have no data.',
  },
} satisfies Meta<typeof MonthLinesChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three years over the twelve months, in series order, with a legend; a month without data breaks its year's line. */
export const YearOverYear: Story = {
  parameters: { card: { title: 'Electricity by Month' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('figure', { name: /Electricity by month, 2023 to 2025/ })).toBeVisible();
  },
};

/** One year alone: one line in the first series color, no legend. */
export const OneYear: Story = {
  parameters: { card: { title: 'Electricity by Month' } },
  args: { series: [series[2]], summary: 'Electricity by month, 2025: peaking in August at 81,400 kWh; March and November have no data.' },
};
