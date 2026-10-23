import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Heatmap } from 'src/charts/Heatmap';
import { monthNames, monthlyUseGrid, monthlyVariance, varianceBuildings } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const months = monthNames.slice(0, 10);
const worst = monthlyVariance.reduce((max, cell) => ((cell.value ?? -Infinity) > (max.value ?? -Infinity) ? cell : max));
const busiest = monthlyUseGrid.reduce((max, cell) => (cell.value > max.value ? cell : max));

/**
 * Kilowatt's reference heatmap: amCharts 5 through `useChart`, colored from the palette.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Heatmap',
  component: Heatmap,
  tags: ['!autodocs'],
  decorators: [inCard],
  args: { rows: varianceBuildings, columns: months },
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A change from a midpoint, buildings by month: less energy than last year in `success`, more in `error`,
 * stronger the further from 0, full strength from `cap` on. Cells with no data or still loading take the
 * range-band color and say so in their tooltip.
 */
export const Diverging: Story = {
  parameters: { card: { title: 'Energy Use Against Last Year' } },
  args: {
    cells: monthlyVariance,
    unit: '%',
    cap: 15,
    sides: ['Less than 2025', 'More than 2025'],
    summary: `Most buildings used less energy than in 2025; ${worst.row} used ${worst.value}% more in ${worst.column}. 120 Wall Street has no data before April.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /used less energy/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText(/Less than 2025/)).toBeVisible();
  },
};

/** A magnitude, buildings by month: `scale="sequential"` on `chart.sequential`, light to dark, with the range in the legend. */
export const Sequential: Story = {
  parameters: { card: { title: 'Energy Use by Month' } },
  args: {
    cells: monthlyUseGrid,
    unit: 'MWh',
    scale: 'sequential',
    summary: `${busiest.row} used the most energy, ${busiest.value} MWh in ${busiest.column}; every building peaked in summer.`,
  },
};
