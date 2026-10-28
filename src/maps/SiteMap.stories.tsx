import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { highlightedSites, sites, statusSites } from 'src/fixtures/maps';
import { SiteMap } from 'src/maps/SiteMap';
import { inCard } from 'src/stories/decorators';

const kWh = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const top = highlightedSites.find(({ neutral }) => !neutral)!;

/**
 * Kilowatt's reference site map: MapLibre with the themed CARTO basemap, sites drawn by deck.gl.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships. The basemap loads from CARTO,
 * so the map shows the land color until it arrives, or offline.
 */
const meta = {
  title: 'Maps/Site map',
  component: SiteMap,
  tags: ['!autodocs'],
  decorators: [inCard],
  args: { sites, unit: 'kWh' },
} satisfies Meta<typeof SiteMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every site in the first series color; hover one for its name and energy use. */
export const Sites: Story = {
  parameters: { card: { title: 'Buildings' } },
  args: { summary: `${sites.length} buildings in Manhattan, from the Financial District to Midtown.` },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /buildings in Manhattan/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByRole('button', { name: 'Zoom in' })).toBeEnabled();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(sites.length);
  },
};

/** One site is the point and the rest are context: they take `neutral`, so the highlighted site reads first. */
export const Highlight: Story = {
  parameters: { card: { title: 'Highest Energy Use' } },
  args: {
    sites: highlightedSites,
    summary: `${top.name} used the most energy in September, ${kWh.format(top.value!)} kWh.`,
  },
};

/** Each site in the intent for its data status, with a detail line saying what the color means; a site with no data is a hollow ring. */
export const Status: Story = {
  parameters: { card: { title: 'Data Status' } },
  args: {
    sites: statusSites,
    summary: `Data status for ${statusSites.length} buildings in Manhattan; one has no meters connected.`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/No meters connected/)).toBeInTheDocument();
  },
};

/** Dots sized by energy use, so a dot's area follows its value; a click opens the site (here, a logged action). */
export const Sized: Story = {
  parameters: { card: { title: 'Energy Use' } },
  args: {
    sized: true,
    onSelect: fn(),
    summary: `Energy use at ${sites.length} buildings in Manhattan, sized by September's use.`,
  },
};
