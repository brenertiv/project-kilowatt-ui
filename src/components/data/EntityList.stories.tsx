import Card from '@mui/material/Card';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { PropertyAlert } from '../../api/types';
import { propertyAlertSets } from '../../fixtures/data';
import { RelativeTime } from './DateText';
import { EntityList } from './EntityList';
import { AlertStateChip } from './StatusChip';

const now = new Date('2026-10-13T12:00:00-04:00');

function alertItems(alerts: PropertyAlert[], linked = true) {
  return alerts.map((alert) => ({
    id: alert.id,
    primary: alert.name,
    secondary: (
      <>
        Evaluated <RelativeTime value={alert.time_evaluated} now={now} />
      </>
    ),
    trailing: <AlertStateChip alert={alert} />,
    to: linked ? `/alerts/${alert.id}` : undefined,
  }));
}

const meta = {
  title: 'Data/EntityList',
  component: EntityList,
  decorators: [
    (Story) => (
      <Card sx={{ maxWidth: 640 }}>
        <Story />
      </Card>
    ),
  ],
  args: {
    'aria-label': 'Property alerts',
    items: alertItems(propertyAlertSets.few),
    state: { status: 'ready' },
    empty: { title: 'No alerts', description: 'Every meter is reporting on schedule.' },
    dense: false,
  },
  argTypes: {
    items: { control: false },
    state: { control: 'object' },
    empty: { control: 'object' },
    dense: { control: 'boolean' },
    skeletonRows: { control: { type: 'number', min: 1, max: 25 } },
  },
} satisfies Meta<typeof EntityList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A few records, each row linking to its detail page via `to`. The usual list on a page or in a card. */
export const Default: Story = {};

/** Rows without `to` or `onClick`: plain, non-interactive rows for read-only summaries. */
export const StaticRows: Story = {
  args: { items: alertItems(propertyAlertSets.few, false) },
};

/** Rows that run a handler instead of navigating, such as opening a drawer. Clicks log in the Actions panel. */
export const ClickableRows: Story = {
  args: {
    items: alertItems(propertyAlertSets.few, false).map((item) => ({ ...item, onClick: fn() })),
  },
};

/** One row marked `selected`, for a list that drives a detail panel beside it. */
export const SelectedRow: Story = {
  args: {
    items: alertItems(propertyAlertSets.few).map((item, index) => ({ ...item, selected: index === 1 })),
  },
};

/** Dense rows, for a list inside a tight card or a side panel. */
export const Dense: Story = {
  args: { dense: true },
};

/** A single record. The list keeps its row layout rather than collapsing to a card. */
export const SingleRow: Story = {
  args: { items: alertItems(propertyAlertSets.one) },
};

/** Long names: text wraps under itself and the trailing chip drops below on narrow widths. */
export const LongContent: Story = {
  args: { items: alertItems(propertyAlertSets.long) },
};

/** First load: a list skeleton with `skeletonRows` rows. Match it to the page size. */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
};

/** Rows on screen while the next page loads: they dim and are marked busy. */
export const Refreshing: Story = {
  args: { state: { status: 'fetching' } },
};

/** The request returned no records: the `empty` copy replaces the rows. */
export const Empty: Story = {
  args: { items: [], state: { status: 'empty' } },
};

/** The request failed: the message and a retry replace the rows. */
export const Failed: Story = {
  args: { state: { status: 'error', error: 'Alerts could not be loaded.', onRetry: fn() } },
};
