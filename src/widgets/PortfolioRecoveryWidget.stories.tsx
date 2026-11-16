import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { PortfolioRecoveryWidget } from 'src/widgets/PortfolioRecoveryWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

/**
 * The portfolio recovery recipe against the mock API (Guides → Data layer): the sample portfolio's
 * submeter logs, November 2025 to October 2026.
 *
 * @summary Monthly tenant recovery of utility cost, with recovery by property, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Portfolio recovery',
  component: PortfolioRecoveryWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
  args: { scope: { client: client.id }, from: '2025-11-01', to: '2026-10-31' },
} satisfies Meta<typeof PortfolioRecoveryWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Twelve months of recovery. October has bills for fewer than nine in ten properties, so it's still being billed:
 * dashed, with its count in the tooltip and under the chart; the table ranks September's properties, lowest first.
 */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const table = await canvas.findByRole('table', { name: /Recovery by property, September 2026/ }, { timeout: 5000 });
    await expect(table).toHaveTextContent('200 Vesey Street');
    const figure = canvas.getByRole('figure', { name: /still being billed/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText(/^Still being billed: \d+ of \d+ properties$/)).toBeVisible();
  },
};

/** When the logs fail to load, the card says so and offers Retry. */
export const Failed: Story = {
  parameters: { mockApi: { fail: true } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('button', { name: 'Retry' }, { timeout: 5000 })).toBeVisible();
  },
};
