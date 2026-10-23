import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { UtilityCostBreakdownWidget } from 'src/widgets/UtilityCostBreakdownWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;
const vesey = portfolio.buildings.find(({ name }) => name === '200 Vesey Street')!;

/**
 * The utility cost breakdown recipe against the mock API (Guides → Data layer): the sample portfolio's
 * submeter logs, November 2025 to October 2026.
 *
 * @summary The latest billing month's utility cost by utility, with the balance billed against it, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Utility cost breakdown',
  component: UtilityCostBreakdownWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 400 }}>{Story()}</Box>],
  args: { scope: { client: client.id }, from: '2025-11-01', to: '2026-10-31' },
} satisfies Meta<typeof UtilityCostBreakdownWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** October 2026, still being billed: the card says how many buildings are in it so far, so a smaller month doesn't read as a drop. */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/buildings billed so far/, {}, { timeout: 5000 })).toBeVisible();
    const figure = canvas.getByRole('figure', { name: /of utility cost/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** A complete month (the window ending in September), with no "so far". */
export const CompleteMonth: Story = {
  args: { to: '2026-09-30' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('September 2026', {}, { timeout: 5000 })).toBeVisible();
  },
};

/** A building that recovers only 62% of its utility cost: a deep net loss, signed and in the error color, so it doesn't rest on color. */
export const LowRecovery: Story = {
  args: { scope: { location: vesey.id }, to: '2026-09-30' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/^−\$/, {}, { timeout: 5000 })).toBeVisible();
  },
};

/** A window with no billing: the empty state. */
export const Empty: Story = {
  args: { from: '2024-01-01', to: '2024-12-31' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('No billing in this period.', {}, { timeout: 5000 })).toBeVisible();
  },
};
