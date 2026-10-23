import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { SpendSavingsWidget } from 'src/widgets/SpendSavingsWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;
const tenant = portfolio.clients.find((candidate) => candidate.tenant)!;

/**
 * The spend and savings recipe against the mock API (Guides → Data layer): the sample portfolio's two
 * approved carbon plans; the plan under review doesn't count.
 *
 * @summary Approved carbon plans' yearly spend against savings, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Spend and savings',
  component: SpendSavingsWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
  args: { client: client.id },
} satisfies Meta<typeof SpendSavingsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Spend falls as the projects land, and savings grow from the year after each one starts. */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /approved plans spend/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** A client with no approved plans: the empty state says so, rather than an empty chart. */
export const NoApprovedPlans: Story = {
  args: { client: tenant.id },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('No approved carbon plans yet.', {}, { timeout: 5000 })).toBeVisible();
  },
};

/** When the plans or their chart data fail, the card says so and offers Retry. */
export const Failed: Story = {
  parameters: { mockApi: { fail: true } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert', {}, { timeout: 5000 })).toBeVisible();
  },
};
