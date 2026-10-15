import Card from '@mui/material/Card';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { propertyAlertSets } from 'src/fixtures/data';
import { DataState } from 'src/components/data/DataState';
import { EntityList } from 'src/components/data/EntityList';
import { ListSkeleton } from 'src/components/data/Skeletons';
import { AlertStateChip } from 'src/components/data/StatusChip';
import { refreshDimContrast, tokenContrast } from 'src/stories/a11y';

const items = propertyAlertSets.few.map((alert) => ({
  id: alert.id,
  primary: alert.name,
  secondary: alert.description,
  trailing: <AlertStateChip alert={alert} />,
}));

const meta = {
  title: 'Data/DataState',
  component: DataState,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <Card sx={{ maxWidth: 640 }}>
        <Story />
      </Card>
    ),
  ],
  args: {
    state: { status: 'ready' },
    skeleton: <ListSkeleton rows={5} />,
    empty: { title: 'No alerts', description: 'Every meter is reporting on schedule.' },
    children: <EntityList items={items} />,
  },
  argTypes: {
    state: { control: 'object' },
    empty: { control: 'object' },
    idle: { control: 'object' },
    errorTitle: { control: 'text' },
    skeleton: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof DataState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The request succeeded with data: the children render as they are. */
export const Ready: Story = {
  // Contrast off: white on successMain in the status chips. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
};

/** First load with nothing to show yet: the `skeleton` stands in. Pass one shaped like the content. */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
};

/** Data on screen while newer data loads: the children dim and are marked busy, so the layout never jumps. */
export const Refreshing: Story = {
  // Contrast off: the 60% dim of textSecondary and the status chips. See src/stories/a11y.ts.
  parameters: { a11y: refreshDimContrast },
  args: { state: { status: 'fetching' } },
};

/** The request succeeded with nothing in it: the `empty` copy replaces the children. */
export const Empty: Story = {
  args: { state: { status: 'empty' } },
};

/** The request failed: the message and a retry wired to `state.onRetry` replace the children. */
export const Failed: Story = {
  args: { state: { status: 'error', error: 'Server error.', onRetry: fn() } },
};

/** A failure with no `onRetry`, when retrying cannot help. Only the message shows. */
export const FailedWithoutRetry: Story = {
  args: { state: { status: 'error', error: 'You do not have access to these alerts.' } },
};

/** Not asked yet, because a required filter is unset: a prompt to pick one. Override the copy with `idle`. */
export const Idle: Story = {
  args: { state: { status: 'idle' } },
};
