import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { WorkOrderStatusWidget } from 'src/widgets/WorkOrderStatusWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

/** The work-order status recipe against the mock API (Guides → Data layer): the sample portfolio's work orders, counted by status. *
 * @summary Work orders by status as a segmented bar, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Work order status',
  component: WorkOrderStatusWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
  args: { scope: { client: client.id }, from: '2026-09-01', to: '2026-11-30' },
} satisfies Meta<typeof WorkOrderStatusWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Work orders due over three months, every status in lifecycle order, each in its intent. */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('figure', { name: 'Work orders by status' }, { timeout: 5000 })).toBeVisible();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(7);
  },
};

/** A window with no work orders due: the empty state, not a bar of zeros. */
export const Empty: Story = {
  args: { from: '2025-01-01', to: '2025-01-31' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('No work orders due in this period.', {}, { timeout: 5000 })).toBeVisible();
  },
};

/** When the request fails, the card says so and offers Retry. */
export const Failed: Story = {
  parameters: { mockApi: { fail: true } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert', {}, { timeout: 5000 })).toBeVisible();
  },
};
