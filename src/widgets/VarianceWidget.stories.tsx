import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { VarianceWidget } from 'src/widgets/VarianceWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

/** The variance recipe against the mock API (Guides → Data layer): the sample portfolio's monthly use, against the year before. *
 * @summary Each building's monthly use against last year as a diverging heatmap, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Variance',
  component: VarianceWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 840 }}>{Story()}</Box>],
  args: { scope: { client: client.id }, year: 2026 },
} satisfies Meta<typeof VarianceWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every building, January to October 2026, against 2025. 55 Water Street, metered from April, has nothing
 * to compare with; 4 Times Square has no February; October, still partial, is scaled to a whole month.
 */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /building-months used less/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** Electricity alone (`series="electricity"`): 599 Lexington Avenue's July spike stands out. */
export const Electricity: Story = {
  args: { series: 'electricity' },
};

/** When either year fails to load, the card says so and offers Retry. */
export const Failed: Story = {
  parameters: { mockApi: { fail: true } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert', {}, { timeout: 5000 })).toBeVisible();
  },
};
