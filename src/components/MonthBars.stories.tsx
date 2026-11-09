import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { MonthBars, MonthBarsLegend, type MonthState } from 'src/components/MonthBars';
import { inCard } from 'src/stories/decorators';

/** Twelve months of a synthetic feed: complete but for a partial month, a gap, and two months still awaited. */
const year: MonthState[] = ['complete', 'complete', 'gap', 'complete', 'complete', 'partial', 'complete', 'complete', 'complete', 'complete', 'awaiting', 'awaiting'];
const summary = 'Electricity, Jan–Dec 2025: 8 of 10 months complete, 1 partial; no data in March; November and December awaited.';

/**
 * Kilowatt's `MonthBars`: a strip of equal bars, one per month, colored by how completely a feed reported. Each story
 * shows it in a `Card`, under `CardContent`, as it ships.
 */
const meta = {
  title: 'Charts/Month bars',
  component: MonthBars,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Box', 'Tooltip', 'Typography'] },
  decorators: [
    (Story) => (
      <CardContent sx={{ pt: 0 }}>
        <Story />
      </CardContent>
    ),
    inCard,
  ],
  args: { months: year, summary },
} satisfies Meta<typeof MonthBars>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A feed's year at a glance: 4px bars, the state of each month in its color, the sentence in the tooltip and the name. */
export const Year: Story = {
  parameters: { card: { title: 'Electricity Completeness' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('figure', { name: summary })).toBeVisible();
  },
};

/** `stretch`: the strip fills its row, so strips stacked in a card share one month axis. */
export const Stretched: Story = {
  parameters: { card: { title: 'Electricity Completeness' } },
  args: { stretch: true },
};

/** In a table cell, a strip per feed, with the legend in the row under the table. */
export const InATable: Story = {
  parameters: { card: { title: 'Data Sources' } },
  render: () => {
    const rows: { name: string; months: MonthState[]; summary: string; placeholder?: string; overlay?: string }[] = [
      { name: 'Harbor Point', months: year, summary },
      { name: 'Maple Court', months: Array(12).fill('complete'), summary: 'Electricity, Jan–Dec 2025: all 12 months complete.' },
      { name: 'Riverside Lofts', months: Array(12).fill('gap'), summary: 'Electricity, Jan–Dec 2025: no source connected.', overlay: 'No source' },
      { name: 'Cedar Annex', months: [], summary: 'Gas, Jan–Dec 2025: not applicable, the property has no gas service.', placeholder: 'Not applicable' },
    ];
    return (
      <Box sx={{ mx: -2 }}>
        <Table aria-label="Electricity completeness by property">
          <TableHead>
            <TableRow>
              <TableCell>Property</TableCell>
              <TableCell>Electricity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ name, ...bars }) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell>
                  <MonthBars {...bars} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <MonthBarsLegend />
      </Box>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No source')).toBeVisible();
    await expect(canvas.getByText('Not applicable')).toBeVisible();
    await expect(canvas.getByRole('list', { name: 'How the month bars read' })).toBeVisible();
  },
};

/** `overlay`: a feed the property has but nothing is connected for draws every month as a gap, labelled. */
export const NoSource: Story = {
  parameters: { card: { title: 'Electricity Completeness' } },
  args: { overlay: 'No source', summary: 'Electricity, Jan–Dec 2025: no source connected.' },
};

/** `placeholder`: a feed the property doesn't have draws no bars, only a quiet label, so it never looks like a problem. */
export const NotApplicable: Story = {
  parameters: { card: { title: 'Gas Completeness' } },
  args: { placeholder: 'Not applicable', months: [], summary: 'Gas, Jan–Dec 2025: not applicable, the property has no gas service.' },
};

/** Past 24 months the bars are too thin to read: the count of complete months stands in, with the sentence in its tooltip. */
export const LongPeriod: Story = {
  parameters: { card: { title: 'Electricity Completeness' } },
  args: { months: [...year, ...year, ...year], summary: 'Electricity, Jan 2023–Dec 2025: 24 of 36 months complete.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('24/36')).toBeVisible();
  },
};
