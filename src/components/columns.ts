import { createElement } from 'react';
import type { RowData } from '@tanstack/react-table';
import { ChipCell, DateCell, DeltaCell, NumericCell, StatusCell } from './cells';
import type { DataTableColumn } from './DataTable';
import { formatCalendarDate } from '../lib/dates';
import { formatCurrency, formatDelta, formatPercent, formatUnit, type Unit } from '../lib/format';

/**
 * How a `ColumnSpec` renders its value. `text` prints the value; `numeric`, `percent` and `currency` use
 * `NumericCell` (`percent` expects a fraction, `currency` is USD); `delta` uses `DeltaCell`; `date` uses
 * `DateCell`; `status` uses `StatusCell`; `chip` uses `ChipCell`. Numeric types and `delta` align end.
 */
export type ColumnType = 'text' | 'numeric' | 'percent' | 'currency' | 'date' | 'status' | 'chip' | 'delta';

/** One column for `defineColumns`. Empty values render the table's dash whatever the type. */
export type ColumnSpec<TData extends RowData> = {
  /** Row field to read. Doubles as the column id, so use it in `searchColumns` and `filter.columnId`. */
  id: Extract<keyof TData, string>;
  /** Column heading. Also the CSV header and the name in the Columns menu. */
  header: string;
  /** Which cell renders the value, how it aligns and sorts, and how it exports. */
  type: ColumnType;
  /** Unit for `numeric` and `delta` columns. Defaults to `count` / `percent`. */
  unit?: Unit;
  /** For `delta` columns: whether an increase is the good direction. Defaults to true. */
  upIsGood?: boolean;
  /** For `status` columns: maps a cell value to a `.ui-status` tone. */
  tone?: (value: unknown) => string;
  /** Pin the column to an edge of the table. */
  pin?: 'left' | 'right';
  /** Initial width in pixels. A width hint until the user resizes a column. */
  size?: number;
  /** Set false to make the column unsortable. Defaults to sortable. */
  enableSorting?: boolean;
  /** Set false to keep the column out of the Columns menu so it cannot be hidden. Defaults to hideable. */
  enableHiding?: boolean;
};

const numericTypes = new Set<ColumnType>(['numeric', 'percent', 'currency', 'delta']);

function isMissing(value: unknown) {
  return value === undefined || value === null || value === '';
}

function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value);
}

function exportValueFor<TData extends RowData>(spec: ColumnSpec<TData>) {
  return (row: TData): string => {
    const value = (row as Record<string, unknown>)[spec.id];
    if (isMissing(value)) return '';
    switch (spec.type) {
      case 'numeric':
        return formatUnit(toNumber(value), spec.unit ?? 'count');
      case 'percent':
        return formatPercent(toNumber(value));
      case 'currency':
        return formatCurrency(toNumber(value));
      case 'delta':
        return formatDelta(toNumber(value), spec.unit ?? 'percent');
      case 'date':
        return formatCalendarDate(String(value));
      default:
        return String(value);
    }
  };
}

function cellFor<TData extends RowData>(spec: ColumnSpec<TData>): DataTableColumn<TData>['cell'] {
  switch (spec.type) {
    case 'numeric':
      return (info) => createElement(NumericCell, { value: toNumber(info.getValue()), unit: spec.unit ?? 'count' });
    case 'percent':
      return (info) => createElement(NumericCell, { value: toNumber(info.getValue()), unit: 'percent' });
    case 'currency':
      return (info) => createElement(NumericCell, { value: toNumber(info.getValue()), unit: 'USD' });
    case 'delta':
      return (info) =>
        createElement(DeltaCell, { value: toNumber(info.getValue()), unit: spec.unit ?? 'percent', upIsGood: spec.upIsGood ?? true });
    case 'date':
      return (info) => createElement(DateCell, { iso: String(info.getValue()) });
    case 'status':
      return (info) => {
        const value: unknown = info.getValue();
        return createElement(StatusCell, { tone: spec.tone?.(value) ?? 'neutral', children: String(value) });
      };
    case 'chip':
      return (info) => createElement(ChipCell, { children: String(info.getValue()) });
    default:
      return (info) => String(info.getValue());
  }
}

/**
 * Builds typed `DataTable` columns from a compact spec: the right renderer, end alignment for
 * numbers, a matching sort function, and a CSV export value that mirrors what the cell shows.
 * Use it for plain field columns. For a custom cell (a `LinkCell`, `ActionsCell`, `SparklineCell` or a
 * column filter), write that column with `createColumnHelper` and concatenate it with these.
 *
 * @summary Builds DataTable columns from a typed spec per field.
 * @import import { defineColumns, type ColumnSpec } from 'src/components/columns';
 */
export function defineColumns<TData extends RowData>(specs: ColumnSpec<TData>[]): DataTableColumn<TData>[] {
  return specs.map((spec) => {
    const numeric = numericTypes.has(spec.type);
    const column: DataTableColumn<TData> = {
      id: spec.id,
      accessorFn: (row) => (row as Record<string, unknown>)[spec.id],
      header: spec.header,
      cell: cellFor(spec),
      sortFn: numeric || spec.type === 'date' ? 'basic' : 'text',
      enableSorting: spec.enableSorting,
      enableHiding: spec.enableHiding,
      size: spec.size,
      meta: {
        align: numeric ? 'end' : 'start',
        pin: spec.pin,
        exportValue: exportValueFor(spec),
      },
    };
    return column;
  });
}
