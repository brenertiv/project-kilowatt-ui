import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import { ProvenanceFigure, type CitedFigure } from 'src/components/ProvenancePopover';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** A made-up portfolio's electricity spend for a month: two sources, a period and a calculation. */
const spend: CitedFigure = {
  label: 'Monthly Electricity Spend',
  value: currency.format(42180),
  provenance: {
    builtFrom: [
      { label: 'Harbor Point electricity bills', detail: '2 bills, both received', to: '/sites/harbor-point/bills' },
      { label: 'Lakeside electricity bills', detail: '1 bill, received', to: '/sites/lakeside/bills' },
    ],
    period: 'October 2026',
    calculation: 'The sum of every electricity bill whose service period falls in the month, in dollars',
    updated: Date.UTC(2026, 10, 2),
  },
};

/** A number with every row: part of the scope missing, some values estimated, a bill still to come, and an ENERGY STAR push. */
const energy: CitedFigure = {
  label: 'Site Energy Use',
  value: whole.format(1284000),
  unit: 'kBtu',
  provenance: {
    builtFrom: [
      { label: 'Northwind electricity bills', detail: '12 of 12 bills received', to: '/sites/northwind/bills' },
      { label: 'Northwind gas bills', detail: '11 of 12 bills received', to: '/sites/northwind/gas-bills' },
      { label: 'Ridgeline interval meter data', to: '/sites/ridgeline/meters' },
    ],
    period: 'January–December 2025',
    calculation: 'Electricity and gas use converted to kBtu and added up across the sites in scope',
    includes: '3 of 4 sites; Lakeside has no gas account on record and is left out',
    missing: { label: 'See what Lakeside is missing', to: '/data-health/lakeside' },
    estimatedBySource: 'December gas use for Northwind, from the utility’s estimated read',
    awaitingBill: 'Northwind gas, December 2025',
    updated: Date.UTC(2026, 0, 14),
    energyStarPush: 'January 15, 2026',
  },
};

/** A number whose source records no last-updated date. */
const occupied: CitedFigure = {
  label: 'Occupied Area',
  value: whole.format(84),
  unit: '%',
  provenance: {
    builtFrom: [{ label: 'Ridgeline lease records' }],
    calculation: 'Leased square feet divided by rentable square feet',
    updated: null,
  },
};

/**
 * Kilowatt's `ProvenanceFigure`: a number cited in running text, as a button that opens MUI's
 * `Popover` (a bottom `Drawer` on phones) listing where the number comes from. Each story shows it
 * inside a sentence, as an assistant's answer would cite it.
 */
const meta = {
  title: 'Data display/ProvenanceFigure',
  component: ProvenanceFigure,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['ButtonBase', 'Popover', 'Drawer', 'Link', 'IconButton'] },
  args: { figure: spend, onNavigate: fn() },
  render: (args) => (
    <Typography component="p" sx={{ maxWidth: '60ch' }}>
      Across Northwind’s twelve sites, the {args.figure.label.toLowerCase()} was <ProvenanceFigure {...args} /> for the period.
    </Typography>
  ),
} satisfies Meta<typeof ProvenanceFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The number in a sentence opens its popover: Built From, Period, Calculation and Last Updated, as a description list under a title naming the number. */
export const InText: Story = {
  name: 'In text',
  play: async ({ canvas, userEvent }) => {
    const figure = canvas.getByRole('button', { name: 'Monthly Electricity Spend, $42,180: where this number comes from' });
    await expect(figure).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(figure);
    const dialog = await screen.findByRole('dialog', { name: 'Monthly Electricity Spend, $42,180' });
    await waitFor(() => expect(within(dialog).getByText('Built From')).toBeVisible());
    await expect(within(dialog).getByText('Calculation')).toBeVisible();
    await expect(within(dialog).getByText(spend.provenance.calculation)).toBeVisible();
    await expect(within(dialog).queryByText('Includes')).toBeNull();
    await expect(figure).toHaveAttribute('aria-expanded', 'true');
  },
};

/** Every row the popover can show: Includes with a link to what is missing, Estimated by Source, Awaiting Bill and ENERGY STAR Last Push. A row that doesn't apply is left out. */
export const EveryRow: Story = {
  name: 'Every row',
  args: { figure: energy },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Site Energy Use, 1,284,000 kBtu/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Site Energy Use, 1,284,000 kBtu' });
    await waitFor(() => expect(within(dialog).getByText('Includes')).toBeVisible());
    await expect(within(dialog).getByRole('button', { name: 'See what Lakeside is missing' })).toBeVisible();
    await expect(within(dialog).getByText('Estimated by Source')).toBeVisible();
    await expect(within(dialog).getByText('Awaiting Bill')).toBeVisible();
    await expect(within(dialog).getByText('ENERGY STAR Last Push')).toBeVisible();
    await expect(within(dialog).getByText('Period')).toBeVisible();
  },
};

/** When no last-updated date is recorded (`updated: null`), the Last Updated row says so in words rather than leaving a blank. */
export const NoUpdatedDate: Story = {
  name: 'No updated date',
  args: { figure: occupied },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Occupied Area, 84 %/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Occupied Area, 84 %' });
    await waitFor(() => expect(within(dialog).getByText('No last-updated date is recorded for this number.')).toBeVisible());
    // A source without a link is plain text, not a button.
    await expect(within(dialog).getByText('Ridgeline lease records')).toBeVisible();
    await expect(within(dialog).queryByRole('button', { name: 'Ridgeline lease records' })).toBeNull();
  },
};

/** Following a source's link closes the popover first, then calls `onNavigate` with the link's path. */
export const FollowingALink: Story = {
  name: 'Following a link',
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Monthly Electricity Spend, \$42,180/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Monthly Electricity Spend, $42,180' });
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Harbor Point electricity bills' }));
    await expect(args.onNavigate).toHaveBeenCalledWith('/sites/harbor-point/bills');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/** Below `md` the popover is a bottom sheet: MUI's bottom `Drawer`, titled with the number, with a Close button. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Monthly Electricity Spend, \$42,180/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Monthly Electricity Spend, $42,180' });
    // The sheet slides up; wait for it rather than catching it mid-transition.
    await waitFor(() => expect(within(dialog).getByText('Built From')).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
