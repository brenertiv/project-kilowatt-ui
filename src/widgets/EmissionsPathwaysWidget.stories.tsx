import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { EmissionsPathwaysWidget } from 'src/widgets/EmissionsPathwaysWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

/**
 * The emissions pathways recipe against the mock API (Guides → Data layer): the sample portfolio's
 * baseline and CRREM pathway, with and without its two approved carbon plans.
 *
 * @summary Emissions with and without approved carbon plans against the CRREM pathway, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Emissions pathways',
  component: EmissionsPathwaysWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
  args: { client: client.id },
} satisfies Meta<typeof EmissionsPathwaysWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Without its plans the portfolio rises above the pathway in 2028; with them, in 2029. The approved plans'
 * reductions level off once their projects are done, so the "with plans" line flattens rather than reaching 0.
 */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    // amCharts adds a hidden alert of its own for screen readers, so the warning is found by its text.
    await expect(await canvas.findByText(/Without its plans, the portfolio rises above the pathway in 2028/, {}, { timeout: 5000 })).toBeVisible();
    const figure = canvas.getByRole('figure', { name: /approved plans bring emissions/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** When the pathway or the plans fail, the card says so and offers Retry. */
export const Failed: Story = {
  parameters: { mockApi: { fail: true } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('button', { name: 'Retry' }, { timeout: 5000 })).toBeVisible();
  },
};
