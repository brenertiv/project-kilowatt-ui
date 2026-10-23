import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const budget = 2_400_000;
const spent = 1_490_000;
const overBudget = 2_610_000;
/** The share spent, as a whole percentage: screen readers read `aria-valuenow` out as it is. */
const share = Math.round((spent / budget) * 100);

/**
 * MUI's `LinearProgress`, used as MUI documents it. Kilowatt has no wrapper: the theme's
 * departures (Foundations → MUI departures) are the only differences from stock MUI. Each
 * story shows it as a measured bar (`variant="determinate"`) with its label and value as text.
 */
const meta = {
  title: 'Feedback/LinearProgress',
  component: LinearProgress,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['LinearProgress'] },
  decorators: [(Story) => <Box sx={{ width: 360 }}>{Story()}</Box>],
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'] },
    variant: { control: 'inline-radio', options: ['determinate', 'indeterminate', 'buffer', 'query'] },
  },
} satisfies Meta<typeof LinearProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * How far a measure has come against its limit: `variant="determinate"` with `value` as a whole percentage,
 * named by its label (`aria-labelledby`), and the amounts written out beside it.
 */
export const Determinate: Story = {
  args: { variant: 'determinate', value: share, 'aria-labelledby': 'budget-label' },
  render: (args) => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography id="budget-label" variant="body2">
          Carbon budget spent
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {usd.format(spent)} of {usd.format(budget)}
        </Typography>
      </Box>
      <LinearProgress {...args} />
    </>
  ),
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Carbon budget spent' });
    await expect(bar).toHaveAttribute('aria-valuenow', String(share));
  },
};

/**
 * Past the limit: the bar is full and takes an intent (`color="error"`), and the text says by how much,
 * so the overrun doesn't rest on color. `value` stays within 0–100.
 */
export const OverLimit: Story = {
  args: { variant: 'determinate', value: 100, color: 'error', 'aria-labelledby': 'over-label', 'aria-valuetext': `${percent.format(overBudget / budget)} of budget` },
  render: (args) => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography id="over-label" variant="body2">
          Carbon budget spent
        </Typography>
        <Typography variant="body2" sx={{ color: 'error.main', fontVariantNumeric: 'tabular-nums' }}>
          {usd.format(overBudget - budget)} over
        </Typography>
      </Box>
      <LinearProgress {...args} />
    </>
  ),
};

/** Work with no known end: `variant="indeterminate"`, named for what it's waiting on. For data loading in a card, use `AsyncContent`. */
export const Indeterminate: Story = {
  args: { 'aria-label': 'Generating the GRESB report' },
};
