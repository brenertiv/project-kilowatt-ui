import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { IntervalChart } from 'src/charts/IntervalChart';
import { intervalDemand } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const kW = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const readings = new Intl.NumberFormat('en-US').format(intervalDemand.length);
const peak = intervalDemand.reduce((max, row) => (row.demand > max.demand ? row : max));
const base = intervalDemand.reduce((min, row) => (row.demand < min.demand ? row : min));
const when = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
const energy = intervalDemand.reduce((total, row) => total + row.demand / 4, 0);
const MWh = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const limit = { value: 1300, label: 'Demand limit' };
const overLimit = intervalDemand.filter((row) => row.demand > limit.value);
const daysOver = new Set(overLimit.map((row) => Math.floor(row.date / 86400000)));
const longDay = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

const demand = [{ field: 'demand', name: 'Demand' }];
const use = [{ field: 'use', name: 'Energy use' }];
// Each 15-minute reading of demand in kW is a quarter hour of energy: kWh = kW / 4.
const intervalUse = intervalDemand.map(({ date, demand: kw }) => ({ date, use: Math.round((kw / 4) * 10) / 10 }));

/**
 * Kilowatt's reference chart for fine-interval readings: amCharts 5 through `useChart`, grouping a year
 * of 15-minute readings as it zooms. Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Interval',
  component: IntervalChart,
  tags: ['!autodocs'],
  decorators: [inCard],
  args: { data: intervalDemand, series: demand, unit: 'kW' },
} satisfies Meta<typeof IntervalChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A year of 15-minute demand, averaged by day until you zoom in: swipe up or down with two fingers over the plot, drag across it, or move the scrollbar's grips. */
export const Average: Story = {
  parameters: { card: { title: 'Demand' } },
  args: {
    summary: `${readings} 15-minute demand readings over a year: ${kW.format(base.demand)} to ${kW.format(peak.demand)} kW, highest on summer weekday afternoons, with a base load overnight and on weekends.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /15-minute demand readings/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** Peak demand: `aggregate="high"` keeps each group's highest reading, so the peaks that set demand charges survive zooming out. */
export const Peak: Story = {
  parameters: { card: { title: 'Peak Demand' } },
  args: {
    aggregate: 'high',
    summary: `Demand peaked at ${kW.format(peak.demand)} kW on ${when.format(peak.date)}; summer weekday peaks run about twice the winter weekend ones.`,
  },
};

/**
 * A target to read the readings against: `target` draws a dashed reference line, and the line is `chart.neutral`
 * within it and takes its hue, filled to the target, past it, so the readings over the limit stand out. The tooltip
 * says "over target". With `aggregate="high"`, zooming out keeps every day that went over.
 */
export const Target: Story = {
  parameters: { card: { title: 'Peak Demand' } },
  args: {
    aggregate: 'high',
    target: limit,
    summary: `Demand went over the ${kW.format(limit.value)} kW limit on ${daysOver.size} days, from ${longDay.format(overLimit[0].date)} to ${longDay.format(overLimit[overLimit.length - 1].date)}, in ${kW.format(overLimit.length)} of ${readings} 15-minute readings.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /over the 1,300 kW limit/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** Energy use: `aggregate="sum"` adds each group's readings, so a point is the hour's, day's, week's or month's total. */
export const Total: Story = {
  parameters: { card: { title: 'Energy Use' } },
  args: {
    data: intervalUse,
    series: use,
    unit: 'kWh',
    aggregate: 'sum',
    summary: `The building used ${MWh.format(energy / 1000)} MWh over the year, most of it on summer weekdays.`,
  },
};
