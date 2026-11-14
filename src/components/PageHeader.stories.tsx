import { useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { AppShell } from 'src/components/AppShell';
import { FilterBar, filterWidth } from 'src/components/FilterBar';
import { PageHeader } from 'src/components/PageHeader';
import highpoint1 from 'src/fixtures/images/highpoint-1.jpg';
import { Icon } from 'src/icons';

const company = { id: 'ridgeline', name: 'Ridgeline Logistics REIT' };
const sections = [{ id: 'home', label: 'Home', icon: 'home' as const }];
const cards = Array.from({ length: 12 }, (_, index) => `Metric ${index + 1}`);

/** A filter for the bar, set small with the rest of it. */
function PageFilters() {
  const [type, setType] = useState('all');
  return (
    <FilterBar
      filters={{
        count: 1,
        set: type === 'all' ? 0 : 1,
        render: (fullWidth) => (
          <TextField select size="small" label="Property Type" value={type} onChange={(event) => setType(event.target.value)} fullWidth={fullWidth} sx={fullWidth ? undefined : { minWidth: filterWidth }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="office">Office</MenuItem>
          </TextField>
        ),
        onClear: () => setType('all'),
      }}
    />
  );
}

/**
 * Kilowatt's `PageHeader`: a page's title that shrinks to one pinned line as the page scrolls. Each story
 * sets it in `AppShell`, which says what scrolls the page, above enough cards to scroll.
 */
const meta = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: {
    muiComponents: ['Typography', 'Fade', 'Card'],
    layout: 'fullscreen',
    // The shell fills the viewport, so the docs page shows each story in its own frame.
    docs: { story: { inline: false, height: '640px' } },
  },
  args: { title: 'Portfolio Energy and Emissions Summary' },
  render: (args) => (
    <AppShell company={company} sections={sections} section="home">
      <PageHeader {...args} />
      <Grid container spacing={2}>
        {cards.map((title) => (
          <Grid key={title} size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardHeader title={title} />
            </Card>
          </Grid>
        ))}
      </Grid>
      <Button sx={{ mt: 2 }}>Load More</Button>
    </AppShell>
  ),
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const scrollPage = (canvasElement: HTMLElement, top: number) => {
  const main = canvasElement.querySelector('main');
  const scroller = main && main.scrollHeight > main.clientHeight ? main : document.scrollingElement;
  scroller?.scrollTo({ top, behavior: 'instant' });
};

/** The title stands alone, and scrolls away with the page; a one-line condensed title pins in its place. */
export const Default: Story = {
  play: async ({ args, canvas, canvasElement }) => {
    const heading = canvas.getByRole('heading', { level: 1 });
    const condensed = canvas.getAllByText(args.title).find((text) => text !== heading)!;
    await expect(heading).toBeVisible();
    await expect(condensed).not.toBeVisible();
    scrollPage(canvasElement, 600);
    await waitFor(() => expect(condensed).toBeVisible());
    scrollPage(canvasElement, 0);
    await waitFor(() => expect(condensed).not.toBeVisible());
  },
};

/** The page's own controls sit at the header's right, and at the condensed line's right once it's pinned, so they stay in reach. */
export const WithActions: Story = {
  args: {
    actions: (
      <Button variant="outlined" startIcon={<Icon name="share" />}>
        Share
      </Button>
    ),
  },
};

/** The page's `FilterBar` sits under the condensed line in the same sticky band, with a divider under the band while it's pinned. */
export const WithFilters: Story = {
  args: { filters: <PageFilters /> },
};

/** A report sets its title in the brand serif (`titleVariant="brand"`), at `h1`'s size; the condensed line is unchanged. */
export const Report: Story = {
  args: { title: 'Quarterly Energy Report', titleVariant: 'brand' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Quarterly Energy Report' })).toBeVisible();
  },
};

/** At property scope, `property` draws one outlined bar under the title with the building's photo, name and address; the condensed line reads "Title — Property · address". */
export const WithProperty: Story = {
  args: { title: 'Energy and Emissions Summary', property: { name: 'Highpoint 1', details: '1600 Wynkoop Street, Denver, CO', photo: highpoint1 } },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('Highpoint 1')).toBeVisible();
    const condensed = canvas.getByText('Energy and Emissions Summary — Highpoint 1 · 1600 Wynkoop Street, Denver, CO');
    await expect(condensed).not.toBeVisible();
    scrollPage(canvasElement, 600);
    await waitFor(() => expect(condensed).toBeVisible());
  },
};

/** Without a photo the bar holds the building icon, so every property bar has the same shape. */
export const WithPropertyNoPhoto: Story = {
  name: 'With property, no photo',
  args: { title: 'Energy and Emissions Summary', property: { name: 'Harbor Point', details: '12 Quay Street, Portland, OR' } },
};

/** `summary` sits on the title's line, after it: the page's AI summary chip, or a status. It scrolls away with the title. */
export const WithSummary: Story = {
  args: { summary: <Chip label="AI Summary" icon={<Icon name="chat" />} variant="outlined" onClick={() => {}} /> },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'AI Summary' })).toBeVisible();
  },
};

/** A report's `description` sits under the title in `body1` and `text.secondary`: the text the report is made of, the one line a title may have under it. */
export const WithDescription: Story = {
  args: { title: 'Quarterly Energy Report', titleVariant: 'brand', description: 'Energy use, cost and emissions for every property in scope, July to September 2026, against the same months a year earlier.' },
};

/** A report's or dashboard's `byline` sits under the header, as a chip or a line of who made it and when; it scrolls away with the header. */
export const WithByline: Story = {
  args: { title: 'Quarterly Energy Report', titleVariant: 'brand', byline: <Chip label="Northwind Holdings · Updated Oct 27, 2026" variant="outlined" /> },
};

/** On a phone the window scrolls, and the band pins under AppShell's sticky header. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone', isRotated: false } },
  args: { filters: <PageFilters /> },
};
