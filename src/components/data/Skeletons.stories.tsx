import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardSkeleton, ListSkeleton, StatSkeleton } from 'src/components/data/Skeletons';

const meta = {
  title: 'Data/Skeletons',
  component: CardSkeleton,
  subcomponents: { ListSkeleton, StatSkeleton },
  decorators: [
    (Story) => (
      // A plain div, not Box: story imports end up in the snippet agents copy.
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    lines: 3,
    title: true,
  },
  argTypes: {
    lines: { control: { type: 'number', min: 0, max: 10 } },
    title: { control: 'boolean' },
  },
} satisfies Meta<typeof CardSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stands in for a card while it loads: a title line and a few body lines. Match `lines` to the card's meta rows. */
export const Card: Story = {};

/** A card body with no heading, for a card whose title is already on screen. */
export const CardWithoutTitle: Story = {
  args: { title: false },
};

/** `ListSkeleton`: stands in for an entity list, one row per expected record. Match `rows` to the page size. */
export const List: Story = {
  render: () => <ListSkeleton rows={5} />,
};

/** `ListSkeleton` with `secondary={false}`, for lists whose rows have only a primary line. */
export const ListPrimaryOnly: Story = {
  render: () => <ListSkeleton rows={5} secondary={false} />,
};

/** `StatSkeleton`: stands in for a stat card's label, value and change. */
export const Stat: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
  render: () => <StatSkeleton />,
};
