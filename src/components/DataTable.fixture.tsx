import { useMemo } from 'react';
import { Button } from '@base-ui/react/button';
import { createColumnHelper } from '@tanstack/react-table';
import { formatCalendarDate } from '../lib/dates';
import { meterSources, type Meter } from '../meters';
import { meters } from '../workbench/sampleData';
import { useFixtureInput, useFixtureSelect } from '../workbench/inputs';
import { ServerTableDemo, VirtualizedTableDemo } from '../gallery/tableDemos';
import { ChipCell, StatusCell } from './cells';
import { DataTable, type DataTableFeatures } from './DataTable';

const helper = createColumnHelper<DataTableFeatures, Meter>();
const columns = helper.columns([
  helper.accessor('name', { header: 'Meter', meta: { pin: 'left' } }),
  helper.accessor('description', { header: 'Description' }),
  helper.accessor('sublocation', { header: 'Sublocation' }),
  helper.accessor('source', { header: 'Source', filterFn: 'equalsString', cell: (info) => <ChipCell>{info.getValue()}</ChipCell> }),
  helper.accessor('energyStarLink', {
    header: 'Energy Star',
    cell: (info) => (
      <StatusCell tone={info.getValue() === 'Linked' ? 'positive' : info.getValue() === 'Link ended' ? 'warning' : 'neutral'}>
        {info.getValue()}
      </StatusCell>
    ),
  }),
  helper.accessor('linkStartDate', { header: 'Link start', cell: (info) => (info.getValue() ? formatCalendarDate(info.getValue()!) : null) }),
  helper.accessor('channels', { header: 'Channels', meta: { align: 'end' } }),
]);

const dataSets = ['none', 'one', 'few', 'page', 'all', 'sparse', 'long'] as const;

function Playground() {
  const [dataSet] = useFixtureSelect('data', { options: dataSets, defaultValue: 'few' });
  const [status] = useFixtureSelect('status', { options: ['ready', 'loading', 'error'] as const });
  const [selectable] = useFixtureInput('selectable', false);
  const [expandable] = useFixtureInput('expandable', false);
  const [density] = useFixtureSelect('density', { options: ['comfortable', 'compact'] as const });
  const [search] = useFixtureInput('search', true);
  const [pageSize] = useFixtureInput('page size', 10);
  const data = useMemo(() => meters[dataSet], [dataSet]);

  return (
    <DataTable
      data={data}
      columns={columns}
      label="Meters"
      noun="meters"
      searchColumns={search ? ['name', 'description', 'sublocation'] : undefined}
      searchPlaceholder="Search meters"
      filter={{ columnId: 'source', label: 'Source', allLabel: 'All sources', options: meterSources }}
      pageSizes={[pageSize, 25, 50]}
      density={density}
      selectable={selectable}
      bulkActions={(rows, clear) => (
        <>
          <Button className="ui-btn">Export {rows.length}</Button>
          <Button className="ui-btn ui-btn-ghost" onClick={clear}>
            Clear
          </Button>
        </>
      )}
      renderExpanded={expandable ? (row) => <p className="ui-description">{row.description ?? 'No description recorded.'}</p> : undefined}
      isLoading={status === 'loading'}
      error={status === 'error' ? 'Meters could not be loaded.' : null}
      onRetry={() => undefined}
    />
  );
}

export default {
  Playground,
  Loading: <DataTable data={meters.none} columns={columns} label="Meters" noun="meters" isLoading />,
  Error: <DataTable data={meters.none} columns={columns} label="Meters" noun="meters" error="Meters could not be loaded." onRetry={() => undefined} />,
  Empty: <DataTable data={meters.none} columns={columns} label="Meters" noun="meters" />,
  'Sparse values': <DataTable data={meters.sparse} columns={columns} label="Meters" noun="meters" />,
  'Long text': <DataTable data={meters.long} columns={columns} label="Meters" noun="meters" />,
  'Server-side': ServerTableDemo,
  Virtualized: VirtualizedTableDemo,
};
