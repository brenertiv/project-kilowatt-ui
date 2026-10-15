import type { Meta, StoryObj } from '@storybook/react-vite';
import { createColumnHelper } from '@tanstack/react-table';
import { fn } from 'storybook/test';
import { ServerTableDemo } from 'src/fixtures/tableDemos';
import { meters } from 'src/fixtures/sampleData';
import { formatCalendarDate } from 'src/lib/dates';
import { largeMeterInventory, meterSources, type Meter } from 'src/meters';
import { ChipCell, StatusCell } from 'src/components/cells';
import { DataTable, type DataTableFeatures } from 'src/components/DataTable';

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

const meterSearch = ['name', 'description', 'sublocation'];
const sourceFilter = { columnId: 'source', label: 'Source', allLabel: 'All sources', options: meterSources };

const meta = {
  title: 'Table/DataTable',
  component: DataTable,
  tags: ['!autodocs'],
  args: {
    data: meters.few,
    columns,
    label: 'Meters',
    noun: 'meters',
    getRowId: (meter: Meter) => meter.id,
    onRetry: fn(),
    onStateChange: fn(),
  },
  argTypes: {
    data: { control: false },
    columns: { control: false },
    getRowId: { control: false },
    bulkActions: { control: false },
    renderExpanded: { control: false },
    filter: { control: 'object' },
    state: { control: 'object' },
    server: { control: 'object' },
    mode: { control: 'inline-radio', options: ['client', 'server'] },
    density: { control: 'inline-radio', options: ['comfortable', 'compact'] },
    error: { control: 'text' },
  },
} satisfies Meta<typeof DataTable<Meter>>;

export default meta;
type Story = StoryObj<typeof DataTable<Meter>>;

/** The usual list page: a page of rows with search and a source filter in the toolbar. */
export const Default: Story = {
  args: { searchColumns: meterSearch, searchPlaceholder: 'Search meters', filter: sourceFilter },
};

/** First load, before any rows arrive: `isLoading` swaps the table for a skeleton. */
export const Loading: Story = {
  args: { data: meters.none, isLoading: true },
};

/** The request failed: pass `error` (a string becomes the message) and `onRetry` for the Retry button. */
export const Failed: Story = {
  args: { data: meters.none, error: 'Meters could not be loaded.' },
};

/** Loaded but nothing to show: the body renders a single empty-state row. */
export const Empty: Story = {
  args: { data: meters.none },
};

/** Rows with optional fields missing, to check empty cells render a dash rather than blank space. */
export const SparseValues: Story = {
  args: { data: meters.sparse },
};

/** Long names and descriptions, to check truncation and wrapping. */
export const LongText: Story = {
  args: { data: meters.long },
};

/** Client-side paging over the full inventory. `pageSizes` sets the options; the first is the default. */
export const Pagination: Story = {
  args: { data: meters.all, pageSizes: [10, 25, 50] },
};

/** `selectable` adds a checkbox column; `bulkActions` renders in the bar while rows are selected. */
export const Selection: Story = {
  args: {
    selectable: true,
    bulkActions: (rows, clear) => (
      <>
        <button type="button" className="ui-btn">
          Export {rows.length}
        </button>
        <button type="button" className="ui-btn ui-btn-ghost" onClick={clear}>
          Clear
        </button>
      </>
    ),
  },
};

/** `renderExpanded` adds an expand toggle per row and shows detail in a full-width row underneath. */
export const ExpandableRows: Story = {
  args: {
    renderExpanded: (row) => <p className="ui-description">{row.description ?? 'No description recorded.'}</p>,
  },
};

/** Setting `density` shows the density toggle; `compact` fits more rows on screen. */
export const Dense: Story = {
  args: { data: meters.page, density: 'compact' },
};

/** `columnMenu` adds the Columns menu so people can hide and show columns. */
export const ColumnVisibility: Story = {
  args: { columnMenu: true },
};

/** `exportFileName` adds an Export CSV button for the filtered, sorted rows of the visible columns. */
export const CsvExport: Story = {
  args: { exportFileName: 'meters' },
};

/** `syncToUrl` writes sorting, search, filters and paging to the URL so the view survives reloads and links. */
export const SyncToUrl: Story = {
  args: { data: meters.all, syncToUrl: 'meters', searchColumns: meterSearch, filter: sourceFilter },
};

/** Thousands of rows: `virtualize` renders only the visible rows. Use with an "All rows" page size (`0`). */
export const Virtualized: Story = {
  args: {
    data: largeMeterInventory,
    label: 'All meters',
    virtualize: true,
    pageSizes: [0, 50, 100],
    searchColumns: meterSearch,
    searchPlaceholder: 'Search 2,000 meters',
    filter: sourceFilter,
  },
};

/** `mode="server"`: the caller fetches each page from the API, reading the URL state the table writes. */
export const ServerSide: Story = {
  render: () => <ServerTableDemo />,
};
