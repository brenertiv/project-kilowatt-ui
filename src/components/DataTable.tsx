import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow, { tableRowClasses } from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  functionalUpdate,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
  type CellData,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type Header,
  type PaginationState,
  type Row,
  type RowData,
  type SortingState,
  type TableFeatures,
  type Updater,
} from '@tanstack/react-table';
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ColumnsIcon,
  DensityComfortableIcon,
  DensityCompactIcon,
  DownloadIcon,
  SearchIcon,
} from '../icons';
import { formatCount } from '../lib/format';
import { EmptyCell } from './cells';
import { downloadCsv, toCsv } from './csv';
import { TableEmptyRow, TableError, TableSkeleton } from './TableStates';
import { defaultTableUrlState, type TableUrlState } from './tableUrlState';
import { useTableUrlState } from './useTableUrlState';

declare module '@tanstack/table-core' {
  // Typed column metadata the DataTable understands. Declared globally so every column helper picks it up.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- type parameters must match the library declaration
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, TValue extends CellData = CellData> {
    /** Cell alignment. `end` also switches on tabular digits. */
    align?: 'start' | 'end';
    /** Pin the column to an edge of the table. */
    pin?: 'left' | 'right';
    /** Initial position when several columns declare one (lower first). */
    order?: number;
    /** Value written to CSV for this column. Falls back to the raw accessor value. */
    exportValue?: (row: TData) => string;
  }
}

/** The TanStack Table features and row models every DataTable uses. Pass it to `createColumnHelper` to type columns. */
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString },
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, text: sortFn_text },
});

/** The feature set type, for `createColumnHelper<DataTableFeatures, Row>()`. */
export type DataTableFeatures = typeof dataTableFeatures;

/** One column definition for a DataTable of `TData` rows. Build them with `defineColumns` or `createColumnHelper`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cell value type varies per column
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;

/** A single-select filter shown in the toolbar, narrowing one column to one value. */
export type DataTableFilter = {
  /** Id of the column this filter narrows. The column needs `filterFn: 'equalsString'`. */
  columnId: string;
  /** Visible label and accessible name for the select, e.g. "Source". */
  label: string;
  /** Text for the option that clears the filter, e.g. "All sources". */
  allLabel: string;
  /** The values to offer. Each is shown as written and matched exactly against the column value. */
  options: string[];
};

/** Sorting, search, column filters and pagination: the slices that can be controlled or synced to the URL. */
export type DataTableState = TableUrlState;

/** Row height. `compact` fits more rows on screen. */
export type DataTableDensity = 'comfortable' | 'compact';

/** Tuning for `virtualize`. Every field is optional. */
export type DataTableVirtualizeOptions = {
  /** Switch to virtual rows once the visible row count exceeds this. Defaults to 200. */
  threshold?: number;
  /** Estimated row height in pixels. Defaults to 53 (comfortable) or 37 (compact). Rows are measured once rendered. */
  rowHeight?: number;
  /** Height of the scroll container in pixels. Defaults to 520. */
  maxHeight?: number;
};

/** Server-mode inputs: the total and the request status the caller owns. */
export type DataTableServerOptions = {
  /** Total rows matching the current search and filters, across every page. Drives the row count and page count. */
  rowCount: number;
  /** A page request is in flight. Keeps the current rows at reduced opacity and marks the table busy. Defaults to false. */
  isFetching?: boolean;
  /** The page request failed. Shows the error state, like `error`. Defaults to false. */
  isError?: boolean;
  /** Retry handler for the error state. Takes precedence over the top-level `onRetry`. */
  onRetry?: () => void;
};

