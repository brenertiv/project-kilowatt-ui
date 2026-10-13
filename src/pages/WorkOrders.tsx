import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useEntityList, useLookup } from '../api/queries';
import { fromQuery } from '../api/state';
import type { ListParams, Location } from '../api/types';
import {
  ActionPriorityChip,
  ActionStatusChip,
  CursorPagination,
  DateText,
  EntityList,
  EntityName,
  FilterBar,
  PageHeader,
  RelationLink,
} from '../components/data';
import { activeActionStatuses } from './shared';

const ordering = [
  { value: 'due_date', label: 'Due date, earliest first' },
  { value: '-due_date', label: 'Due date, latest first' },
  { value: '-work_order_number', label: 'Newest first' },
  { value: 'name', label: 'Name' },
];

const activeFilter = 'active';

/** Every work order in the portfolio, searchable, sortable and paged the way the API pages. */
export function WorkOrders() {
  const [params, setParams] = useState<ListParams>({
    page_size: 10,
    ordering: 'due_date',
    action_status__in: activeActionStatuses,
  });
  const statuses = useLookup('action_status');
  const priorities = useLookup('action_priority');
  const buildings = useEntityList('location', { parent_location__isnull: true, page_size: 50 });
  const query = useEntityList('action', params);
  const state = fromQuery(query);
  const buildingById = useMemo(
    () => new Map((buildings.data?.results ?? []).map((row) => [row.id, row])),
    [buildings.data],
  );

  const statusValue =
    params.action_status__in === activeActionStatuses
      ? activeFilter
      : params.action_status
        ? String(params.action_status)
        : '';

  function setStatus(value: string) {
    const { action_status: _status, action_status__in: _in, ...rest } = params;
    void _status;
    void _in;
    if (value === activeFilter) setParams({ ...rest, action_status__in: activeActionStatuses, cursor: undefined });
    else if (value === '') setParams({ ...rest, cursor: undefined });
    else setParams({ ...rest, action_status: Number(value), cursor: undefined });
  }

  return (
    <Box component="main">
      <PageHeader title="Work orders" description="Scheduled, in progress and completed work across the portfolio." />
      <FilterBar
        params={params}
        onChange={setParams}
        searchPlaceholder="Search work orders"
        ordering={ordering}
        pageSizes={[10, 25, 50]}
      >
        <TextField
          select
          size="small"
          label="Status"
          value={statusValue}
          onChange={(event) => setStatus(event.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value={activeFilter}>Active</MenuItem>
          <MenuItem value="">All statuses</MenuItem>
          {(statuses.data ?? []).map((status) => (
            <MenuItem key={status.id} value={String(status.id)}>
              {status.name}
            </MenuItem>
          ))}
        </TextField>
      </FilterBar>
      <Card>
        <EntityList
          aria-label="Work orders"
          state={state}
          skeletonRows={params.page_size}
          empty={{ title: 'No work orders match', description: 'Try another status or clear the search.' }}
          items={(query.data?.results ?? []).map((action) => ({
            id: action.id,
            primary: <EntityName name={action.name} noun="work order" />,
            secondary: (
              <>
                #{action.work_order_number} · due <DateText value={action.due_date} /> ·{' '}
                <RelationLink<Location>
                  value={buildingById.get(action.location_id) ?? action.location_id}
                  label={(row) => row.name}
                  to={(id) => `/buildings/${id}`}
                />
              </>
            ),
            trailing: (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <ActionPriorityChip priority={action.action_priority} lookup={priorities.data} />
                <ActionStatusChip status={action.action_status} lookup={statuses.data} />
              </Box>
            ),
            to: `/work-orders/${action.id}`,
          }))}
        />
      </Card>
      <CursorPagination
        page={query.data}
        noun="work orders"
        state={state}
        onCursor={(cursor) => setParams((current) => ({ ...current, cursor }))}
      />
    </Box>
  );
}
