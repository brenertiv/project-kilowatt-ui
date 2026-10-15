import { useState } from 'react';
import Card from '@mui/material/Card';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEntityList } from 'src/api/queries';
import { fromQuery } from 'src/api/state';
import type { ListParams } from 'src/api/types';
import { actionPriorities, actionStatuses } from 'src/fixtures/data';
import { CursorPagination } from 'src/components/data/CursorPagination';
import { DateText } from 'src/components/data/DateText';
import { EntityList } from 'src/components/data/EntityList';
import { FilterBar } from 'src/components/data/FilterBar';
import { PageHeader } from 'src/components/data/PageHeader';
import { ActionPriorityChip, ActionStatusChip } from 'src/components/data/StatusChip';

const ordering = [
  { value: '-due_date', label: 'Due date, latest first' },
  { value: 'due_date', label: 'Due date, earliest first' },
  { value: 'name', label: 'Name' },
  { value: '-work_order_number', label: 'Newest work order' },
];

/**
 * The list page pattern: PageHeader, FilterBar over the list params, an
 * EntityList fed by `useEntityList` through `fromQuery`, and CursorPagination
 * writing the cursor back into the params.
 */
function WorkOrderListPage() {
  const [params, setParams] = useState<ListParams>({ page_size: 5, ordering: '-due_date' });
  const query = useEntityList('action', params);
  const state = fromQuery(query);
  const items = (query.data?.results ?? []).map((action) => ({
    id: action.id,
    primary: action.name,
    secondary: (
      <>
        #{action.work_order_number} · due <DateText value={action.due_date} />
      </>
    ),
    trailing: (
      <>
        <ActionPriorityChip priority={action.action_priority} lookup={actionPriorities} />
        <ActionStatusChip status={action.action_status} lookup={actionStatuses} />
      </>
    ),
    to: `/work-orders/${action.id}`,
  }));
  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="Work orders" description="Open and scheduled work across the portfolio." />
      <FilterBar
        params={params}
        onChange={setParams}
        searchPlaceholder="Search work orders"
        ordering={ordering}
        pageSizes={[5, 10, 25]}
      />
      <Card>
        <EntityList
          aria-label="Work orders"
          items={items}
          state={state}
          skeletonRows={params.page_size}
          empty={{ title: 'No work orders match', description: 'Try a different search.' }}
        />
      </Card>
      <CursorPagination
        page={query.data}
        noun="work orders"
        state={state}
        onCursor={(cursor) => setParams((current) => ({ ...current, cursor }))}
      />
    </div>
  );
}

const meta = {
  title: 'Patterns/ListPage',
  tags: ['!autodocs'],
  component: WorkOrderListPage,
} satisfies Meta<typeof WorkOrderListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A paged, searchable list against the mock API. Copy this wiring for any list page: params in state, the query derived from them. */
export const Default: Story = {};

/** Every request fails: the list shows its error state with a retry, and pagination stays disabled. */
export const RequestsFail: Story = {
  parameters: { mockApi: { fail: true, latencyMs: 0 } },
};

/** A slow network, so the first-load skeleton and the dimmed refetch state stay on screen long enough to review. */
export const SlowNetwork: Story = {
  parameters: { mockApi: { latencyMs: 3000 } },
};