/** Props for `DataTable`. `TData` is the row type. */
export type DataTableProps<TData extends RowData> = {
  /** The rows. In client mode, every row; in server mode, the current page. Keep `data` and `columns` referentially stable between renders. */
  data: TData[];
  /** Column definitions, from `defineColumns` or `createColumnHelper<DataTableFeatures, TData>()`. */
  columns: DataTableColumn<TData>[];
  /** Accessible name for the table, e.g. "Meters". */
  label: string;
  /** Plural noun for the row count and the empty message, e.g. "meters". */
  noun: string;
  /** Column ids matched by the search box (case-insensitive substring). Omit to hide search. */
  searchColumns?: string[];
  /** Placeholder for the search box, e.g. "Search by name or id". A hint only: the box is named by `searchLabel`. */
  searchPlaceholder?: string;
  /** Accessible name for the search box, read by screen readers but not shown. Defaults to "Search {noun}". */
  searchLabel?: string;
  /** Adds a single-select filter to the toolbar. Omit for no filter. */
  filter?: DataTableFilter;
  /** Column ids rendered end-aligned with tabular digits. Prefer `meta.align: 'end'` on the column. Defaults to none. */
  numericColumns?: string[];
  /** Page size options. `0` means "All rows". The first entry is the default. Defaults to `[10, 25, 50]`. */
  pageSizes?: number[];
  /**
   * `client` sorts, filters and pages `data` in the browser; use it for small sets. `server` hands sorting,
   * filtering and paging to the caller via `state`/`onStateChange` and needs `server.rowCount`; use it for
   * portfolio-scale data. Defaults to `client`.
   */
  mode?: 'client' | 'server';
  /** Server-mode total and request status. Required for `mode="server"`; ignored in client mode except for `isFetching`, `isError` and `onRetry`. */
  server?: DataTableServerOptions;
  /** Controlled table state. Any slice you omit is managed internally. With `syncToUrl`, it only seeds the defaults. */
  state?: Partial<DataTableState>;
  /** Called with the full state after every sort, search, filter or page change. Sort, search and filter changes reset to the first page. */
  onStateChange?: (next: DataTableState) => void;
  /**
   * Persist column visibility, order, sizing, pinning and density in localStorage under `kilowatt-table:${tableId}`.
   * Also shows the Columns menu unless `columnMenu` is false. Omit for no persistence.
   */
  tableId?: string;
  /** Adds a leading checkbox column, pinned left, and a selected count in the footer. Selection is per row id, so set `getRowId`. Defaults to false. */
  selectable?: boolean;
  /** Rendered in the bar above the table while rows are selected. Receives the selected rows and a function that clears the selection. Needs `selectable`. */
  bulkActions?: (selectedRows: TData[], clear: () => void) => ReactNode;
  /** Adds a leading expand toggle; the result renders in a full-width row under the row. Omit for no expansion. */
  renderExpanded?: (row: TData) => ReactNode;
  /** Stable id for each row, used for selection, expansion and React keys. Defaults to the row index; set it whenever rows can reorder or change. */
  getRowId?: (row: TData) => string;
  /**
   * Virtualize the body for large row counts: only rows in view render, inside a fixed-height scroll container.
   * It applies to the rows on the current page, so pair it with an "All rows" page size (`0`). Defaults to false.
   */
  virtualize?: boolean | DataTableVirtualizeOptions;
  /** Initial density. Setting it shows the density toggle in the toolbar. A density saved under `tableId` wins. Defaults to `comfortable`, with no toggle. */
  density?: DataTableDensity;
  /**
   * Shows an "Export CSV" button and names the file. Client mode exports the filtered, sorted rows (all pages) of the
   * visible columns; server mode exports the rows on the current page. Omit to hide the button.
   */
  exportFileName?: string;
  /** Shows the "Columns" visibility menu, with a Reset item that restores the default layout. Defaults to true when `tableId` is set, false otherwise. */
  columnMenu?: boolean;
  /** Renders a skeleton in place of the table. Use for the first load, before any rows arrive. Defaults to false. */
  isLoading?: boolean;
  /** Renders an error state in place of the table. A string or an `Error` becomes the message. Defaults to no error. */
  error?: boolean | string | Error | null;
  /** Shows a Retry button in the error state. `server.onRetry` takes precedence when set. */
  onRetry?: () => void;
  /**
   * Sync sorting, search, filters and pagination to the URL under this prefix, so the view survives reloads and links.
   * The URL becomes the source of truth. Needs a react-router context. Omit to keep state in memory.
   */
  syncToUrl?: string;
};

const allValue = '__all__';
const defaultPageSizes = [10, 25, 50];
/** Page size the table uses when the user picks "All rows" (`pageSizes` entry `0`). */
const allRowsPageSize = Number.MAX_SAFE_INTEGER;
const selectColumnId = '__select';
const expandColumnId = '__expand';
const controlColumnIds = new Set([selectColumnId, expandColumnId]);
const minColumnSize = 64;
const resizeStep = 16;
const defaultVirtualThreshold = 200;
const defaultVirtualMaxHeight = 520;
const rowHeightByDensity: Record<DataTableDensity, number> = { comfortable: 53, compact: 37 };

type PersistedLayout = {
  columnVisibility?: ColumnVisibilityState;
  columnOrder?: ColumnOrderState;
  columnSizing?: ColumnSizingState;
  columnPinning?: ColumnPinningState;
  density?: DataTableDensity;
};

function storageKey(tableId: string) {
  return `kilowatt-table:${tableId}`;
}

