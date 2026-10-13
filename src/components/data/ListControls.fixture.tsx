import { useEffect, useState } from 'react';
import { useFixtureInput } from 'react-cosmos/client';
import Card from '@mui/material/Card';
import { setMockFailure } from '../../api/mock';
import { useEntityList } from '../../api/queries';
import { fromQuery } from '../../api/state';
import type { ListParams } from '../../api/types';
import { actionPriorities, actionStatuses } from '../../fixtures/data';
import { CursorPagination } from './CursorPagination';
import { DateText } from './DateText';
import { EntityList } from './EntityList';
import { FilterBar } from './FilterBar';
import { ActionPriorityChip, ActionStatusChip } from './StatusChip';

const ordering = [
  { value: '-due_date', label: 'Due date, latest first' },
  { value: 'due_date', label: 'Due date, earliest first' },
  { value: 'name', label: 'Name' },
  { value: '-work_order_number', label: 'Newest work order' },
];

/**
 * FilterBar and CursorPagination around a real query against the mock
 * adapter, so the fetching state, the latency and the failure switch are
 * all exercised the way a page would.
 */
function WorkOrders() {
  const [fail] = useFixtureInput('fail requests', false);
  const [params, setParams] = useState<ListParams>({ page_size: 5, ordering: '-due_date' });
  useEffect(() => {
    setMockFailure('/action/', fail);
    return () => setMockFailure('/action/', false);
  }, [fail]);
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
        <ActionPriorityChip priority={action.action_priority} lookup={actionPriorities} />{' '}
        <ActionStatusChip status={action.action_status} lookup={actionStatuses} />
      </>
    ),
  }));
  return (
    <div style={{ maxWidth: 720 }}>
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
          empty={{ title: 'No work orders match' }}
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

export default { 'Work orders': WorkOrders };
