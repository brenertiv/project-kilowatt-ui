import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { PartitionChart } from 'src/charts/PartitionChart';
import { energyBySystem } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const whole = new Intl.NumberFormat('en-US');
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const total = (node: { value?: number; children?: { value?: number; children?: never[] }[] }): number =>
  node.children ? node.children.reduce((sum, child) => sum + total(child), 0) : (node.value ?? 0);
const all = energyBySystem.children.reduce((sum, system) => sum + total(system), 0);
const hvac = energyBySystem.children[0];
/** One system on its own: its equipment become the branches, each with its own color. */
const hvacOnly = { name: hvac.name, children: hvac.children ?? [] };

/**
 * Kilowatt's reference partition (icicle) chart: amCharts 5 through `useChart`, colored from the palette.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Partition',
  component: PartitionChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof PartitionChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A building, its systems and their equipment: the whole at the left, each level a column further right, each branch one color through its levels. Click a system to zoom into it. */
export const Building: Story = {
  parameters: { card: { title: 'Energy Use by System' } },
  args: {
    data: energyBySystem,
    unit: 'kWh',
    summary: `${energyBySystem.name} used ${whole.format(all)} kWh in September; HVAC was ${percent.format(total(hvac) / all)} of it, led by the chillers.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /used .* kWh in September/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** One level under the whole: a system's equipment, each its own branch and color. */
export const OneLevel: Story = {
  name: 'One level',
  parameters: { card: { title: 'HVAC Energy Use by Equipment' } },
  args: {
    data: hvacOnly,
    unit: 'kWh',
    height: 240,
    summary: `HVAC used ${whole.format(total(hvac))} kWh in September; the chillers were ${percent.format((hvac.children?.[0].value ?? 0) / total(hvac))} of it.`,
  },
};
