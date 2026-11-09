import CardContent from '@mui/material/CardContent';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ComparisonBars } from 'src/components/ComparisonBars';
import { inCard } from 'src/stories/decorators';

/**
 * Kilowatt's `ComparisonBars`: a few figures as labelled bars, the one that is the point in the first series color and
 * its baseline in `chart.neutral`. Each story shows it in a `Card`, under `CardContent`, as it ships.
 */
const meta = {
  title: 'Charts/Comparison bars',
  component: ComparisonBars,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Box', 'Stack', 'Typography'] },
  decorators: [
    (Story) => (
      <CardContent sx={{ pt: 0 }}>
        <Story />
      </CardContent>
    ),
    inCard,
  ],
  args: { unit: 'kWh', label: 'Electricity use, this period and a year earlier' },
} satisfies Meta<typeof ComparisonBars>;

export default meta;
type Story = StoryObj<typeof meta>;

/** This period against the same months a year earlier: the period that is the point in the first series color, the baseline neutral. */
export const AgainstLastYear: Story = {
  parameters: { card: { title: 'Electricity Use' } },
  args: {
    rows: [
      { label: 'Jan–Jun 2026', value: 412_300 },
      { label: 'Jan–Jun 2025', value: 455_800, neutral: true },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('list', { name: 'Electricity use, this period and a year earlier' })).toBeVisible();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    await expect(canvas.getByText('455,800 kWh')).toBeVisible();
  },
};

/** A period with no figure draws an outline in its color and says No data, so a missing year never reads as zero. */
export const NoData: Story = {
  parameters: { card: { title: 'Electricity Use' } },
  args: {
    rows: [
      { label: 'Jan–Jun 2026', value: 412_300 },
      { label: 'Jan–Jun 2025', neutral: true },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No data')).toBeVisible();
  },
};
