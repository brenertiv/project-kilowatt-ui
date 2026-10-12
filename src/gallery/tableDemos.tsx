import { useMemo } from 'react';
import { Button } from '@base-ui/react/button';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { fetchMetersPage, type MetersPageParams } from '../api/operations';
import { ActionsCell, LinkCell, SparklineCell } from '../components/cells';
import { defineColumns } from '../components/columns';
import { downloadCsv, toCsv } from '../components/csv';
import { DataTable, type DataTableColumn, type DataTableFeatures } from '../components/DataTable';
import { defaultTableUrlState, type TableUrlState } from '../components/tableUrlState';
import { useTableUrlState } from '../components/useTableUrlState';
import { formatCalendarDate } from '../lib/dates';
import { formatCount } from '../lib/format';
import { largeMeterInventory, meterInventory, meterSources, type EnergyStarLink, type Meter } from '../meters';
import type { Demo } from './demos';

const linkTone: Record<EnergyStarLink, string> = {
  Linked: 'positive',
  'Not linked': 'neutral',
  'Link ended': 'warning',
};

const helper = createColumnHelper<DataTableFeatures, Meter>();
const meterColumns = helper.columns([
  helper.accessor('name', { header: 'Meter', meta: { pin: 'left' }, size: 200 }),
  helper.accessor('description', { header: 'Description', size: 280 }),
  helper.accessor('sublocation', { header: 'Sublocation', size: 180 }),
  helper.accessor('source', {
    header: 'Source',
    filterFn: 'equalsString',
    size: 150,
    cell: (info) => <span className="ui-chip">{info.getValue()}</span>,
  }),
  helper.accessor('energyStarLink', {
    header: 'Energy Star',
    size: 140,
    cell: (info) => (
      <span className="ui-status" data-tone={linkTone[info.getValue()]}>
        {info.getValue()}
      </span>
    ),
  }),
  helper.accessor('linkStartDate', {
    header: 'Link start',
    size: 130,
    cell: (info) => formatCalendarDate(info.getValue() ?? ''),
    meta: { exportValue: (row) => (row.linkStartDate ? formatCalendarDate(row.linkStartDate) : '') },
  }),
  helper.accessor('utilityAccount', { header: 'Utility account', size: 150, meta: { align: 'end' } }),
  helper.accessor('channels', { header: 'Channels', size: 110, meta: { align: 'end', pin: 'right' } }),
]);

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

function MetersTableDemo() {
  return (
    <DataTable
      data={meterInventory}
      columns={meterColumns}
      label="Meters by source"
      noun="meters"
      tableId="meters-by-source"
      searchColumns={meterSearch}
      searchPlaceholder="Search meters"
      filter={sourceFilter}
      density="comfortable"
      exportFileName="meters.csv"
      getRowId={meterRowId}
    />
  );
}

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

function exportMeters(meters: Meter[], fileName: string) {
  const headers = ['Meter', 'Description', 'Sublocation', 'Source', 'Energy Star', 'Channels'];
  const rows = meters.map((meter) => [
    meter.name,
    meter.description ?? '',
    meter.sublocation,
    meter.source,
    meter.energyStarLink,
    String(meter.channels),
  ]);
  downloadCsv(fileName, toCsv(headers, rows, { bom: true }));
}

function SelectionTableDemo() {
  return (
    <DataTable
      data={meterInventory}
      columns={plainMeterColumns}
      label="Meters with selection"
      noun="meters"
      selectable
      getRowId={meterRowId}
      searchColumns={meterSearch}
      searchPlaceholder="Search meters"
      bulkActions={(selected, clear) => (
        <>
          <Button className="ui-btn" onClick={() => exportMeters(selected, 'selected-meters.csv')}>
            Export selected
          </Button>
          <Button className="ui-btn ui-btn-ghost" onClick={clear}>
            Clear
          </Button>
        </>
      )}
    />
  );
}

// ----- Expansion -----

