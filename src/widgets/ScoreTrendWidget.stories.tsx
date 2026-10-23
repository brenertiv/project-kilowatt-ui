import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { ScoreTrendWidget } from 'src/widgets/ScoreTrendWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;
const park = portfolio.buildings.find((building) => building.name === '350 Park Avenue')!;

/**
 * The score trend recipe against the mock API (Guides → Data layer): it fetches, maps and draws on its own,
 * so each story sets only the scope, the window and the mock's state.
 *
 * @summary A score's daily trend in its bands, against a benchmark, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Score trend',
  component: ScoreTrendWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
  args: { kind: 'action', scope: { client: client.id }, from: '2026-08-15', to: '2026-10-13', title: 'Maintenance Score Trend', benchmark: 65 },
} satisfies Meta<typeof ScoreTrendWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Maintenance Score Trend for a portfolio: the daily average across its buildings, in its bands, against the benchmark. */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /maintenance score is/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** One building (`{ location: id }`): 350 Park Avenue's score dips into poor in September and recovers. */
export const Building: Story = {
  args: { scope: { location: park.id } },
};

/** Tenant Billing Score Trend: the same recipe with `kind="tenant_billing"`. */
export const TenantBilling: Story = {
  args: { kind: 'tenant_billing', title: 'Tenant Billing Score Trend' },
};

/** While the scores load, a skeleton holds the chart's space. */
export const Loading: Story = {
  parameters: { mockApi: { latencyMs: 60_000 } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Loading the maintenance score' })).toBeVisible();
  },
};

/** When the request fails, the card says so and offers Retry. */
export const Failed: Story = {
  parameters: { mockApi: { fail: true } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert', {}, { timeout: 5000 })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Retry' })).toBeVisible();
  },
};
