import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor } from 'storybook/test';
import { ExportShare, NotBuiltYet, RowAction, WidgetScopeIdle } from 'src/components/patterns';

/**
 * Kilowatt's page patterns: `NotBuiltYet`, `WidgetScopeIdle`, `RowAction` and `ExportShare`, each stock MUI composed
 * once so every page answers the same situation the same way. Each story renders one of them with synthetic data.
 */
const meta = {
  title: 'Feedback/Patterns',
  component: NotBuiltYet,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Button', 'Tooltip', 'Stack', 'Typography'] },
} satisfies Meta<typeof NotBuiltYet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `NotBuiltYet`: the action disabled, with why beside it in words, so the reason never rests on the disabled color alone. */
export const NotBuilt: Story = {
  name: 'Not built yet',
  args: { label: 'Open Carbon Plan', template: 'Carbon Plan' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Open Carbon Plan' })).toBeDisabled();
    await expect(canvas.getByText('Carbon Plan isn’t built yet')).toBeVisible();
  },
};

/** `WidgetScopeIdle`: a widget's card at a scope it can't take keeps its place and height and says which scopes it works for. */
export const WidgetScope: StoryObj<typeof WidgetScopeIdle> = {
  name: 'Widget scope idle',
  args: { height: 256 },
  render: (args) => (
    <Card variant="outlined" sx={{ maxWidth: 720 }}>
      <CardHeader title="Energy Use" />
      <WidgetScopeIdle {...args} />
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('This chart works for a portfolio, group or single property.')).toBeVisible();
  },
};

/** The row's own click, which the action's click must not reach. */
const openRow = fn();
const rows = [
  { id: 'wo-4821', title: 'Chiller 2 high discharge pressure', property: 'Harbor Point', assignee: 'Unassigned' },
  { id: 'wo-4822', title: 'Rooftop unit 3 short cycling', property: 'Maple Court', assignee: 'Dana Okafor' },
];

/** `RowAction` in a clickable row: the button's click stops at the button, so the row doesn't open too. */
export const RowActionEnabled: StoryObj<typeof RowAction> = {
  name: 'Row action',
  args: { label: 'Assign', onClick: fn() },
  render: (args) => (
    <TableContainer>
      <Table aria-label="Open work orders">
        <TableHead>
          <TableRow>
            <TableCell>Work order</TableCell>
            <TableCell>Property</TableCell>
            <TableCell>Assignee</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover onClick={() => openRow(row.id)} sx={{ cursor: 'pointer' }}>
              <TableCell>{row.title}</TableCell>
              <TableCell>{row.property}</TableCell>
              <TableCell>{row.assignee}</TableCell>
              <TableCell align="right">
                <RowAction {...args} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole('button', { name: 'Assign' })[0]);
    await expect(args.onClick).toHaveBeenCalledOnce();
    await expect(openRow).not.toHaveBeenCalled();
  },
};

/** `RowAction` with `disabledReason`: the button is disabled and the reason shows in a tooltip over it, on hover or focus. */
export const RowActionDisabled: StoryObj<typeof RowAction> = {
  name: 'Row action disabled',
  args: { label: 'Assign', onClick: fn(), disabledReason: 'Only an admin can assign a work order.' },
  render: (args) => <RowAction {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Assign' });
    await expect(button).toBeDisabled();
    // A disabled button takes no pointer events, so the tooltip listens on the span around it.
    await userEvent.hover(button.parentElement!);
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Only an admin can assign a work order.');
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** `ExportShare` with every action: Export CSV downloads the rows `csv` returns, Export PDF prints, Share copies the page's link; each reports through `notify`. */
export const Export: StoryObj<typeof ExportShare> = {
  name: 'Export and share',
  args: {
    csv: () => ({ filename: 'open-work-orders.csv', rows: [['Work order', 'Property', 'Assignee'], ...rows.map((row) => [row.title, row.property, row.assignee])] }),
    pdf: true,
    notify: fn(),
  },
  render: (args) => <ExportShare {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
    await expect(canvas.getByRole('button', { name: 'Export PDF' })).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Share' }));
    // The test browser may refuse the clipboard; either way the result is reported.
    await waitFor(() => expect(args.notify).toHaveBeenCalledWith(expect.stringMatching(/^Link copied|^The link couldn’t be copied/)));
  },
};

/** `ExportShare` with `disabled`: the exports wait while the table loads or is empty; Share stays on, since the link is always there. */
export const ExportDisabled: StoryObj<typeof ExportShare> = {
  name: 'Export disabled',
  args: { csv: () => ({ filename: 'open-work-orders.csv', rows: [] }), disabled: true, notify: () => {} },
  render: (args) => <ExportShare {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Share' })).toBeEnabled();
  },
};

/** `share={false}`: only the exports, where the page already has its own Share. */
export const ExportOnly: StoryObj<typeof ExportShare> = {
  name: 'Export only',
  args: { csv: () => ({ filename: 'open-work-orders.csv', rows: [] }), share: false, notify: () => {} },
  render: (args) => <ExportShare {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Share' })).toBeNull();
  },
};
