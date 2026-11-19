import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import { ExplainedFigure, ExplanationEnd, FigureExplanation, PlainFigure, SourceFigure, type FigureSource } from 'src/components/SourceFigure';
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

/** The places a figure's data comes from, as links. */
const sources = [
  { label: 'Utility bills', detail: '42 properties, 12 bills each', href: '#utility-bills' },
  { label: 'Interval meter data', href: '#meter-data' },
];

/** Stands in for the page's sources view; the View Sources story's play function checks it. */
const viewSources = fn();

/**
 * Kilowatt's `SourceFigure`, `ExplainedFigure` and `PlainFigure`: a card's headline number, which opens
 * MUI's `Dialog` with what explains it. Each story shows it as a metric card ships: an outlined `Card`
 * with the 160px floor every card has (`card-min-height`), the figure at its foot.
 */
const meta = {
  title: 'Data display/SourceFigure',
  component: SourceFigure,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['ButtonBase', 'Dialog', 'Tooltip', 'Typography', 'Button', 'Collapse'] },
  args: { title: 'Energy Use Intensity', value: intensity.format(64.2), unit: 'kBtu/ft²', source },
  render: (args) => (
    <Card variant="outlined" sx={{ maxWidth: 360, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={<TruncatedText>{args.title}</TruncatedText>} />
      <CardContent sx={{ mt: 'auto', display: 'flex', flexDirection: 'column' }}>
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
    <Card variant="outlined" sx={{ maxWidth: 360, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={<TruncatedText>{args.title}</TruncatedText>} />
      <CardContent sx={{ mt: 'auto' }}>
        <PlainFigure value={args.value} unit={args.unit} />
      </CardContent>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('kBtu/ft²')).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/** A plain figure its source estimated: the word “est.” follows the value in `text.secondary`, and takes focus to show “Estimated by the utility” in a tooltip. */
export const PlainEstimated: Story = {
  name: 'Plain, estimated',
  render: (args) => (
    <Card variant="outlined" sx={{ maxWidth: 360, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={<TruncatedText>{args.title}</TruncatedText>} />
      <CardContent sx={{ mt: 'auto' }}>
        <PlainFigure value={args.value} unit={args.unit} estimated="the utility" />
      </CardContent>
    </Card>
  ),
  play: async ({ canvas, userEvent }) => {
    const marker = canvas.getByText('est.');
    await expect(marker).toBeVisible();
    await userEvent.tab();
    await expect(marker).toHaveFocus();
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Estimated by the utility');
  },
};

/** The figure opens its source: a faint underline under the number, the hover tint, and a dialog titled with the card's title that lists the provenance popover's rows in its order, Built From first. */
export const WithSource: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '64.2 kBtu/ft², view source for Energy Use Intensity' }));
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use Intensity' });
    await waitFor(() => expect(within(dialog).getByText(source.source)).toBeVisible());
    // The popover's rows, under its names and in its order; a row that isn't given is left out.
    const terms = [...dialog.querySelectorAll('dt')].map((term) => term.textContent);
    await expect(terms).toEqual(['Built From', 'Period', 'Calculation', 'Includes', 'Last Updated']);
    await expect(within(dialog).getByText(source.period)).toBeVisible();
    await expect(within(dialog).getByText(source.coverage)).toBeVisible();
    await expect(within(dialog).queryByRole('button', { name: 'Show the Figures' })).toBeNull();
    await expect(within(dialog).queryByRole('button', { name: 'View Sources' })).toBeNull();
    await expect(within(dialog).queryByRole('button', { name: 'Done' })).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/** A value its source estimated: `estimated` names the source, the word “est.” follows the value in `text.secondary`, the tooltip and the button's name say “Estimated by the utility”, and the dialog's Estimated by Source row says so too. */
export const Estimated: Story = {
  args: { estimated: 'the utility' },
  play: async ({ canvas, userEvent }) => {
    const figure = canvas.getByRole('button', { name: '64.2 kBtu/ft², estimated by the utility, view source for Energy Use Intensity' });
    await expect(within(figure).getByText('est.')).toBeVisible();
    await userEvent.hover(figure);
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Estimated by the utility. View source: Energy Use Intensity');
    await userEvent.click(figure);
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use Intensity' });
    await waitFor(() => expect(within(dialog).getByText('Estimated by Source')).toBeVisible());
    await expect(within(dialog).getByText('This value is estimated by the utility')).toBeVisible();
  },
};

/** What would have been a caption under the number goes in `note`: the dialog's description, at the top, one line per entry. */
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

/** `sources` lists where the data comes from as links under Built From, in place of `source.source`. */
export const WithSourceLinks: Story = {
  args: { sources },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /view source for Energy Use Intensity/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use Intensity' });
    await waitFor(() => expect(within(dialog).getByRole('link', { name: 'Utility bills' })).toBeVisible());
    await expect(within(dialog).getByRole('link', { name: 'Interval meter data' })).toHaveAttribute('href', '#meter-data');
  },
};

/** Every row the dialog can list, with the figures behind the calculation: synthetic values. */
const everyRow: FigureSource = {
  ...source,
  figures: { formula: ['Site energy use: 2,696,400 kBtu', 'Gross floor area: 42,000 ft²', '2,696,400 kBtu ÷ 42,000 ft² = 64.2 kBtu/ft²'] },
  estimatedBySource: 'December gas use for 3 properties, from the utility’s estimated read',
  awaitingBill: 'December 2025 gas, 3 properties',
  energyStarPush: 'January 15, 2026',
};

/** Every row, in the provenance popover's order, with Show the Figures under the calculation laying out the formula and the values used. */
export const EveryRow: Story = {
  name: 'Every row',
  args: { source: everyRow },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /view source for Energy Use Intensity/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use Intensity' });
    await waitFor(() => expect(within(dialog).getByText('Awaiting Bill')).toBeVisible());
    await expect([...dialog.querySelectorAll('dt')].map((term) => term.textContent)).toEqual([
      'Built From',
      'Period',
      'Calculation',
      'Includes',
      'Estimated by Source',
      'Awaiting Bill',
      'Last Updated',
      'ENERGY STAR Last Push',
    ]);
    const show = within(dialog).getByRole('button', { name: 'Show the Figures' });
    await expect(show).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(show);
    await waitFor(() => expect(within(dialog).getByText('2,696,400 kBtu ÷ 42,000 ft² = 64.2 kBtu/ft²')).toBeVisible());
  },
};

/** Stands in for opening a property's record; the With records story's play function checks it. */
const openRecord = fn();

/** The properties a figure counts, as records: synthetic names only. */
const properties = ['Harbor Point', 'Lakeside Commons', 'Ridgeline Plaza', 'Northwind Tower', 'Cedar Annex', 'Maple Court', 'Riverside Lofts', 'Pine Court'];

/** `records` lists the records a source is built from as links under its detail, six then "and N more"; a link closes the explanation as it opens the record. */
export const WithRecords: Story = {
  name: 'With records',
  args: {
    sources: [{ label: 'Property records', detail: '8 properties with a recorded floor area', records: properties.map((name) => ({ id: name, label: name, onOpen: () => openRecord(name) })) }],
  },
  play: async ({ canvas, userEvent }) => {
    openRecord.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: /view source for Energy Use Intensity/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use Intensity' });
    const records = await within(dialog).findByRole('list', { name: 'Records' });
    await waitFor(() => expect(within(records).getAllByRole('button')).toHaveLength(6));
    await waitFor(() => expect(within(records).getByText('and 2 more')).toBeVisible());
    await userEvent.click(within(records).getByRole('button', { name: 'Lakeside Commons' }));
    await expect(openRecord).toHaveBeenCalledWith('Lakeside Commons');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/** A figure that isn't a `SourceFigure`: an `ExplainedFigure` holding a `FigureExplanation`. Whatever isn't given stays out, here every row but Calculation. */
export const WithExplanation: Story = {
  render: (args) => (
    <Card variant="outlined" sx={{ maxWidth: 360, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={<TruncatedText>Properties Reporting</TruncatedText>} />
      <CardContent sx={{ mt: 'auto', display: 'flex', flexDirection: 'column' }}>
        <ExplainedFigure title="Properties Reporting" value="42" onViewSources={args.onViewSources}>
          <FigureExplanation description="Properties with a full year of bills or meter data." calculation="Properties with twelve months of data, out of the 45 in scope." />
        </ExplainedFigure>
      </CardContent>
    </Card>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /view source for Properties Reporting/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Properties Reporting' });
    await waitFor(() => expect(within(dialog).getByText('Properties with twelve months of data, out of the 45 in scope.')).toBeVisible());
    await expect([...dialog.querySelectorAll('dt')].map((term) => term.textContent)).toEqual(['Calculation']);
  },
};

/** `ExplanationEnd` round a page's content gives every figure explanation the same closing line, once, last, after the figure's own description. */
export const WithClosingLine: Story = {
  name: 'With a closing line',
  args: { note: 'Site energy per square foot, for the properties with a full year of data.' },
  decorators: [
    (Story) => (
      <ExplanationEnd value="Data as of Oct 15, 2026, pulled nightly (last pull 2:10 AM).">
        <Story />
      </ExplanationEnd>
    ),
  ],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /view source for Energy Use Intensity/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use Intensity' });
    const end = await within(dialog).findByText('Data as of Oct 15, 2026, pulled nightly (last pull 2:10 AM).');
    const note = within(dialog).getByText('Site energy per square foot, for the properties with a full year of data.');
    // The closing line comes after the figure's own description.
    await expect(note.compareDocumentPosition(end) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