function MeterDetails({ meter }: { meter: Meter }) {
  const entries: [string, string][] = [
    ['Id', meter.id],
    ['Source', meter.source],
    ['Sublocation', meter.sublocation],
    ['Energy Star', meter.energyStarLink],
    ['Link start', meter.linkStartDate ? formatCalendarDate(meter.linkStartDate) : '—'],
    ['Utility account', meter.utilityAccount ?? '—'],
    ['Channels', formatCount(meter.channels)],
    ['Description', meter.description ?? '—'],
  ];
  return (
    <dl className="ui-table-details" aria-label={`${meter.name} details`}>
      {entries.map(([term, value]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ExpandableTableDemo() {
  return (
    <DataTable
      data={meterInventory}
      columns={plainMeterColumns}
      label="Meters with details"
      noun="meters"
      getRowId={meterRowId}
      renderExpanded={(meter) => <MeterDetails meter={meter} />}
    />
  );
}

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

type BuildingRow = {
  id: string;
  name: string;
  status: 'Online' | 'Degraded' | 'Offline';
  utility: string;
  demandKw: number;
  loadFactor: number;
  monthlyCost: number;
  lastReading: string;
  change: number;
  trend: number[];
};

const buildingRows: BuildingRow[] = [
  {
    id: 'b-120',
    name: '120 Broadway',
    status: 'Online',
    utility: 'Con Edison',
    demandKw: 1284,
    loadFactor: 0.62,
    monthlyCost: 184200,
    lastReading: '2026-09-30',
    change: -0.034,
    trend: [1210, 1240, 1180, 1300, 1330, 1290, 1260, 1284],
  },
  {
    id: 'b-055',
    name: '55 Water St',
    status: 'Degraded',
    utility: 'Con Edison',
    demandKw: 2410,
    loadFactor: 0.71,
    monthlyCost: 311050,
    lastReading: '2026-09-29',
    change: 0.068,
    trend: [2200, 2250, 2180, 2300, 2380, 2350, 2400, 2410],
  },
  {
    id: 'b-301',
    name: '301 Mission',
    status: 'Online',
    utility: 'PG&E',
    demandKw: 960,
    loadFactor: 0.54,
    monthlyCost: 142700,
    lastReading: '2026-09-30',
    change: 0,
    trend: [980, 960, 970, 950, 940, 965, 955, 960],
  },
  {
    id: 'b-812',
    name: '812 Wacker Dr',
    status: 'Offline',
    utility: 'ComEd',
    demandKw: 1730,
    loadFactor: 0.48,
    monthlyCost: 206900,
    lastReading: '2026-09-21',
    change: 0.121,
    trend: [1500, 1480, 1520, 1600, 1650, 1690, 1710, 1730],
  },
  {
    id: 'b-900',
    name: '900 Biscayne',
    status: 'Online',
    utility: 'FPL',
    demandKw: 1105,
    loadFactor: 0.66,
    monthlyCost: 158300,
    lastReading: '2026-09-30',
    change: -0.089,
    trend: [1250, 1230, 1200, 1190, 1150, 1130, 1120, 1105],
  },
];

const statusTone = (value: unknown) => (value === 'Online' ? 'positive' : value === 'Degraded' ? 'warning' : 'negative');

const buildingHelper = createColumnHelper<DataTableFeatures, BuildingRow>();
const buildingColumns: DataTableColumn<BuildingRow>[] = [
  buildingHelper.accessor('name', {
    header: 'Building',
    cell: (info) => <LinkCell href={`/components?building=${info.row.original.id}`}>{info.getValue()}</LinkCell>,
    meta: { pin: 'left' },
  }),
  ...defineColumns<BuildingRow>([
    { id: 'status', header: 'Status', type: 'status', tone: statusTone },
    { id: 'utility', header: 'Utility', type: 'chip' },
    { id: 'demandKw', header: 'Peak demand', type: 'numeric', unit: 'kW' },
    { id: 'loadFactor', header: 'Load factor', type: 'percent' },
    { id: 'monthlyCost', header: 'Monthly cost', type: 'currency' },
    { id: 'lastReading', header: 'Last reading', type: 'date' },
    { id: 'change', header: 'vs. last month', type: 'delta', upIsGood: false },
  ]),
  buildingHelper.accessor('trend', {
    header: 'Trend',
    enableSorting: false,
    cell: (info) => <SparklineCell points={info.getValue()} label={`${info.row.original.name} demand trend`} />,
    meta: { exportValue: (row) => row.trend.join(' ') },
  }),
  buildingHelper.display({
    id: 'actions',
    header: () => <span className="ui-sr-only">Actions</span>,
    enableHiding: false,
    enableResizing: false,
    size: 48,
    cell: (info) => (
      <ActionsCell
        label={`Actions for ${info.row.original.name}`}
        items={[
          { label: 'Open building', onSelect: () => undefined },
          { label: 'Export readings', onSelect: () => undefined },
          { label: 'Archive', onSelect: () => undefined, destructive: true },
        ]}
      />
    ),
    meta: { align: 'end' },
  }),
];

export function CellRenderersDemo() {
  return (
    <DataTable
      data={buildingRows}
      columns={buildingColumns}
      label="Buildings"
      noun="buildings"
      getRowId={(row) => row.id}
      pageSizes={[10]}
      exportFileName="buildings.csv"
      columnMenu
    />
  );
}

// Rendered as elements (not called) so demos that use hooks keep their own hook order when the gallery filters.
export const tableDemos: Demo[] = [
  { id: 'data-table', title: 'Data table', group: 'Tables', render: () => <MetersTableDemo />, workbench: 'data-table/playground' },
  { id: 'server-table', title: 'Server-side table', group: 'Tables', render: () => <ServerTableDemo />, workbench: 'data-table/server-side' },
  { id: 'selection-table', title: 'Selection + bulk actions', group: 'Tables', render: () => <SelectionTableDemo />, workbench: 'data-table/playground' },
  { id: 'expandable-table', title: 'Expandable rows', group: 'Tables', render: () => <ExpandableTableDemo />, workbench: 'data-table/playground' },
  { id: 'virtualized-table', title: 'Virtualized table', group: 'Tables', render: () => <VirtualizedTableDemo />, workbench: 'data-table/virtualized' },
  { id: 'cell-renderers', title: 'Cell renderers', group: 'Tables', render: () => <CellRenderersDemo />, workbench: 'cells/playground' },
];
