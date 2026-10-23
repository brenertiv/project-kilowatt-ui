import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { ScoreSummaryWidget } from 'src/widgets/ScoreSummaryWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;
const retail = portfolio.buildings.find((building) => building.location_type === 31)!;
const benchmark = [{ value: 65, label: 'Benchmark' }];
const energyStar = [
  { value: 50, label: 'National median', labelBelow: true },
  { value: 75, label: 'Certification' },
];

/**
 * The score summary recipe against the mock API (Guides → Data layer): a headline, its change from the
 * period before, and a sparkline, as the Summary board shows them.
 *
 * @summary A score's headline, its change and a sparkline, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Score summary',
  component: ScoreSummaryWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 360 }}>{Story()}</Box>],
  args: { kind: 'action', scope: { client: client.id }, from: '2026-09-14', to: '2026-10-13', title: 'Maintenance', references: benchmark },
} satisfies Meta<typeof ScoreSummaryWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Summary board's Maintenance card: the last 30 days' average, its change, and the daily trend against the benchmark. */
export const Maintenance: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /maintenance score averaged/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText(/points from the period before/)).toBeVisible();
  },
};

/** The Energy & ESG card: the ENERGY STAR score against the national median and certification. */
export const EnergyStar: Story = {
  name: 'ENERGY STAR',
  args: { kind: 'energy_star', title: 'Energy & ESG', references: energyStar },
};

/** A building with no score of this kind (the retail store has no tenants to bill): the empty state, never 0. */
export const NoScore: Story = {
  args: { kind: 'tenant_billing', scope: { location: retail.id }, title: 'Tenant Billing', references: undefined },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('No tenant billing score for this period.', {}, { timeout: 5000 })).toBeVisible();
  },
};

/** When either request fails, the card says so and offers Retry. */
export const Failed: Story = {
  parameters: { mockApi: { fail: true } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert', {}, { timeout: 5000 })).toBeVisible();
  },
};
