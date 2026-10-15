import type { Meta, StoryObj } from '@storybook/react-vite';
import { withPageFrame } from 'src/stories/decorators';
import { WorkOrders } from 'src/pages/WorkOrders';

const meta = {
  title: 'Pages/WorkOrders',
  component: WorkOrders,
  decorators: [withPageFrame],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WorkOrders>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Active work orders across the portfolio, searchable, filterable by status and paged the way the API pages, from the mock API. */
export const Default: Story = {};

/** Every request fails: the page shows its error state with a retry. */
export const RequestsFail: Story = {
  parameters: { mockApi: { fail: true, latencyMs: 0 } },
};

/** A slow network, so the loading skeletons stay on screen long enough to review. */
export const SlowNetwork: Story = {
  parameters: { mockApi: { latencyMs: 3000 } },
};
