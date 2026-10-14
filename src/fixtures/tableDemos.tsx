import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { fetchMetersPage, type MetersPageParams } from '../api/operations';
import { DataTable, type DataTableFeatures } from '../components/DataTable';
import { defaultTableUrlState, type TableUrlState } from '../components/tableUrlState';
import { useTableUrlState } from '../components/useTableUrlState';
import { largeMeterInventory, meterSources, type EnergyStarLink, type Meter } from '../meters';

const linkTone: Record<EnergyStarLink, string> = {
  Linked: 'positive',
  'Not linked': 'neutral',
  'Link ended': 'warning',
};

const helper = createColumnHelper<DataTableFeatures, Meter>();
/** Same columns without pinning or sizes, for the simpler demos. */
const plainMeterColumns = helper.columns([
  helper.accessor('name', { header: 'Meter' }),
  helper.accessor('description', { header: 'Description' }),
  helper.accessor('sublocation', { header: 'Sublocation' }),
  helper.accessor('source', {
    header: 'Source',
    filterFn: 'equalsString',
    cell: (info) => <span className="ui-chip">{info.getValue()}</span>,
  }),
  helper.accessor('energyStarLink', {
    header: 'Energy Star',
    cell: (info) => (
      <span className="ui-status" data-tone={linkTone[info.getValue()]}>
        {info.getValue()}
      </span>
    ),
  }),
  helper.accessor('channels', { header: 'Channels', meta: { align: 'end' } }),
]);

const sourceFilter = { columnId: 'source', label: 'Source', allLabel: 'All sources', options: meterSources };
const meterSearch = ['name', 'description', 'sublocation'];
const meterRowId = (meter: Meter) => meter.id;

// ----- Server-side -----

const serverDefaults: TableUrlState = { ...defaultTableUrlState, pagination: { pageIndex: 0, pageSize: 10 } };

function toMetersParams(state: TableUrlState): MetersPageParams {
  const sort = state.sorting[0];
  const source = state.columnFilters.find((item) => item.id === 'source')?.value;
  return {
    page: state.pagination.pageIndex,
    size: state.pagination.pageSize,
    sort: sort?.id,
    dir: sort ? (sort.desc ? 'desc' : 'asc') : undefined,
    q: state.globalFilter || undefined,
    source: typeof source === 'string' ? source : undefined,
  };
}

export function ServerTableDemo() {
  // The table writes its state to the URL under `meters.*`; the query reads the same URL.
  const [tableState] = useTableUrlState('meters', serverDefaults);
  const params = useMemo(() => toMetersParams(tableState), [tableState]);
  const query = useQuery({
    queryKey: ['meters', params],
    queryFn: () => fetchMetersPage(params),
    placeholderData: keepPreviousData,
  });
  const rows = query.data?.rows ?? emptyMeters;

  return (
    <DataTable
      data={rows}
      columns={plainMeterColumns}
      label="Meters (server-side)"
      noun="meters"
      mode="server"
      syncToUrl="meters"
      server={{
        rowCount: query.data?.total ?? 0,
        isFetching: query.isFetching,
        isError: query.isError,
        onRetry: () => void query.refetch(),
      }}
      isLoading={query.isPending}
      searchColumns={meterSearch}
      searchPlaceholder="Search meters"
      filter={sourceFilter}
      pageSizes={[10, 25, 50]}
      getRowId={meterRowId}
    />
  );
}

const emptyMeters: Meter[] = [];

// ----- Selection -----

// ----- Expansion -----

// ----- Virtualization -----

export function VirtualizedTableDemo() {
  return (
    <DataTable
      data={largeMeterInventory}
      columns={plainMeterColumns}
      label="All meters (virtualized)"
      noun="meters"
      getRowId={meterRowId}
      virtualize
      pageSizes={[0, 50, 100]}
      searchColumns={meterSearch}
      searchPlaceholder="Search 2,000 meters"
      filter={sourceFilter}
    />
  );
}

// ----- Cell renderers -----

