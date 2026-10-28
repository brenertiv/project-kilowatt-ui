import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import { PlainFigure, SourceFigure, type FigureSource } from 'src/components/SourceFigure';
import { TruncatedText } from 'src/components/TruncatedText';

const intensity = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const updated = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

/** A made-up figure's source, one short line each. */
const source: FigureSource = {
  source: 'Utility bills, then interval meter data where no bill covers the period',
  period: 'January–December 2025',
  calculation: 'Site energy use in kBtu, divided by gross floor area in square feet',
  scope: 'Every property in the current scope with a recorded floor area',
  coverage: '42 of 45 properties have a full year of data; the other 3 are left out',
  updated: updated.format(Date.UTC(2026, 9, 27)),
};

/** Stands in for the page's sources view; the View Sources story's play function checks it. */
const viewSources = fn();

/**
 * Kilowatt's `SourceFigure`, `ExplainedFigure` and `PlainFigure`: a card's headline number, which opens
 * MUI's `Dialog` with what explains it. Each story shows it as a metric card ships: an outlined `Card`
 * with a 160px floor, the figure at its foot.
 */
const meta = {
  title: 'Data display/SourceFigure',
  component: SourceFigure,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['ButtonBase', 'Dialog', 'Tooltip', 'Typography'] },
  args: { title: 'Energy Use Intensity', value: intensity.format(64.2), unit: 'kBtu/ft²', source },
  render: (args) => (
    <Card variant="outlined" sx={{ maxWidth: 360, minHeight: (theme) => theme.spacing(20), display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={<TruncatedText>{args.title}</TruncatedText>} />
      <CardContent sx={{ pt: 0, mt: 'auto', display: 'flex', flexDirection: 'column' }}>
        <SourceFigure {...args} />
      </CardContent>
    </Card>
  ),
} satisfies Meta<typeof SourceFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A figure with nothing to explain: `PlainFigure`, the same type as a source figure, not a control. */
export const Plain: Story = {
  render: (args) => (
    <Card variant="outlined" sx={{ maxWidth: 360, minHeight: (theme) => theme.spacing(20), display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={<TruncatedText>{args.title}</TruncatedText>} />
      <CardContent sx={{ pt: 0, mt: 'auto' }}>
        <PlainFigure value={args.value} unit={args.unit} />
      </CardContent>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('kBtu/ft²')).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/** The figure opens its source: a faint underline under the number, the hover tint, and a dialog titled with the card's title. */
export const WithSource: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '64.2 kBtu/ft², view source for Energy Use Intensity' }));
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use Intensity' });
    await waitFor(() => expect(within(dialog).getByText('Coverage')).toBeVisible());
    await waitFor(() => expect(within(dialog).getByText(source.period)).toBeVisible());
    await expect(within(dialog).queryByRole('button', { name: 'View Sources' })).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/** What would have been a caption under the number goes in `note`, at the top of the dialog, one line per entry. */
export const WithNote: Story = {
  args: {
    note: ['Down 4% from 2024, weather-normalized.', 'Estimated for 3 properties whose December bills are still to come.'],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /view source for Energy Use Intensity/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use Intensity' });
    await waitFor(() => expect(within(dialog).getByText('Down 4% from 2024, weather-normalized.')).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/** `onViewSources` adds View Sources, which closes the dialog and goes to the page's sources, where people can see the data itself. */
export const WithViewSources: Story = {
  args: { onViewSources: viewSources },
  play: async ({ canvas, userEvent }) => {
    viewSources.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: /view source for Energy Use Intensity/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use Intensity' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'View Sources' }));
    await expect(viewSources).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
