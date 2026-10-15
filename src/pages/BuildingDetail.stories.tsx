import type { Meta, StoryObj } from '@storybook/react-vite';
import { portfolio } from '../fixtures/data';
import { withPageFrame } from '../stories/decorators';
import { BuildingDetail } from './BuildingDetail';

const meta = {
  title: 'Pages/BuildingDetail',
  component: BuildingDetail,
  decorators: [withPageFrame],
  parameters: { layout: 'fullscreen' },
  args: { id: portfolio.buildings[0].id },
  argTypes: {
    id: {
      description: 'The building to show. Pick one of the sample buildings.',
      control: 'select',
      options: portfolio.buildings.map((building) => building.id),
      labels: Object.fromEntries(portfolio.buildings.map((building) => [building.id, building.name])),
    },
  },
} satisfies Meta<typeof BuildingDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A building with its address, spaces, equipment, open work orders and alerts, loaded from the mock API. */
export const Default: Story = {};

/** An id that matches no building: the page shows its not-found state instead of empty sections. */
export const MissingBuilding: Story = {
  args: { id: '00000000-0000-4000-8000-000000000000' },
};

/** Every request fails: each section shows its error state with a retry. */
export const RequestsFail: Story = {
  parameters: { mockApi: { fail: true, latencyMs: 0 } },
};

/** A slow network, so the loading skeletons stay on screen long enough to review. */
export const SlowNetwork: Story = {
  parameters: { mockApi: { latencyMs: 3000 } },
};
