import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { demand } from 'src/fixtures/sampleData';
import { ChartFrame } from 'src/charts/ChartFrame';
import { TimeSeriesChart } from 'src/charts/TimeSeriesChart';

const meta = {
  title: 'Charts/ChartFrame',
  component: ChartFrame,
  // The attached .mdx page replaces the generated docs page.
  tags: ['!autodocs'],
  args: {
    title: 'Demand',
    subtitle: 'Hourly kW',
    data: demand.pair,
    legendShape: 'line',
    xKind: 'date',
    height: 260,
    loading: false,
    fetching: false,
    error: null,
    onRetry: fn(),
    children: null,
  },
  argTypes: {
    data: { control: 'object' },
    legendShape: { control: 'inline-radio', options: ['line', 'rect'] },
    xKind: { control: 'inline-radio', options: ['date', 'category'] },
    error: { control: 'text' },
    children: { control: false },
    toolbar: { control: false },
    scale: { control: false },
  },
  render: (args) => (
    <ChartFrame {...args}>
      <TimeSeriesChart data={args.data} interval="hour" unit="kW" ariaLabel="Demand by hour" />
    </ChartFrame>
  ),
} satisfies Meta<typeof ChartFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The usual frame: title, subtitle, a toggleable legend, the chart/table switch, and any chart kind as the child. */
export const Default: Story = {};

/** A legend the reader cannot click: set `toggleableLegend={false}` when every series must stay on screen. */
export const FixedLegend: Story = {
  args: { toggleableLegend: false },
};

/** The table view every frame offers, so each value is reachable without hover or color. */
export const TableView: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Table' }));
  },
};

/** First load: pass `loading` and the plot area shows a skeleton at the fixed height. */
export const Loading: Story = {
  args: { loading: true },
};

/** A refetch with data on screen: pass `fetching` and the previous chart dims until the new data lands. */
export const Refreshing: Story = {
  args: { fetching: true },
};

/** The request failed: pass `error` and `onRetry`, and the frame shows the message with a retry button. */
export const Failed: Story = {
  args: { error: 'Interval data is unavailable.' },
};

/** Every value is null: the frame shows `emptyMessage` instead of a blank plot. */
export const Empty: Story = {
  args: { data: demand.empty, emptyMessage: 'No readings for this day yet.' },
};
