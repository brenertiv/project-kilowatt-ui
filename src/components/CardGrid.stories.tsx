import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { FeatureRow, useCardGrid, type CardKind } from 'src/components/cardGrid';
import { PlainFigure } from 'src/components/SourceFigure';
import { TruncatedText } from 'src/components/TruncatedText';

const whole = new Intl.NumberFormat('en-US');

/** A metric card: the figure at its foot over a 160px floor (Card → Metric). */
function FigureCard({ title, value, unit }: { title: string; value: number; unit: string }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', minHeight: (theme) => theme.spacing(20), display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <CardContent sx={{ pt: 0, mt: 'auto' }}>
        <PlainFigure value={whole.format(value)} unit={unit} />
      </CardContent>
    </Card>
  );
}

/** Stands in for a chart card: an outlined card of a chart's height. */
function ChartCard({ title }: { title: string }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', height: 240 }}>
          A chart of {title.toLowerCase()} by month.
        </Typography>
      </CardContent>
    </Card>
  );
}

const titles = ['Energy Use', 'Utility Cost', 'Emissions', 'Peak Demand', 'Water Use', 'Gas Use', 'Occupancy', 'Open Work Orders', 'Data Completeness', 'Floor Area'];
const units = ['kWh', 'USD', 'kg CO₂e', 'kW', 'gal', 'therms', '%', 'work orders', '%', 'sq ft'];

/** A row of `count` cards of `kind`, each cell's span from `useCardGrid`, named for the test. */
function Row({ kind, count }: { kind: CardKind; count: number }) {
  const grid = useCardGrid();
  const spans = grid.spans(kind, count);
  return (
    <Grid container spacing={2} aria-label={`${count} ${kind} cards`} role="list">
      {spans.map((span, i) => (
        <Grid key={i} size={span} role="listitem" data-span={span}>
          {kind === 'chart' ? <ChartCard title={titles[i % titles.length]} /> : <FigureCard title={titles[i % titles.length]} value={(i + 1) * 1240} unit={units[i % units.length]} />}
        </Grid>
      ))}
    </Grid>
  );
}

/** The spans of a row's cells, as the test reads them. */
const spansOf = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>('[data-span]')].map((cell) => Number(cell.dataset.span));

/**
 * Kilowatt's card grid: `useCardGrid` gives each card in a row its span by what it holds, read from the page's own
 * width, and `FeatureRow` lays out a lead card beside a 2 × 2 of figure cards. Each story shows one layout rule.
 */
const meta = {
  title: 'Layout/Card grid',
  component: FeatureRow,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Grid'] },
  args: {
    lead: <ChartCard title="Energy Use" />,
    cells: [<FigureCard key="1" title="Utility Cost" value={18_400} unit="USD" />, <FigureCard key="2" title="Emissions" value={1_240} unit="kg CO₂e" />, <FigureCard key="3" title="Peak Demand" value={312} unit="kW" />, <FigureCard key="4" title="Occupancy" value={92} unit="%" />],
  },
} satisfies Meta<typeof FeatureRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figure cards take a third of the row from `md`: three to a row. */
export const ThreeFigures: Story = {
  name: 'Three figures',
  render: () => <Row kind="figure" count={3} />,
  play: async ({ canvas }) => {
    await expect(spansOf(canvas.getByRole('list', { name: '3 figure cards' }))).toEqual([4, 4, 4]);
  },
};

/** No orphans: four figures rebalance to two rows of two, rather than three and one alone. */
export const FourFigures: Story = {
  name: 'Four figures',
  render: () => <Row kind="figure" count={4} />,
  play: async ({ canvas }) => {
    await expect(spansOf(canvas.getByRole('list', { name: '4 figure cards' }))).toEqual([6, 6, 6, 6]);
  },
};

/** Seven figures: rows rebalance fullest first, 3 + 2 + 2. */
export const SevenFigures: Story = {
  name: 'Seven figures',
  render: () => <Row kind="figure" count={7} />,
  play: async ({ canvas }) => {
    await expect(spansOf(canvas.getByRole('list', { name: '7 figure cards' }))).toEqual([4, 4, 4, 6, 6, 6, 6]);
  },
};

/** Ten figures: 3 + 3 + 2 + 2. */
export const TenFigures: Story = {
  name: 'Ten figures',
  render: () => <Row kind="figure" count={10} />,
};

/** Chart cards take half the row from `md`: two to a row. A small bar counts as a chart. */
export const TwoCharts: Story = {
  name: 'Two charts',
  render: () => <Row kind="chart" count={2} />,
  play: async ({ canvas }) => {
    await expect(spansOf(canvas.getByRole('list', { name: '2 chart cards' }))).toEqual([6, 6]);
  },
};

/** An odd chart ends on a card across the row, never alone beside empty columns. */
export const ThreeCharts: Story = {
  name: 'Three charts',
  render: () => <Row kind="chart" count={3} />,
  play: async ({ canvas }) => {
    await expect(spansOf(canvas.getByRole('list', { name: '3 chart cards' }))).toEqual([6, 6, 12]);
  },
};

/** The feature row: a lead card six columns wide and two rows high beside a 2 × 2 of figure cards, the one place a card takes a quarter of the row. */
export const Feature: Story = {};

/** 8 + 4: report text or a figure beside a card, from `md` (`main` and `side`). */
export const MainAndSide: Story = {
  name: 'Main and side',
  render: function Render() {
    const grid = useCardGrid();
    return (
      <Grid container spacing={2}>
        <Grid size={grid.main}>
          <ChartCard title="Energy Use by Property" />
        </Grid>
        <Grid size={grid.side}>
          <FigureCard title="Energy Use" value={184_500} unit="kWh" />
        </Grid>
      </Grid>
    );
  },
};

/** Below `md` every row stacks: figures pair from `sm`, charts take the full width, and the feature row's lead goes first. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone', isRotated: false } },
};