function readLayout(tableId: string | undefined): PersistedLayout {
  if (!tableId) return {};
  try {
    const raw = window.localStorage.getItem(storageKey(tableId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PersistedLayout) : {};
  } catch {
    return {};
  }
}

function writeLayout(tableId: string, layout: PersistedLayout) {
  try {
    window.localStorage.setItem(storageKey(tableId), JSON.stringify(layout));
  } catch {
    // Storage may be unavailable (private mode, quota). The table still works without persistence.
  }
}

function clearLayout(tableId: string) {
  try {
    window.localStorage.removeItem(storageKey(tableId));
  } catch {
    // ignore
  }
}

/** Hidden from sight, still read by assistive technology. */
const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

const tint = (color: string) => `linear-gradient(${color}, ${color})`;

/**
 * A pinned cell is sticky and opaque, so scrolled cells pass under it. It repaints the row's hover and selected
 * tints (MUI's own TableRow values) as a background image over the paper, since an opaque cell hides the row's.
 */
function pinnedSx(edge: 'start' | 'end' | null, head: boolean): SxProps<Theme> {
  return (theme) => {
    const palette = (theme.vars ?? theme).palette;
    return {
      position: 'sticky',
      zIndex: head ? 3 : 1,
      bgcolor: 'background.paper',
      ...(edge === 'start' ? { borderRight: 1, borderRightColor: 'divider' } : {}),
      ...(edge === 'end' ? { borderLeft: 1, borderLeftColor: 'divider' } : {}),
      [`tr.${tableRowClasses.hover}:hover > &`]: { backgroundImage: tint(palette.action.hover) },
      [`tr.${tableRowClasses.selected} > &`]: { backgroundImage: tint(theme.alpha(palette.primary.main, palette.action.selectedOpacity)) },
    };
  };
}

/** The column resize handle: a transparent button on the header cell's trailing edge, showing a divider line on hover and focus. */
const resizerSx: SxProps<Theme> = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  right: 0,
  width: 9,
  m: 0,
  p: 0,
  border: 0,
  bgcolor: 'transparent',
  cursor: 'col-resize',
  touchAction: 'none',
  userSelect: 'none',
  zIndex: 1,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 8,
    bottom: 8,
    right: 4,
    width: '1px',
    bgcolor: 'divider',
    opacity: 0,
  },
  'th:hover > &::after': { opacity: 1 },
  '&:focus-visible': { outline: 'none' },
  '&:focus-visible::after, &[data-resizing]::after': { opacity: 1, width: '2px', bgcolor: 'primary.main' },
};

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === '';
}

function columnLabel<TData extends RowData>(column: Column<DataTableFeatures, TData, unknown>) {
  const header = column.columnDef.header;
  return typeof header === 'string' ? header : column.id;
}

function columnDefId<TData extends RowData>(column: DataTableColumn<TData>): string | undefined {
  if (column.id) return column.id;
  if ('accessorKey' in column && typeof column.accessorKey === 'string') return column.accessorKey;
  return typeof column.header === 'string' ? column.header : undefined;
}

function shallowEqualRecord(a: Record<string, number>, b: Record<string, number>) {
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((key) => a[key] === b[key]);
}

function toTablePagination(pagination: PaginationState): PaginationState {
  return { ...pagination, pageSize: pagination.pageSize === 0 ? allRowsPageSize : pagination.pageSize };
}

function fromTablePagination(pagination: PaginationState): PaginationState {
  return { ...pagination, pageSize: pagination.pageSize >= allRowsPageSize ? 0 : pagination.pageSize };
}

/**
 * The table for rows of records: sorting, search, a filter, paging, column controls, selection, expansion,
 * CSV export and virtualization, with loading, error and empty states built in. Use client mode for small sets
 * and server mode with controlled state for portfolio-scale data. It renders as one outlined MUI `Paper`: the
 * toolbar, an MUI `Table` and a footer with the row count and `TablePagination`, so place it on the page, not in
 * a card. For a short list of records with a primary and secondary line, use `EntityList` instead.
 *
 * @summary A sortable, filterable, paged data table with column controls and built-in states.
 * @import import { DataTable } from 'src/components/DataTable';
 */
export function DataTable<TData extends RowData>(props: DataTableProps<TData>) {
  if (props.syncToUrl) {
    return <UrlSyncedDataTable {...props} syncToUrl={props.syncToUrl} />;
  }
  return <DataTableInner {...props} />;
}

function UrlSyncedDataTable<TData extends RowData>({
  syncToUrl,
  state,
  onStateChange,
  pageSizes = defaultPageSizes,
  ...rest
}: DataTableProps<TData> & { syncToUrl: string }) {
  // The URL is the source of truth; `state` only seeds the defaults (read once) so they stay out of the URL.
  const [defaults] = useState<TableUrlState>(() => ({
    ...defaultTableUrlState,
    ...state,
    pagination: state?.pagination ?? { pageIndex: 0, pageSize: pageSizes[0] ?? defaultPageSizes[0] },
  }));
  const [urlState, setUrlState] = useTableUrlState(syncToUrl, defaults);
  return (
    <DataTableInner
      {...rest}
      pageSizes={pageSizes}
      state={urlState}
      onStateChange={(next) => {
        setUrlState(next);
        onStateChange?.(next);
      }}
    />
  );
}

