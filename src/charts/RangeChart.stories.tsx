import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import type { StatusBand } from 'src/charts/LineChart';
import { RangeChart } from 'src/charts/RangeChart';
import { siteIntensity } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const { building, value, benchmark } = siteIntensity;
/** The range a site EUI is expected to fall in: from half the benchmark to one and a half times it, on a track that runs to three times it. */
const bands: StatusBand[] = [
  { from: 0, to: benchmark * 0.5, status: 'warning', label: 'Below the expected range' },
  { from: benchmark * 0.5, to: benchmark * 1.5, status: 'success', label: 'Within the expected range' },
  { from: benchmark * 1.5, to: benchmark * 3, status: 'error', label: 'Above the expected range' },
];
const low = Math.round(benchmark * 0.11 * 10) / 10;
const high = Math.round(benchmark * 2.1);

/**
 * Kilowatt's reference range chart: amCharts 5 through `useChart`, its bands tinted with the intents.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Range',
  component: RangeChart,
  tags: ['!autodocs'],
  decorators: [inCard],
  parameters: { card: { title: 'ENERGY STAR Portfolio Manager Check' } },
  args: { name: 'Site EUI', unit: 'kBtu/sq ft', benchmark, bands },
} satisfies Meta<typeof RangeChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One property's site energy use intensity (EUI) on a track from 0, against the benchmark for its type: the reading falls within the expected range, so the number and its marker take `success`. */
export const WithinRange: Story = {
  name: 'Within the expected range',
  args: {
    value,
    summary: `${building}'s site EUI is ${value} kBtu per square foot, within the expected range around the benchmark of ${benchmark}.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /site EUI is/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText('Within the expected range')).toBeVisible();
  },
};

/** A reading far below the benchmark, which usually means missing bills or meters rather than an efficient building: the number and its marker take `warning`, and the band is named under the number. */
export const BelowRange: Story = {
  name: 'Below the expected range',
  args: {
    value: low,
    summary: `${building}'s site EUI is ${low} kBtu per square foot, far below the benchmark of ${benchmark}; check for missing bills or meters.`,
  },
};

/** A reading well above the benchmark: the number and its marker take `error`. */
export const AboveRange: Story = {
  name: 'Above the expected range',
  args: {
    value: high,
    summary: `${building}'s site EUI is ${high} kBtu per square foot, about twice the benchmark of ${benchmark}.`,
  },
};
