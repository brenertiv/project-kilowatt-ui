import { useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { AppShell } from 'src/components/AppShell';
import { FilterBar, filterWidth } from 'src/components/FilterBar';
import { PageHeader } from 'src/components/PageHeader';
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
    muiComponents: ['Typography', 'Fade'],
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
            <Card variant="outlined" sx={{ minHeight: (theme) => theme.spacing(20) }}>
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

/** On a phone the window scrolls, and the band pins under AppShell's sticky header. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone', isRotated: false } },
  args: { filters: <PageFilters /> },
};
