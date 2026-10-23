import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { BurnRateWidget } from 'src/widgets/BurnRateWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

/**
 * The burn rate recipe against the mock API (Guides → Data layer): the sample portfolio's committed
 * capital, spent to the sample's today, 13 October 2026.
 *
 * @summary Committed capital spent so far, as a progress bar with the amounts, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Burn rate',
  component: BurnRateWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 360 }}>{Story()}</Box>],
  args: { scope: { client: client.id }, asOf: '2026-10-13' },
} satisfies Meta<typeof BurnRateWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Part of the capital plan is spent; the carbon plans start in 2027. The amounts are written out, so the bar's length isn't the only way to read them. */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const bar = await canvas.findByRole('progressbar', { name: 'Committed capital spent' }, { timeout: 5000 });
    await expect(Number(bar.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
    await expect(canvas.getByText('Remaining')).toBeVisible();
  },
};

/** Before any spend (`asOf` before the plans start): nothing spent, and no CO₂ row, since no project with spend carries an estimate. */
export const NothingSpent: Story = {
  args: { asOf: '2024-12-31' },
  play: async ({ canvas }) => {
    const bar = await canvas.findByRole('progressbar', { name: 'Committed capital spent' }, { timeout: 5000 });
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(canvas.queryByText('CO₂ avoided a year')).toBeNull();
  },
};
