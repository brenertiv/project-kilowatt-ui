import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { TicketsPendingApprovalWidget } from 'src/widgets/TicketsPendingApprovalWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;
const retail = portfolio.buildings.find((building) => building.location_type === 31)!;

/**
 * The tickets pending approval recipe against the mock API (Guides → Data layer): the sample portfolio's
 * tenant tickets waiting for approval.
 *
 * @summary Tenant tickets pending approval by category as a donut, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Tickets pending approval',
  component: TicketsPendingApprovalWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 480 }}>{Story()}</Box>],
  args: { scope: { client: client.id } },
} satisfies Meta<typeof TicketsPendingApprovalWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Ten categories and some uncategorized tickets: the five largest keep their slices, and the rest are one Other. */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /tickets are waiting for approval/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** A building with no tenants and so no tickets: the empty state. */
export const NoneWaiting: Story = {
  args: { scope: { location: retail.id } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('No tickets are waiting for approval.', {}, { timeout: 5000 })).toBeVisible();
  },
};
