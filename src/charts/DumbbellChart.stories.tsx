import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { DumbbellChart } from 'src/charts/DumbbellChart';
import { currentYear, emissionsLimits, strandingYears } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const compactUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' });
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const limits = [...emissionsLimits]
  .sort((a, b) => b.actual - b.limit - (a.actual - a.limit))
  .map(({ building, limit, actual, fine }) => ({ category: building, from: limit, to: actual, note: fine ? `${compactUsd.format(fine)} fine` : undefined }));
const over = emissionsLimits.filter(({ fine }) => fine > 0);
const fines = over.reduce((sum, { fine }) => sum + fine, 0);
const stranding = [...strandingYears].sort((a, b) => a.year - b.year).map(({ building, year }) => ({ category: building, from: currentYear, to: year }));

/**
 * Kilowatt's reference dumbbell chart: amCharts 5 through `useChart`, each row's reading against its reference.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Dumbbell',
  component: DumbbellChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof DumbbellChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each property's emissions limit against its actual emissions, largest overage first: rows over their limit take `error` and say the fine at their end. */
export const AgainstLimit: Story = {
  name: 'Against a limit',
  parameters: { card: { title: 'Emissions Against 2026 Limits' } },
  args: {
    rows: limits,
    fromName: 'Limit',
    toName: 'Actual',
    unit: 'tCO₂e',
    worse: 'above',
    summary: `${over.length} of ${emissionsLimits.length} properties are over their 2026 emissions limit, for ${usd.format(fines)} in fines.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /over their 2026 emissions limit/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText('Actual over limit')).toBeVisible();
  },
};

/** The time from today to each property's stranding year, soonest first: years written in full, the gap neither good nor bad in itself. The second tab of the same card as Against a limit. */
export const TimeToStranding: Story = {
  name: 'Time to stranding',
  parameters: { card: { title: 'Years Until Each Property Strands' } },
  args: {
    rows: stranding,
    fromName: 'Today',
    toName: 'Stranding year',
    unit: '',
    valueFormat: 'year',
    summary: `The first property strands in ${stranding[0].to}, ${stranding[0].to - currentYear} years from now; the last in ${stranding[stranding.length - 1].to}.`,
  },
};
