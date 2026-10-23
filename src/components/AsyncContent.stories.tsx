import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { LineChart } from 'src/charts/LineChart';
import { AsyncContent } from 'src/components/AsyncContent';
import { dailyUse } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const series = [{ field: 'current', name: 'Energy use' }];
const summary = 'Energy use through September 2026, between about 800 and 1,300 kWh a day.';
const chart = <LineChart data={dailyUse} series={series} unit="kWh" summary={summary} />;

/**
 * Kilowatt's `AsyncContent`: the view of every `AsyncState`, in the space the data will take. Each
 * story shows it in a `Card` around a line chart, as a dashboard card ships: `height` is the chart's
 * 240px plus its 16px inset, so the card holds its size, and every other state pads itself 16px like the chart.
 */
const meta = {
  title: 'Feedback/AsyncContent',
  component: AsyncContent,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Skeleton', 'LinearProgress', 'Alert'], card: { title: 'Energy Use' } },
  decorators: [inCard],
  args: { state: { status: 'ready' }, height: 256, loadingLabel: 'Loading energy use', children: chart },
} satisfies Meta<typeof AsyncContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The data is here: `children` render as they are. */
export const Ready: Story = {
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: summary });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** First load, nothing to show yet: a skeleton holds the chart's space, named for screen readers by `loadingLabel`. */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Loading energy use' })).toBeVisible();
  },
};

/** Newer data is on its way: the data stays on screen under a thin progress bar, so the card doesn't blank out between periods. */
export const Fetching: Story = {
  args: { state: { status: 'fetching' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Loading energy use' })).toBeVisible();
    await expect(canvas.getByRole('figure', { name: summary })).toBeVisible();
  },
};

/** The request succeeded with nothing in it: say what has no data, never draw zeros. */
export const Empty: Story = {
  args: { state: { status: 'empty' }, emptyText: 'No energy use recorded for this period.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No energy use recorded for this period.')).toBeVisible();
  },
};

/** Not asked yet, because something has to be chosen first: say what to choose. */
export const Idle: Story = {
  args: { state: { status: 'idle' }, idleText: 'Choose a building to see its energy use.' },
};

/** The request failed: an error `Alert` with the message, and Retry when the state has `onRetry`. */
export const Failed: Story = {
  args: { state: { status: 'error', error: 'The energy data didn’t load.', onRetry: fn() } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('The energy data didn’t load.');
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(args.state.onRetry).toHaveBeenCalledOnce();
  },
};

/** The user's account doesn't include this data (a 403): an info `Alert`, with no Retry, since asking again won't help. */
export const Forbidden: Story = {
  args: { state: { status: 'forbidden', error: 'Your account doesn’t include Energy & ESG. Ask an administrator for access.' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Energy & ESG');
    await expect(canvas.queryByRole('button', { name: 'Retry' })).toBeNull();
  },
};
