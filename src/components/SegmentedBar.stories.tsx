import CardContent from '@mui/material/CardContent';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { workOrderStatusIntents, workOrderTypeSlots } from 'src/charts/meanings';
import { SegmentedBar } from 'src/components/SegmentedBar';
import { workOrdersByStatus, workOrdersByType } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

/** Statuses by their API names, shown in sentence case, each colored by its intent. */
const byStatus = workOrdersByStatus.map(({ status, count }) => ({
  label: status.charAt(0) + status.slice(1).toLowerCase(),
  value: count,
  status: workOrderStatusIntents[status],
}));
const byType = workOrdersByType.map(({ type, count }) => ({ label: type, value: count, slot: workOrderTypeSlots[type] }));
/** A positive part and its negative: leased units in slot 0, brand blue, and vacant units in `chart.seriesShade`, a shade off the card. */
const occupancy = [
  { label: 'Leased', value: 412, slot: 0 },
  { label: 'Vacant', value: 38, negative: true },
];

/** A palette CSS variable in the active scheme, as the browser computes a color (`rgb(r, g, b)`), for comparing with a computed style. */
const paletteColor = (name: string) => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(`--mui-palette-${name}`).trim();
  return `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
};
/** The legend dot beside a part's name. */
const dot = (name: HTMLElement) => name.previousElementSibling as HTMLElement;
/** A legend item's place in the bar's order, left to right, from its name. */
const place = (name: HTMLElement) => Number(getComputedStyle(name.parentElement as HTMLElement).order);

/**
 * Kilowatt's `SegmentedBar`: the parts of one whole in a single bar, with a legend of values and shares.
 * Each story shows it in a `Card`, under `CardContent`, as it ships.
 */
const meta = {
  title: 'Charts/Segmented bar',
  component: SegmentedBar,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Box', 'Typography'] },
  decorators: [
    (Story) => (
      <CardContent sx={{ pt: 0 }}>
        <Story />
      </CardContent>
    ),
    inCard,
  ],
  args: { unit: 'work orders' },
} satisfies Meta<typeof SegmentedBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Colored by status: each status takes its intent from `workOrderStatusIntents`, and statuses that need no
 * one's attention are `neutral`. Parts with no value stay in the legend; the legend names every part, so
 * the shared neutral color is never the only way to tell them apart.
 */
export const ByStatus: Story = {
  parameters: { card: { title: 'Work Orders by Status' } },
  args: { segments: byStatus, label: 'Work orders by status' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('figure', { name: 'Work orders by status' })).toBeVisible();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(byStatus.length);
    await expect(canvas.getByText('Requires attention')).toBeVisible();
  },
};

/** Colored by meaning: each work-order type takes its series `slot` from `workOrderTypeSlots`, so it's the same color as on every other chart. */
export const ByType: Story = {
  parameters: { card: { title: 'Open Work Orders by Type' } },
  args: { segments: byType, label: 'Open work orders by type' },
};

/**
 * A positive part and its negative: the positive takes brand blue (slot 0) or aquaverde (slot 1), and the `negative`
 * takes `chart.seriesShade`, a shade darker than the card, after it, so only the positive reads as data.
 */
export const PositiveAndNegative: Story = {
  parameters: { card: { title: 'Units by Occupancy' } },
  args: { segments: occupancy, unit: 'units', label: 'Units by occupancy' },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    await waitFor(() => expect(getComputedStyle(dot(canvas.getByText('Leased'))).backgroundColor).toBe(paletteColor('chart-series-0')));
    await expect(getComputedStyle(dot(canvas.getByText('Vacant'))).backgroundColor).toBe(paletteColor('chart-seriesShade'));
    // The positive part first, then its negative.
    await expect(place(canvas.getByText('Leased'))).toBeLessThan(place(canvas.getByText('Vacant')));
  },
};

/** The same bar in the dark scheme: the negative part is a shade lighter than the card, and still follows its positive. */
export const PositiveAndNegativeDark: Story = {
  ...PositiveAndNegative,
  globals: { scheme: 'dark' },
  play: async ({ canvas }) => {
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    await waitFor(() => expect(getComputedStyle(dot(canvas.getByText('Leased'))).backgroundColor).toBe(paletteColor('chart-series-0')));
    await expect(getComputedStyle(dot(canvas.getByText('Vacant'))).backgroundColor).toBe(paletteColor('chart-seriesShade'));
    // A pair doesn't reverse in dark: the positive part first, then its negative.
    await expect(place(canvas.getByText('Leased'))).toBeLessThan(place(canvas.getByText('Vacant')));
  },
};
