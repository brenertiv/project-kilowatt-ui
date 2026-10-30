import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor } from 'storybook/test';
import { HeaderLabel } from 'src/components/HeaderLabel';

const columns = ['Property', 'Energy intensity by floor area (kWh/sq ft)', 'Cost intensity by floor area ($/sq ft)'];

/** A narrow table with two long headers: each stays on one line, cut off, and shows the full text in a tooltip. */
function NarrowTable({ sortable = false }: { sortable?: boolean }) {
  return (
    <Box sx={{ width: 360 }}>
      <TableContainer>
        <Table aria-label="Building intensity" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={column} align={index === 0 ? undefined : 'right'}>
                  {sortable ? (
                    <TableSortLabel>
                      <HeaderLabel inButton>{column}</HeaderLabel>
                    </TableSortLabel>
                  ) : (
                    <HeaderLabel>{column}</HeaderLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row">
                120 Broadway
              </TableCell>
              <TableCell align="right">0.034</TableCell>
              <TableCell align="right">0.006</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/** Kilowatt's `HeaderLabel`: a table header's text on one line, in MUI's `TableCell`. */
const meta = {
  title: 'Data display/HeaderLabel',
  component: HeaderLabel,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Tooltip', 'Typography'] },
  args: { children: 'Energy (kWh)' },
} satisfies Meta<typeof HeaderLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A header that fits: plain text, nothing to open. */
export const Fits: Story = {
  render: (args) => (
    <Table aria-label="Building energy">
      <TableHead>
        <TableRow>
          <TableCell>
            <HeaderLabel {...args} />
          </TableCell>
        </TableRow>
      </TableHead>
    </Table>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('columnheader', { name: 'Energy (kWh)' })).toBeVisible();
  },
};

/** A header cut off: one line and an ellipsis, focusable, with the full text in a tooltip on hover and focus. */
export const Truncated: Story = {
  render: () => <NarrowTable />,
  play: async ({ canvas, userEvent }) => {
    const label = canvas.getAllByText(columns[1])[0];
    await waitFor(() => expect(label.scrollWidth).toBeGreaterThan(label.clientWidth));
    await userEvent.hover(label);
    await expect(await screen.findByRole('tooltip')).toHaveTextContent(columns[1]);
  },
};

/** Inside a `TableSortLabel` it takes `inButton`, and doesn't turn focusable: a button can't hold a focusable element. */
export const InSortLabel: Story = {
  name: 'In a sort label',
  render: () => <NarrowTable sortable />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: columns[1] })).toBeVisible();
    await expect(canvas.getAllByText(columns[1])[0]).not.toHaveAttribute('tabindex');
  },
};
