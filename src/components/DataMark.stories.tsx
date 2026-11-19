import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen } from 'storybook/test';
import { DataMark } from 'src/components/DataMark';

/**
 * Kilowatt's `DataMark`: the one mark for a value that isn't there. A dash with a marker, and the state word and
 * reason in MUI's `Tooltip` and in its accessible name.
 */
const meta = {
  title: 'Data display/DataMark',
  component: DataMark,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Tooltip', 'Typography'] },
  args: { reason: 'No bill has arrived for March 2026.' },
} satisfies Meta<typeof DataMark>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A value that should exist and doesn't: the default state, Missing, with the reason after it. */
export const Missing: Story = {
  play: async ({ canvas, userEvent }) => {
    const mark = canvas.getByRole('img', { name: 'Missing. No bill has arrived for March 2026.' });
    await userEvent.tab();
    await expect(mark).toHaveFocus();
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Missing. No bill has arrived for March 2026.');
  },
};

/** A value nothing can measure yet: `state` names why, here Not observable, and the reason says what is absent. */
export const NotObservable: Story = {
  args: { state: 'Not observable', reason: 'This floor has no submeter.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Not observable. This floor has no submeter.' })).toBeVisible();
  },
};

/** In a table: the mark sits where the number would, right aligned with its column, never a bare dash or 0. */
export const InATable: Story = {
  render: (args) => (
    <TableContainer>
      <Table aria-label="Monthly energy">
        <TableHead>
          <TableRow>
            <TableCell>Month</TableCell>
            <TableCell align="right">Energy (kWh)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row">
              February 2026
            </TableCell>
            <TableCell align="right">48,310</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              March 2026
            </TableCell>
            <TableCell align="right">
              <DataMark {...args} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: /^Missing\./ })).toBeVisible();
  },
};
