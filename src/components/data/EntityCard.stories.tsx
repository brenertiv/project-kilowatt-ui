import Button from '@mui/material/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Action, Location } from 'src/api/types';
import { actionPriorities, actionSets, actionStatuses, portfolio } from 'src/fixtures/data';
import { DateRangeText, DateText } from 'src/components/data/DateText';
import { EntityCard } from 'src/components/data/EntityCard';
import { RelationLink } from 'src/components/data/RelationLink';
import { ActionPriorityChip, ActionStatusChip } from 'src/components/data/StatusChip';

/** The card props a work order page builds from one `Action` record. */
function workOrder(action: Action) {
  return {
    title: action.name,
    noun: 'work order',
    subtitle: action.description || undefined,
    to: `/work-orders/${action.id}`,
    status: (
      <>
        <ActionStatusChip status={action.action_status} lookup={actionStatuses} />
        <ActionPriorityChip priority={action.action_priority} lookup={actionPriorities} />
      </>
    ),
    meta: [
      { label: 'Work order', value: `#${action.work_order_number}` },
      {
        label: 'Building',
        value: (
          <RelationLink<Location>
            value={portfolio.locations.find((row) => row.id === action.location_id) ?? action.location_id}
            label={(row) => row.name}
            to={(id) => `/buildings/${id}`}
          />
        ),
      },
      {
        label: 'Equipment',
        value: (
          <RelationLink
            value={action.equipment}
            label={(row: { id: string; name: string }) => row.name}
            to={(id) => `/equipment/${id}`}
          />
        ),
      },
      { label: 'Scheduled', value: <DateRangeText range={action.schedule_date} /> },
      { label: 'Due', value: <DateText value={action.due_date} /> },
    ],
  };
}

const meta = {
  title: 'Data/EntityCard',
  component: EntityCard,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      // A plain div, not Box: story imports end up in the snippet agents copy.
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    ...workOrder(actionSets.one[0]!),
    actions: (
      <>
        <Button size="small" variant="outlined" color="inherit">
          Assign
        </Button>
        <Button size="small" variant="contained">
          Start
        </Button>
      </>
    ),
    state: { status: 'ready' },
  },
  argTypes: {
    title: { control: 'text' },
    noun: { control: 'text' },
    subtitle: { control: 'text' },
    to: { control: 'text' },
    state: { control: 'object' },
    status: { control: false },
    meta: { control: false },
    actions: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof EntityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A work order with status chips, label and value pairs, a linked title and actions. The usual record card. */
export const Default: Story = {};

/** No `actions`: a read-only summary card. */
export const WithoutActions: Story = {
  args: { actions: undefined },
};

/** No `to`: the title is plain text, for a card that is already the detail view. */
export const PlainTitle: Story = {
  args: { to: undefined },
};

/** Optional fields missing: relations and dates show the no-value dash, and the subtitle is left out. */
export const SparseRecord: Story = {
  args: workOrder(actionSets.sparse[0]!),
};

/** A long name and description: both wrap, and the status chips drop below the title on narrow widths. */
export const LongContent: Story = {
  args: workOrder(actionSets.long[0]!),
};

/** A placeholder name from the live API (`0`, `???`): shown as "Unnamed work order" with the raw value on hover. */
export const PlaceholderName: Story = {
  args: workOrder(actionSets.placeholder[0]!),
};

/** First load: a card skeleton with one line per meta row. */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
};

/** Data on screen while newer data loads: the card body dims and is marked busy. */
export const Refreshing: Story = {
  args: { state: { status: 'fetching' } },
};

/** The request failed: the card shows the message and a retry wired to `state.onRetry`. */
export const Failed: Story = {
  args: { state: { status: 'error', error: 'Work order could not be loaded.', onRetry: fn() } },
};
