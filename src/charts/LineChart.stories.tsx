import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { LineChart } from 'src/charts/LineChart';
import { scoreBands } from 'src/charts/meanings';
import {
  buildingDailyUse,
  buildings,
  dailyScore,
  dailyUse,
  dailyUseAndTemperature,
  emissionsProjectedFrom,
  emissionsTarget,
  monthlyEmissions,
  pathwayProjectedFrom,
  scoreBenchmark,
  yearlyPathways,
} from 'src/fixtures/charts';
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
const target = [{ value: 1100, label: 'Daily target' }];
const overTarget = dailyUse.filter((row) => row.current > 1100).length;
const nightLoad = [{ from: Date.UTC(2026, 8, 14), to: Date.UTC(2026, 8, 18), label: 'High night load' }];
const projected = [{ field: 'emissions', name: 'Emissions', projectedFrom: emissionsProjectedFrom }];
const month = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const lastMonth = monthlyEmissions[monthlyEmissions.length - 1];
const scored = [{ field: 'score', name: 'Maintenance score', bands: scoreBands, markers: 'last' as const }];
const lowest = dailyScore.reduce((min, row) => (row.score < min.score ? row : min));
const latest = dailyScore[dailyScore.length - 1];
const pathways = [
  { field: 'planned', name: 'With planned projects', projectedFrom: pathwayProjectedFrom },
  { field: 'unplanned', name: 'Without projects', projectedFrom: pathwayProjectedFrom },
  { field: 'crrem', name: 'CRREM 1.5 °C pathway', neutral: true },
];
const crossing = yearlyPathways.find((row) => row.planned <= row.crrem && row.date > pathwayProjectedFrom)!;
const year = (date: number) => new Date(date).getUTCFullYear();
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

/** A target or benchmark to read the line against: a dashed `references` line in `text.secondary`, labeled with its name and full value. */
export const Target: Story = {
  parameters: { card: { title: 'Energy Use' } },
  args: {
    series: single,
    references: target,
    summary: `Daily use went over the 1,100 kWh target on ${overTarget} of 30 days, all of them weekdays.`,
  },
};

/** A stretch of time the line is read in, such as the window a finding is about: `ranges` draws it as a band in `action.hover`, named inside at the top right. */
export const TimeRanges: Story = {
  parameters: { card: { title: 'Energy Use' } },
  args: {
    series: single,
    ranges: nightLoad,
    summary: `Daily use through September, with a high night load marked from ${day.format(nightLoad[0].from)} to ${day.format(nightLoad[0].to)}.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /high night load marked/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/**
 * Measured, then projected: one line with `projectedFrom`, dashed in its own hue from the first
 * projected month, with "projected" in the tooltip. A forecast is a variant, so it never takes a second color.
 */
export const Projected: Story = {
  parameters: { card: { title: 'Emissions' } },
  args: {
    data: monthlyEmissions,
    series: projected,
    unit: 'tCO₂e',
    interval: 'month',
    references: [{ value: emissionsTarget, label: '2027 target' }],
    summary: `Emissions are measured to October 2026 and projected to ${month.format(lastMonth.date)}, falling to ${kWh.format(lastMonth.emissions)} tCO₂e a month, under the ${kWh.format(emissionsTarget)} tCO₂e target outside winter.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /projected to/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/**
 * A score in its bands: `bands` colors the line by status (success, warning, error) band by band and
 * names the band in the tooltip; `markers: 'last'` marks today's score. A chart colored by status has no
 * other colored line.
 */
export const ScoreBands: Story = {
  parameters: { card: { title: 'Maintenance Score' } },
  args: {
    data: dailyScore,
    series: scored,
    unit: 'pts',
    max: 100,
    references: [{ value: scoreBenchmark, label: 'Portfolio benchmark' }],
    summary: `The maintenance score fell from excellent to ${lowest.score} (poor) on ${day.format(lowest.date)}, then recovered to ${latest.score}, above the ${scoreBenchmark}-point benchmark.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /maintenance score fell/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/**
 * Year by year against a pathway: `interval="year"`. Two scenarios, told apart by series color, read
 * against the CRREM pathway, which is context and `neutral`. The do-nothing scenario starts where it parts
 * from the plan; both are dashed where they're projected.
 */
export const Pathways: Story = {
  parameters: { card: { title: 'Emissions Pathways' } },
  args: {
    data: yearlyPathways,
    series: pathways,
    unit: 'tCO₂e',
    interval: 'year',
    height: 320,
    summary: `With its planned projects the portfolio falls under the CRREM 1.5 °C pathway in ${year(crossing.date)}; without them it stays above it through 2050.`,
  },
};
