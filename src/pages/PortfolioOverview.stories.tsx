import type { Meta, StoryObj } from '@storybook/react-vite';
import { withPageFrame } from '../stories/decorators';
import { PortfolioOverview } from './PortfolioOverview';

const meta = {
  title: 'Pages/PortfolioOverview',
  component: PortfolioOverview,
  decorators: [withPageFrame],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PortfolioOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The portfolio landing page: counts of buildings, open alerts, open work orders and recent spend, then the building list and open alerts, from the mock API. */
export const Default: Story = {};

/** Every request fails: each section shows its error state with a retry. */
export const RequestsFail: Story = {
  parameters: { mockApi: { fail: true, latencyMs: 0 } },
};

/** A slow network, so the loading skeletons stay on screen long enough to review. */
export const SlowNetwork: Story = {
  parameters: { mockApi: { latencyMs: 3000 } },
};
