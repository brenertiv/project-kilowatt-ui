import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Sparkline } from 'src/charts/Sparkline';
import { buildingTrends, dailyUse, monthlyEnergyStar, recentScore, scoreBenchmark } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const latestScore = recentScore[recentScore.length - 1].score;
const lowestScore = Math.min(...recentScore.map((row) => row.score));
const latestStar = monthlyEnergyStar[monthlyEnergyStar.length - 1].score;
const firstStar = monthlyEnergyStar[0].score;
const lastDay = dailyUse[dailyUse.length - 1].current;
const totalUse = dailyUse.reduce((sum, row) => sum + row.current, 0);
const signedPercent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' });
/** Each building's change in daily energy use over the 30 days: its last week's average against its first week's. */
const trendRows = buildingTrends.map(({ building, rows }) => {
  const mean = (list: typeof rows) => list.reduce((sum, row) => sum + row.use, 0) / list.length;
  return { building, rows, change: mean(rows.slice(-7)) / mean(rows.slice(0, 7)) - 1 };
});
const benchmark = [{ value: scoreBenchmark, label: 'Benchmark' }];
const energyStar = [
  { value: 50, label: 'National median', labelBelow: true },
  { value: 75, label: 'Certification' },
];

/**
 * Kilowatt's reference sparkline: amCharts 5 through `useChart`, colored from the palette. Each story
 * shows it as it ships, in a `Card` under the headline number it explains.
 */
const meta = {
  title: 'Charts/Sparkline',
  component: Sparkline,
  tags: ['!autodocs'],
  decorators: [inCard],
  render: (args) => (
    <>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h2" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {whole.format(args.data[args.data.length - 1][args.field])}
          <Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>
            {' '}
            {args.unit}
          </Typography>
        </Typography>
      </CardContent>
      <Sparkline {...args} />
    </>
  ),
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A score's last 30 days against a benchmark, on its fixed 0–100 range (`min`, `max`): the dashed reference gives the line its scale. */
export const Score: Story = {
  parameters: { card: { title: 'Maintenance Score' } },
  args: {
    data: recentScore,
    field: 'score',
    name: 'Maintenance score',
    unit: 'pts',
    min: 0,
    max: 100,
    references: benchmark,
    summary: `The maintenance score is ${latestScore}, recovered over 30 days from a low of ${lowestScore} and above the ${scoreBenchmark}-point benchmark.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /maintenance score is/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** Two references at most: the national median and the certification threshold, month by month. The median's label sits below its line (`labelBelow`), clear of the data above it. */
export const TwoReferences: Story = {
  parameters: { card: { title: 'ENERGY STAR Score' } },
  args: {
    data: monthlyEnergyStar,
    field: 'score',
    name: 'ENERGY STAR score',
    unit: 'pts',
    interval: 'month',
    min: 0,
    max: 100,
    height: 88,
    references: energyStar,
    summary: `The ENERGY STAR score rose from ${firstStar} to ${latestStar} over the year, past the certification threshold of 75.`,
  },
};

/** A measure with no fixed range: the line fits the data, and the headline number above it carries the unit. */
export const Fitted: Story = {
  parameters: { card: { title: 'Energy Use Today' } },
  args: {
    data: dailyUse,
    field: 'current',
    name: 'Energy use',
    unit: 'kWh',
    summary: `Energy use was ${whole.format(lastDay)} kWh on the last day, dipping on weekends through September.`,
  },
};

/** `variant="column"`: an amount per period as thin columns from 0, with no marker, for a count or a volume where each period stands alone. */
export const Columns: Story = {
  parameters: { card: { title: 'Energy Use Today' } },
  args: {
    data: dailyUse,
    field: 'current',
    name: 'Energy use',
    unit: 'kWh',
    variant: 'column',
    summary: `Energy use was ${whole.format(lastDay)} kWh on the last day and ${whole.format(totalUse)} kWh over September, lower on weekends.`,
  },
};

/** Micro charts in a table: one row per building with its change as signed text, a line for the trend and neutral columns for the peaks, each 32px tall with `inset={0}`. The numbers carry the values; the sparklines only show the shape. */
export const InATable: Story = {
  name: 'In a table',
  parameters: { card: { title: 'Energy Use by Building, Last 30 Days' } },
  args: {
    data: trendRows[0].rows,
    field: 'use',
    name: 'Energy use',
    unit: 'kWh',
    height: 32,
    inset: 0,
    summary: `Daily energy use at ${trendRows[0].building} over 30 days, ${signedPercent.format(trendRows[0].change)} from the first week to the last.`,
  },
  render: (args) => (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Building</TableCell>
          <TableCell align="right">Change</TableCell>
          <TableCell sx={{ width: '28%' }}>Energy use</TableCell>
          <TableCell sx={{ width: '28%' }}>Peak demand</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {trendRows.map(({ building, rows, change }) => (
          <TableRow key={building}>
            <TableCell component="th" scope="row">
              {building}
            </TableCell>
            <TableCell align="right">{signedPercent.format(change)}</TableCell>
            <TableCell>
              <Sparkline
                {...args}
                data={rows}
                summary={`Daily energy use at ${building} over 30 days, ${signedPercent.format(change)} from the first week to the last.`}
              />
            </TableCell>
            <TableCell>
              <Sparkline
                {...args}
                data={rows}
                field="peak"
                name="Peak demand"
                unit="kW"
                variant="column"
                neutral
                summary={`Daily peak demand at ${building} over 30 days, highest at ${whole.format(Math.max(...rows.map((row) => row.peak)))} kW.`}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getAllByRole('figure')).toHaveLength(trendRows.length * 2));
  },
};
