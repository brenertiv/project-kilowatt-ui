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
/** A positive part and its negative: leased and vacant units, both in slot 0, the vacant part in its darker shade. */
const occupancy = [
  { label: 'Leased', value: 412, slot: 0 },
  { label: 'Vacant', value: 38, slot: 0, shade: 'dark' as const },
];

/** A palette CSS variable in the active scheme, as the browser computes a color (`rgb(r, g, b)`), for comparing with a computed style. */
const paletteColor = (name: string) => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(`--mui-palette-${name}`).trim();
  return `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
};
/** The legend dot beside a part's name. */
const dot = (name: HTMLElement) => name.previousElementSibling as HTMLElement;

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
 * A positive part and its negative in one hue: both parts take the positive part's slot, and the negative
 * takes its darker shade (`shade: 'dark'`, from `chart.seriesDark`), so the pair reads as one quantity.
 */
export const PositiveAndNegative: Story = {
  parameters: { card: { title: 'Units by Occupancy' } },
  args: { segments: occupancy, unit: 'units', label: 'Units by occupancy' },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    await waitFor(() => expect(getComputedStyle(dot(canvas.getByText('Leased'))).backgroundColor).toBe(paletteColor('chart-series-0')));
    await expect(getComputedStyle(dot(canvas.getByText('Vacant'))).backgroundColor).toBe(paletteColor('chart-seriesDark-0'));
  },
};

/** The same bar in the dark scheme: the bar and its legend read the active scheme's palette, so both parts take dark's shades. */
export const PositiveAndNegativeDark: Story = {
  ...PositiveAndNegative,
  globals: { scheme: 'dark' },
  play: async ({ canvas }) => {
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    await waitFor(() => expect(getComputedStyle(dot(canvas.getByText('Leased'))).backgroundColor).toBe(paletteColor('chart-series-0')));
    await expect(getComputedStyle(dot(canvas.getByText('Vacant'))).backgroundColor).toBe(paletteColor('chart-seriesDark-0'));
  },
};
