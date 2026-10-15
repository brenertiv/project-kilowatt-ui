import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ChartLegend } from 'src/charts/ChartLegend';

const meta = {
  title: 'Charts/Legend',
  component: ChartLegend,
  args: {
    items: [
      { id: 'hvac', label: 'HVAC', color: 'var(--chart-1)' },
      { id: 'lighting', label: 'Lighting', color: 'var(--chart-2)' },
      { id: 'plug', label: 'Plug load', color: 'var(--chart-3)' },
    ],
  },
  argTypes: {
    items: { control: 'object' },
    hidden: { control: false },
  },
} satisfies Meta<typeof ChartLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A static key with swatches. `ChartFrame` renders this for you; use it directly only outside a frame. */
export const Default: Story = {};

/** Toggle buttons: pass `onToggle` and `hidden`, and hidden series show as unpressed. */
export const Toggleable: Story = {
  args: { onToggle: fn(), hidden: new Set(['lighting']) },
};

/** Line keys, to match a line chart's marks. */
export const LineKeys: Story = {
  args: {
    items: [
      { id: 'today', label: 'Today', color: 'var(--chart-1)', shape: 'line' },
      { id: 'baseline', label: 'Last week', color: 'var(--chart-2)', shape: 'line' },
    ],
  },
};

/** One series renders nothing: the chart title names it. */
export const SingleItem: Story = {
  args: { items: [{ id: 'today', label: 'Today', color: 'var(--chart-1)' }] },
};
