import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import type { FigureSource } from 'src/components/SourceFigure';
import { VacancyCard } from 'src/components/VacancyFigure';

const updated = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

/** A made-up figure's source, one short line each. */
const source: FigureSource = {
  source: 'Each property’s spaces and the tenant in each today',
  period: 'As of today; the page’s period doesn’t apply',
  calculation: 'The floor area of the spaces with no tenant today, as a share of the floor area of every space',
  scope: 'Every property in the current scope with floors and tenants on record',
  coverage: '3 of 4 properties have floors and tenants on record; the other 1 is left out',
  updated: updated.format(Date.UTC(2026, 10, 12)),
};

/**
 * Kilowatt's `VacancyCard`: the share of floor area vacant as a metric card, with the floor area as Leased
 * and Vacant in one bar. Each story shows it at a metric card's width.
 */
const meta = {
  title: 'Charts/Vacancy',
  component: VacancyCard,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Card', 'CardContent', 'CardHeader', 'Stack'] },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 360 }}>
        <Story />
      </Box>
    ),
  ],
  args: { area: 180000, leasedArea: 153000, spaces: 24, leasedSpaces: 21, source },
} satisfies Meta<typeof VacancyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The figure with its bar: the percent vacant opens its source, and the bar's legend names Leased and Vacant with their areas. */
export const Vacancy: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '15% vacant, view source for Vacancy' })).toBeVisible();
    await expect(canvas.getByRole('figure', { name: 'Floor Area by Lease' })).toBeVisible();
    await expect(canvas.getByText('Leased')).toBeVisible();
    await expect(canvas.getByText('Vacant')).toBeVisible();
  },
};

/** Nothing on record: `area` is 0, the figure is “—” with a note saying so, and there is no bar. */
export const Empty: Story = {
  args: { area: 0, leasedArea: 0, spaces: 0, leasedSpaces: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '—, view source for Vacancy' })).toBeVisible();
    await expect(canvas.queryByRole('figure')).toBeNull();
  },
};
