import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { DataCoverageTrendWidget } from 'src/widgets/DataCoverageTrendWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;
const building = (name: string) => portfolio.buildings.find((candidate) => candidate.name === name)!;

/**
 * The data coverage trend recipe against the mock API (Guides → Data layer): the sample portfolio's
 * ENERGY STAR meters and utility accounts, October 2025 to September 2026, as of 13 October 2026.
 *
 * @summary Monthly data coverage per utility, from meter and utility-account bills, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Data coverage trend',
  component: DataCoverageTrendWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
  args: { scope: { client: client.id }, from: '2025-10-01', to: '2026-10-13', asOf: '2026-10-13' },
} satisfies Meta<typeof DataCoverageTrendWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every utility across the portfolio. Electricity dips in February and March, where one building's bills
 * are missing, and in June and July, where a second meter went silent; water falls to 0 in September, its
 * bills a month behind. October, still being billed, isn't drawn.
 */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /In September 2026, electricity was/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** One building whose gas meter was replaced in April: the line stays at 100%, since a meter and its replacement read as continuous. */
export const ReplacedMeter: Story = {
  args: { scope: { location: building('4 Times Square').id } },
};

/** A building reported through utility bills alone: coverage starts with its first bill, in April. */
export const BillsAlone: Story = {
  args: { scope: { location: building('55 Water Street').id } },
};

/** A building with no meters or accounts (the retail store): the empty state, not a line at 0. */
export const NothingToMeasure: Story = {
  args: { scope: { location: portfolio.buildings.find((candidate) => candidate.location_type === 31)!.id } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/No ENERGY STAR meters or utility accounts/, {}, { timeout: 5000 })).toBeVisible();
  },
};

/** When a request fails, the card says so and offers Retry. */
export const Failed: Story = {
  parameters: { mockApi: { fail: true } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('button', { name: 'Retry' }, { timeout: 5000 })).toBeVisible();
  },
};
