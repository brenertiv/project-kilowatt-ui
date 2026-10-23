import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { WorkOrderTypeWidget } from 'src/widgets/WorkOrderTypeWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

/** The work-order type recipe against the mock API (Guides → Data layer): the sample portfolio's work orders, counted by type. *
 * @summary Work orders by type as a donut, each type in its own color, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Work order type',
  component: WorkOrderTypeWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 480 }}>{Story()}</Box>],
  args: { scope: { client: client.id }, from: '2026-09-01', to: '2026-11-30' },
} satisfies Meta<typeof WorkOrderTypeWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Work orders due over three months by type, each type in its own slot, so it matches every other chart of types. */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /work orders are due/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** While the counts load, a skeleton holds the donut's space. */
export const Loading: Story = {
  parameters: { mockApi: { latencyMs: 60_000 } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Loading work orders' })).toBeVisible();
  },
};
