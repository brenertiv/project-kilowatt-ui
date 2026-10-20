import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { LineChart } from 'src/charts/LineChart';
import { buildingDailyUse, buildings, dailyUse, dailyUseAndTemperature } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const kWh = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0, signDisplay: 'never' });
const total = (rows: Record<string, number>[], field: string) => rows.reduce((sum, row) => sum + row[field], 0);
const change = total(dailyUse, 'current') / total(dailyUse, 'previous') - 1;
const peak = dailyUse.reduce((max, row) => (row.current > max.current ? row : max));
const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const largest = buildings[0];

const single = [{ field: 'current', name: 'Energy use' }];
const highlight = [
  { field: 'current', name: 'This period' },
  { field: 'previous', name: 'Previous 30 days', neutral: true, dashed: true },
];
const comparison = buildings.map((name, b) => ({ field: `b${b}`, name }));
const twoUnits = [
  { field: 'current', name: 'Energy use' },
  { field: 'temperature', name: 'Outdoor temperature', neutral: true, right: true },
];
const fahrenheit = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const firstDay = dailyUseAndTemperature[0];
const lastDay = dailyUseAndTemperature[dailyUseAndTemperature.length - 1];

/**
 * Kilowatt's reference line chart: amCharts 5 through `useChart`, colored from the palette.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Line',
  component: LineChart,
  tags: ['!autodocs'],
  decorators: [inCard],
  args: { data: dailyUse, unit: 'kWh' },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One measure over time: the line takes the first series color. */
export const Single: Story = {
  parameters: { card: { title: 'Energy Use' } },
  args: {
    series: single,
    summary: `Daily use peaked at ${kWh.format(peak.current)} kWh on ${day.format(peak.date)}, and dropped on weekends.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /Daily use peaked/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** One line is the point, the other is context: the comparison takes `neutral` and `dashed`, so it reads as a baseline, not a second series. */
export const Highlight: Story = {
  parameters: { card: { title: 'Energy Use' } },
  args: {
    series: highlight,
    summary: `This period used ${kWh.format(total(dailyUse, 'current'))} kWh, ${percent.format(change)} ${change < 0 ? 'less' : 'more'} than the previous 30 days.`,
  },
};

/** Up to six lines told apart by color, in `chart.series` order. Past six, group the smallest or show a table. */
export const Comparison: Story = {
  parameters: { card: { title: 'Energy Use by Building' } },
  args: {
    data: buildingDailyUse,
    series: comparison,
    height: 320,
    summary: `${largest} used the most energy every day; all six buildings dropped on weekends.`,
  },
};

/**
 * Two units on two value axes: energy on the left in kWh, outdoor temperature on the right in °F,
 * each unit above its axis and in the legend. The context line is `neutral`. Past two units, split the chart.
 */
export const TwoUnits: Story = {
  parameters: { card: { title: 'Energy Use and Temperature' } },
  args: {
    data: dailyUseAndTemperature,
    series: twoUnits,
    rightUnit: '°F',
    summary: `Outdoor temperature fell from ${fahrenheit.format(firstDay.temperature)}\u00a0°F to ${fahrenheit.format(lastDay.temperature)}\u00a0°F over the month, and weekday energy use stayed near ${kWh.format(1240)}\u00a0kWh.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /Outdoor temperature fell/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/**
 * A chart under `CardContent`: the chart's default 16px `inset` lines its axis up with the headline
 * number above it and the card's title. `inset={1}` (8px) fits tighter; `0` runs edge to edge.
 */
export const AlignedWithContent: Story = {
  parameters: { card: { title: 'Energy Use' } },
  args: {
    series: single,
    summary: `This period used ${kWh.format(total(dailyUse, 'current'))} kWh, peaking at ${kWh.format(peak.current)} kWh on ${day.format(peak.date)}.`,
  },
  render: (args) => (
    <>
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="h2" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {kWh.format(total(dailyUse, 'current'))}
          <Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>
            {'\u00a0'}kWh
          </Typography>
        </Typography>
      </CardContent>
      <LineChart {...args} />
    </>
  ),
};