function DataTableInner<TData extends RowData>({
  data,
  columns,
  label,
  noun,
  searchColumns,
  searchPlaceholder,
  searchLabel,
  filter,
  numericColumns = [],
  pageSizes = defaultPageSizes,
  mode = 'client',
  server,
  state: stateProp,
  onStateChange,
  tableId,
  selectable = false,
  bulkActions,
  renderExpanded,
  getRowId,
  virtualize,
  density: densityProp,
  exportFileName,
  columnMenu = Boolean(tableId),
  isLoading = false,
  error,
  onRetry,
}: DataTableProps<TData>) {
  const { t } = useTranslation();
  const statusId = useId();
  const isServer = mode === 'server';

  // ----- URL-able state: controlled per slice, internal otherwise -----
  const [internal, setInternal] = useState<DataTableState>(() => ({
    ...defaultTableUrlState,
    pagination: { pageIndex: 0, pageSize: pageSizes[0] ?? defaultPageSizes[0] },
  }));
  const current: DataTableState = {
    pagination: stateProp?.pagination ?? internal.pagination,
    sorting: stateProp?.sorting ?? internal.sorting,
    columnFilters: stateProp?.columnFilters ?? internal.columnFilters,
    globalFilter: stateProp?.globalFilter ?? internal.globalFilter,
  };
  const update = (patch: Partial<DataTableState>) => {
    const next = { ...current, ...patch };
    setInternal(next);
    onStateChange?.(next);
  };
  const resetPage = (pagination: PaginationState) => ({ ...pagination, pageIndex: 0 });

  // ----- Layout state persisted per tableId -----
  const [stored] = useState(() => readLayout(tableId));
  const [density, setDensity] = useState<DataTableDensity>(stored.density ?? densityProp ?? 'comfortable');

  const allColumns = useMemo<DataTableColumn<TData>[]>(() => {
    const leading: DataTableColumn<TData>[] = [];
    if (selectable) {
      leading.push({
        id: selectColumnId,
        header: ({ table }) => (
          <Checkbox
            size="small"
            slotProps={{ input: { 'aria-label': t('table.selectAll') } }}
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
            onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            size="small"
            slotProps={{ input: { 'aria-label': t('table.selectRow') } }}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={(event) => row.toggleSelected(event.target.checked)}
          />
        ),
        size: 48,
        minSize: 48,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        meta: { pin: 'left' },
      });
    }
    if (renderExpanded) {
      leading.push({
        id: expandColumnId,
        header: () => (
          <Box component="span" sx={visuallyHidden}>
            {t('table.expand')}
          </Box>
        ),
        cell: ({ row }) => (
          <IconButton
            size="small"
            aria-label={row.getIsExpanded() ? t('table.collapseRow') : t('table.expandRow')}
            aria-expanded={row.getIsExpanded()}
            onClick={row.getToggleExpandedHandler()}
          >
            {row.getIsExpanded() ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </IconButton>
        ),
        size: 48,
        minSize: 48,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        meta: { pin: 'left' },
      });
    }
    return leading.length ? [...leading, ...columns] : columns;
  }, [columns, selectable, renderExpanded, t]);

  const defaultLayout = useMemo(() => {
    const pinning: ColumnPinningState = { start: [], end: [] };
    const ordered: { id: string; order: number; index: number }[] = [];
    allColumns.forEach((column, index) => {
      const id = columnDefId(column);
      if (!id) return;
      if (column.meta?.pin === 'left') pinning.start.push(id);
      if (column.meta?.pin === 'right') pinning.end.push(id);
      ordered.push({ id, order: column.meta?.order ?? Number.POSITIVE_INFINITY, index });
    });
    const hasOrder = ordered.some((entry) => Number.isFinite(entry.order));
    const columnOrder = hasOrder
      ? ordered.sort((a, b) => a.order - b.order || a.index - b.index).map((entry) => entry.id)
      : [];
    return { pinning, columnOrder };
  }, [allColumns]);

  // ----- Table -----
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: allColumns,
    getRowId,
    initialState: {
      columnVisibility: stored.columnVisibility ?? {},
      columnOrder: stored.columnOrder ?? defaultLayout.columnOrder,
      columnSizing: stored.columnSizing ?? {},
      columnPinning: stored.columnPinning ?? defaultLayout.pinning,
    },
    state: {
      pagination: toTablePagination(current.pagination),
      sorting: current.sorting,
      columnFilters: current.columnFilters,
      globalFilter: current.globalFilter,
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      update({ pagination: fromTablePagination(functionalUpdate(updater, toTablePagination(current.pagination))) });
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      update({ sorting: functionalUpdate(updater, current.sorting), pagination: resetPage(current.pagination) });
    },
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      update({ columnFilters: functionalUpdate(updater, current.columnFilters), pagination: resetPage(current.pagination) });
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      update({ globalFilter: functionalUpdate(updater, current.globalFilter) ?? '', pagination: resetPage(current.pagination) });
    },
    manualPagination: isServer,
    manualSorting: isServer,
    manualFiltering: isServer,
    rowCount: isServer ? server?.rowCount : undefined,
    autoResetAll: false,
    globalFilterFn: 'includesString',
    getColumnCanGlobalFilter: (column) => searchColumns?.includes(column.id) ?? false,
    enableSortingRemoval: true,
    enableRowSelection: selectable,
    enableExpanding: Boolean(renderExpanded),
    getRowCanExpand: () => Boolean(renderExpanded),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    defaultColumn: { sortUndefined: 'last', minSize: minColumnSize },
  });

  const { columnVisibility, columnOrder, columnSizing, columnPinning, columnResizing } = table.state;

  useEffect(() => {
    if (!tableId) return;
    writeLayout(tableId, { columnVisibility, columnOrder, columnSizing, columnPinning, density });
  }, [tableId, columnVisibility, columnOrder, columnSizing, columnPinning, density]);

  const errorMessage = typeof error === 'string' ? error : error instanceof Error ? error.message : undefined;
  const hasError = Boolean(error) || Boolean(server?.isError);
  const retry = server?.onRetry ?? onRetry;
  // Decides the empty message: "match these filters" only makes sense when something is filtered.
  const isFiltered = current.globalFilter.trim() !== '' || current.columnFilters.length > 0;

  // ----- Measured header widths drive pinned offsets and the first resize -----
  const headRef = useRef<HTMLTableSectionElement>(null);
  const widthsRef = useRef<Record<string, number>>({});
  const [widths, setWidths] = useState<Record<string, number>>({});
  const visibleColumns = table.getVisibleLeafColumns();
  const visibleKey = visibleColumns.map((column) => column.id).join('|');
  useEffect(() => {
    const head = headRef.current;
    if (!head || typeof ResizeObserver === 'undefined') return;
    const cells = Array.from(head.querySelectorAll<HTMLTableCellElement>('th[data-column-id]'));
    const measure = () => {
      const next: Record<string, number> = {};
      for (const cell of cells) {
        const id = cell.dataset.columnId;
        if (id) next[id] = cell.getBoundingClientRect().width;
      }
      widthsRef.current = next;
      setWidths((previous) => (shallowEqualRecord(previous, next) ? previous : next));
    };
    const observer = new ResizeObserver(measure);
    cells.forEach((cell) => observer.observe(cell));
    return () => observer.disconnect();
  }, [visibleKey, density, isLoading, hasError]);

  // Auto layout until the user resizes; the first drag snapshots every visible width so nothing jumps.
  const hasSizing = Object.keys(columnSizing).length > 0;
  const startColumns = table.getStartVisibleLeafColumns();
  const endColumns = table.getEndVisibleLeafColumns();
  const pinnedOffset = (column: Column<DataTableFeatures, TData, unknown>): CSSProperties | undefined => {
    const pinned = column.getIsPinned();
    if (!pinned) return undefined;
    const group = pinned === 'start' ? startColumns : [...endColumns].reverse();
    let offset = 0;
    for (const other of group) {
      if (other.id === column.id) break;
      offset += widths[other.id] ?? other.getSize();
    }
    return pinned === 'start' ? { left: offset } : { right: offset };
  };
  const isNumeric = (column: Column<DataTableFeatures, TData, unknown>) =>
    numericColumns.includes(column.id) || column.columnDef.meta?.align === 'end';
  /** Layout for one header or body cell: pinning, digits, truncation. Colors stay MUI's. */
  const cellSx = (column: Column<DataTableFeatures, TData, unknown>, head: boolean): SxProps<Theme> => {
    const pinned = column.getIsPinned();
    const edge =
      pinned === 'start' && startColumns[startColumns.length - 1]?.id === column.id
        ? 'start'
        : pinned === 'end' && endColumns[0]?.id === column.id
          ? 'end'
          : null;
    return [
      { whiteSpace: 'nowrap' },
      isNumeric(column) && { fontVariantNumeric: 'tabular-nums' },
      hasSizing && { overflow: 'hidden', textOverflow: 'ellipsis' },
      // The resize handle is positioned against its header cell; a sticky cell already is a containing block.
      head && !pinned && !isVirtual && { position: 'relative' },
      ...(pinned ? [pinnedSx(edge, head)] : []),
    ] as SxProps<Theme>;
  };
  const sizeStyle = (column: Column<DataTableFeatures, TData, unknown>): CSSProperties | undefined => {
    if (hasSizing) return { width: column.getSize() };
    // Explicit `size` on a column def is a width hint in auto layout.
    return column.columnDef.size !== undefined ? { width: column.columnDef.size } : undefined;
  };

  /** Freeze the current rendered widths so the first drag starts from what the user sees. */
  const snapshotWidths = () => {
    const measured = widthsRef.current;
    table.setColumnSizing((old) => {
      const next = { ...old };
      for (const column of visibleColumns) {
        if (next[column.id] === undefined && measured[column.id]) next[column.id] = Math.round(measured[column.id]);
      }
      return next;
    });
  };
  const startResize = (header: Header<DataTableFeatures, TData, unknown>) => (event: PointerEvent | TouchEvent) => {
    snapshotWidths();
    header.getResizeHandler()(event.nativeEvent);
  };
  const keyboardResize = (header: Header<DataTableFeatures, TData, unknown>) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    snapshotWidths();
    const delta = event.key === 'ArrowRight' ? resizeStep : -resizeStep;
    const column = header.column;
    const min = column.columnDef.minSize ?? minColumnSize;
    const max = column.columnDef.maxSize ?? Number.POSITIVE_INFINITY;
    table.setColumnSizing((old) => ({
      ...old,
      [column.id]: Math.min(max, Math.max(min, (old[column.id] ?? widthsRef.current[column.id] ?? column.getSize()) + delta)),
    }));
  };

  // ----- Rows, paging, selection -----
  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize } = current.pagination;
  const isAllRows = pageSize === 0;
  const total = isServer ? (server?.rowCount ?? data.length) : table.getFilteredRowModel().rows.length;
  const first = total === 0 ? 0 : isAllRows ? 1 : pageIndex * pageSize + 1;
  const last = isAllRows ? total : Math.min(total, (pageIndex + 1) * pageSize);
  const pageCount = Math.max(1, table.getPageCount());
  const filterColumn = filter ? table.getColumn(filter.columnId) : undefined;
  const filterValue = (filterColumn?.getFilterValue() as string | undefined) ?? allValue;
  const leafCount = Math.max(1, visibleColumns.length);

  const selectedRows = selectable ? table.getSelectedRowModel().rows : [];
  const selectedCount = selectedRows.length;
  const clearSelection = () => table.resetRowSelection(true);

  // ----- Virtualization -----
  const virtualOptions = typeof virtualize === 'object' ? virtualize : {};
  const threshold = virtualOptions.threshold ?? defaultVirtualThreshold;
  const isVirtual = Boolean(virtualize) && rows.length > threshold;
  const rowHeight = virtualOptions.rowHeight ?? rowHeightByDensity[density];
  const maxHeight = virtualOptions.maxHeight ?? defaultVirtualMaxHeight;
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- the virtualizer's functions are read every render, never memoized
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: isVirtual ? rows.length : 0,
    enabled: isVirtual,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
    getItemKey: (index) => rows[index]?.id ?? index,
  });
  const virtualItems = isVirtual ? virtualizer.getVirtualItems() : [];
  const paddingTop = isVirtual && virtualItems.length ? virtualItems[0].start : 0;
  const paddingBottom = isVirtual && virtualItems.length ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0;

  // ----- Export -----
  const exportCsv = () => {
    if (!exportFileName) return;
    const exportColumns = visibleColumns.filter((column) => !controlColumnIds.has(column.id));
    const headers = exportColumns.map(columnLabel);
    const source = isServer ? rows : table.getSortedRowModel().rows;
    const body = source.map((row) =>
      exportColumns.map((column) => {
        const exportValue = column.columnDef.meta?.exportValue;
        if (exportValue) return exportValue(row.original);
        const value = row.getValue(column.id);
        return isEmpty(value) ? '' : String(value);
      }),
    );
    downloadCsv(exportFileName, toCsv(headers, body, { bom: true }));
  };

  const resetLayout = () => {
    table.resetColumnVisibility(true);
    table.resetColumnSizing(true);
    table.setColumnOrder(defaultLayout.columnOrder);
    table.setColumnPinning(defaultLayout.pinning);
    setDensity(densityProp ?? 'comfortable');
    if (tableId) clearLayout(tableId);
  };

  // ----- Toolbar -----
  const hideableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());
  const showDensity = densityProp !== undefined;
  const showToolbar = Boolean(searchColumns || filter || exportFileName || columnMenu || showDensity);
  const columnMenuId = useId();
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(null);
  const columnMenuOpen = columnMenuAnchor !== null;

  let toolbar: ReactNode = null;
  if (showToolbar) {
    toolbar = (
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', p: 2 }}>
        {searchColumns ? (
          <TextField
            size="small"
            type="search"
            placeholder={searchPlaceholder}
            value={current.globalFilter}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            sx={{ minWidth: 240 }}
            slotProps={{
              htmlInput: { 'aria-label': searchLabel ?? t('table.search', { noun }) },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        ) : null}
        {filter ? (
          <TextField
            select
            size="small"
            label={filter.label}
            value={filterValue}
            onChange={(event) => filterColumn?.setFilterValue(event.target.value === allValue ? undefined : event.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value={allValue}>{filter.allLabel}</MenuItem>
            {filter.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
        {columnMenu || exportFileName || showDensity ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', ml: 'auto' }}>
            {showDensity ? (
              <ToggleButtonGroup
                size="small"
                exclusive
                aria-label={t('table.density')}
                value={density}
                onChange={(_, next: unknown) => {
                  if (next === 'comfortable' || next === 'compact') setDensity(next);
                }}
              >
                <Tooltip title={t('table.comfortable')}>
                  <ToggleButton value="comfortable" aria-label={t('table.comfortable')}>
                    <DensityComfortableIcon />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title={t('table.compact')}>
                  <ToggleButton value="compact" aria-label={t('table.compact')}>
                    <DensityCompactIcon />
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            ) : null}
            {columnMenu ? (
              <>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<ColumnsIcon />}
                  aria-haspopup="menu"
                  aria-controls={columnMenuOpen ? `${columnMenuId}-menu` : undefined}
                  aria-expanded={columnMenuOpen || undefined}
                  onClick={(event) => setColumnMenuAnchor(event.currentTarget)}
                >
                  {t('table.columns')}
                </Button>
                <Menu
                  id={`${columnMenuId}-menu`}
                  anchorEl={columnMenuAnchor}
                  open={columnMenuOpen}
                  onClose={() => setColumnMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{ list: { 'aria-label': t('table.visibleColumns') } }}
                >
                  {/* MenuList needs direct children, not fragments, for keyboard focus. */}
                  {[
                    ...hideableColumns.map((column) => (
                      <MenuItem
                        key={column.id}
                        role="menuitemcheckbox"
                        aria-checked={column.getIsVisible()}
                        onClick={() => column.toggleVisibility(!column.getIsVisible())}
                      >
                        <ListItemIcon>{column.getIsVisible() ? <CheckIcon /> : null}</ListItemIcon>
                        <ListItemText>{columnLabel(column)}</ListItemText>
                      </MenuItem>
                    )),
                    <Divider key="__divider" />,
                    <MenuItem
                      key="__reset"
                      onClick={() => {
                        setColumnMenuAnchor(null);
                        resetLayout();
                      }}
                    >
                      <ListItemText inset>{t('table.reset')}</ListItemText>
                    </MenuItem>,
                  ]}
                </Menu>
              </>
            ) : null}
            {exportFileName ? (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<DownloadIcon />}
                onClick={exportCsv}
                disabled={isLoading || rows.length === 0}
              >
                {t('table.export')}
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    );
  }

  // ----- Body -----

  const renderRow = (row: Row<DataTableFeatures, TData>, virtualIndex?: number) => (
    <Fragment key={row.id}>
      <TableRow
        hover
        selected={row.getIsSelected()}
        data-index={virtualIndex}
        ref={isVirtual ? virtualizer.measureElement : undefined}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            align={isNumeric(cell.column) ? 'right' : undefined}
            padding={controlColumnIds.has(cell.column.id) ? 'checkbox' : undefined}
            sx={cellSx(cell.column, false)}
            style={{ ...sizeStyle(cell.column), ...pinnedOffset(cell.column) }}
          >
            {!cell.column.accessorFn || !isEmpty(cell.getValue()) ? (
              <table.FlexRender cell={cell} />
            ) : (
              <EmptyCell />
            )}
          </TableCell>
        ))}
      </TableRow>
      {renderExpanded && row.getIsExpanded() ? (
        <TableRow>
          <TableCell colSpan={leafCount}>{renderExpanded(row.original)}</TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  );

  const spacerRow = (height: number) => (
    <TableRow aria-hidden="true">
      <TableCell colSpan={leafCount} sx={{ p: 0, border: 0 }} style={{ height }} />
    </TableRow>
  );

  let body: ReactNode;
  if (isLoading) {
    body = <TableSkeleton columns={leafCount} />;
  } else if (hasError) {
    body = (
      <Box sx={{ p: 2 }}>
        <TableError message={errorMessage} onRetry={retry} />
      </Box>
    );
  } else {
    body = (
      <TableContainer ref={scrollRef} sx={isVirtual ? { maxHeight, overflow: 'auto' } : undefined}>
        <Table
          size={density === 'compact' ? 'small' : 'medium'}
          stickyHeader={isVirtual}
          sx={hasSizing ? { tableLayout: 'fixed', minWidth: '100%' } : undefined}
          style={hasSizing ? { width: table.getTotalSize() } : undefined}
          aria-label={label}
          aria-describedby={statusId}
          aria-busy={server?.isFetching || undefined}
          aria-rowcount={isVirtual ? rows.length : undefined}
        >
          <TableHead ref={headRef}>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const column = header.column;
                  const sorted = column.getIsSorted();
                  const canResize = column.getCanResize() && !controlColumnIds.has(column.id);
                  return (
                    <TableCell
                      key={header.id}
                      data-column-id={column.id}
                      align={isNumeric(column) ? 'right' : undefined}
                      padding={controlColumnIds.has(column.id) ? 'checkbox' : undefined}
                      sortDirection={sorted || false}
                      sx={cellSx(column, true)}
                      style={{ ...sizeStyle(column), ...pinnedOffset(column) }}
                    >
                      {column.getCanSort() ? (
                        <TableSortLabel
                          active={Boolean(sorted)}
                          direction={sorted || 'asc'}
                          onClick={column.getToggleSortingHandler()}
                          IconComponent={ArrowDownIcon}
                        >
                          <table.FlexRender header={header} />
                        </TableSortLabel>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                      {canResize ? (
                        <Box
                          component="button"
                          type="button"
                          sx={resizerSx}
                          aria-label={t('table.resize', { column: columnLabel(column) })}
                          data-resizing={column.getIsResizing() ? '' : undefined}
                          onPointerDown={startResize(header)}
                          onTouchStart={startResize(header)}
                          onKeyDown={keyboardResize(header)}
                          onDoubleClick={() => column.resetSize()}
                        />
                      ) : null}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody
            sx={{
              opacity: server?.isFetching ? 0.55 : 1,
              '@media (prefers-reduced-motion: no-preference)': { transition: 'opacity 150ms ease-out' },
            }}
          >
            {isVirtual ? (
              <>
                {paddingTop > 0 ? spacerRow(paddingTop) : null}
                {virtualItems.map((item) => renderRow(rows[item.index], item.index))}
                {paddingBottom > 0 ? spacerRow(paddingBottom) : null}
              </>
            ) : (
              rows.map((row) => renderRow(row))
            )}
            {rows.length === 0 ? (
              <TableEmptyRow colSpan={leafCount}>
                {isFiltered ? t('table.emptyFiltered', { noun }) : t('table.empty', { noun })}
              </TableEmptyRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // "All rows" is MUI's -1 rows per page; a page size outside `pageSizes` (from state or the URL) is still offered.
  const pageSizeOption = (size: number) => ({ label: size === 0 ? t('table.allRows') : formatCount(size), value: size === 0 ? -1 : size });
  const pageSizeOptions = pageSizes.map(pageSizeOption);
  if (!pageSizes.includes(pageSize)) pageSizeOptions.push(pageSizeOption(pageSize));

  return (
    <Paper
      variant="outlined"
      sx={{ position: 'relative' }}
      data-density={density}
      style={columnResizing.isResizingColumn ? { cursor: 'col-resize', userSelect: 'none' } : undefined}
    >
      {toolbar}
      {selectable && selectedCount > 0 ? (
        <Paper
          variant="outlined"
          role="region"
          aria-label={t('table.bulkActions')}
          sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, px: 2, py: 0.5, m: 2, mt: toolbar ? 0 : 2 }}
        >
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', mr: 1 }}>
            {t('table.selected', { count: formatCount(selectedCount) })}
          </Typography>
          {bulkActions?.(
            selectedRows.map((row) => row.original),
            clearSelection,
          )}
        </Paper>
      ) : null}
      {body}
      <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 2 }}>
        <Typography
          id={statusId}
          role="status"
          variant="body2"
          color="text.secondary"
          sx={{ fontVariantNumeric: 'tabular-nums', px: 2 }}
        >
          {total === 0
            ? t('table.countNone', { noun })
            : t('table.range', { first: formatCount(first), last: formatCount(last), total: formatCount(total), noun })}
          {selectable && selectedCount > 0 ? t('table.selectedSuffix', { count: formatCount(selectedCount) }) : ''}
        </Typography>
        <TablePagination
          component="div"
          count={total}
          page={Math.min(pageIndex, pageCount - 1)}
          rowsPerPage={isAllRows ? -1 : pageSize}
          rowsPerPageOptions={pageSizeOptions}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={(event) => {
            const size = Number(event.target.value);
            table.setPageSize(size <= 0 ? allRowsPageSize : size);
          }}
          labelRowsPerPage={t('table.rowsPerPage')}
          labelDisplayedRows={() => t('table.page', { page: formatCount(pageIndex + 1), pages: formatCount(pageCount) })}
          getItemAriaLabel={(type) => (type === 'next' ? t('table.nextPage') : t('table.previousPage'))}
        />
      </Stack>
    </Paper>
  );
}
