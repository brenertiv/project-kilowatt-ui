import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ScrollArrows, ScrollRow, ScrollRowItem, useScrollRow } from 'src/components/ScrollRow';

const reports = ['Monthly Energy Report', 'Quarterly Emissions Summary', 'Annual Cost Review', 'Water Use Report', 'Peak Demand Review', 'Data Health Summary', 'Year-End Review'];

/** A titled row of report cards: the title and arrows in the header, the cards in the row. */
function Row({ titles, width }: { titles: string[]; width: number }) {
  const row = useScrollRow();
  return (
    <Box component="section" aria-labelledby="row-title" sx={{ width }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1, minHeight: (theme) => theme.spacing(5) }}>
        <Typography id="row-title" variant="h6" component="h2">
          Recent Reports
        </Typography>
        <ScrollArrows row={row} label="Recent Reports" />
      </Stack>
      <ScrollRow row={row} label="Recent Reports">
        {titles.map((title) => (
          <ScrollRowItem key={title}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea sx={{ height: '100%', minHeight: (theme) => theme.spacing(16), alignItems: 'flex-start', display: 'flex' }}>
                <CardHeader title={title} />
              </CardActionArea>
            </Card>
          </ScrollRowItem>
        ))}
      </ScrollRow>
    </Box>
  );
}

/**
 * Kilowatt's `ScrollRow`: a row of fixed-width cards that scrolls sideways, with Back and Forward
 * arrows in the row's header, shown only while the row overflows.
 */
const meta = {
  title: 'Layout/ScrollRow',
  component: ScrollRow,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['IconButton', 'Stack'] },
  render: () => <Row titles={reports} width={640} />,
} satisfies Meta;

export default meta;
// Untyped by the component: the row's state comes from `useScrollRow` in the render, not from args.
type Story = StoryObj;

/** A row wider than its view: the arrows show, Back disabled at the start; Forward moves a view less the gap. */
export const Overflowing: Story = {
  play: async ({ canvas, userEvent }) => {
    const group = await canvas.findByRole('group', { name: 'Scroll Recent Reports' });
    await expect(group).toBeVisible();
    const back = canvas.getByRole('button', { name: 'Back' });
    const forward = canvas.getByRole('button', { name: 'Forward' });
    await expect(back).toBeDisabled();
    const list = canvas.getByRole('list', { name: 'Recent Reports' });
    await userEvent.click(forward);
    await waitFor(() => expect(list.scrollLeft).toBeGreaterThan(0));
    await waitFor(() => expect(back).toBeEnabled());
  },
};

/** A row that fits its view has no arrows, so its header carries no dead buttons. */
export const Fits: Story = {
  render: () => <Row titles={reports.slice(0, 2)} width={640} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('list', { name: 'Recent Reports' })).toBeVisible();
    await expect(canvas.queryByRole('group', { name: 'Scroll Recent Reports' })).toBeNull();
  },
};
