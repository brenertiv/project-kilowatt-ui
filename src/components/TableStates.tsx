import type { ReactNode } from 'react';
import { Button } from '@base-ui/react/button';
import { ErrorIcon } from '../icons';

// Deterministic widths so the skeleton reads like a table, not a stripe pattern.
const headerWidths = ['56%', '72%', '48%', '64%', '40%', '60%', '52%', '44%'];
const cellWidths = ['84%', '62%', '70%', '46%', '58%', '76%', '38%', '66%', '52%', '80%', '44%', '68%'];

export type TableSkeletonProps = {
  /** Number of columns to block out. Match the table's visible column count. Values below 1 render one column. */
  columns: number;
  /** Number of body rows to block out, under one header row. Defaults to 8. */
  rows?: number;
  /** Accessible name for the loading region, e.g. "Loading meters". Defaults to "Loading table". */
  label?: string;
};

/**
 * A placeholder table shape shown while rows load for the first time. DataTable renders it for `isLoading`,
 * so use it directly only in a hand-built table. For loading API data in `src/components/data`, use `DataState`.
 *
 * @summary A loading skeleton shaped like a table.
 * @import import { TableSkeleton } from 'src/components/TableStates';
 */
export function TableSkeleton({ columns, rows = 8, label = 'Loading table' }: TableSkeletonProps) {
  const count = Math.max(1, columns);
  const style = { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };
  return (
    <div className="ui-table-skeleton" role="status" aria-busy="true" aria-label={label}>
      <div className="ui-table-skeleton-row is-header" style={style}>
        {Array.from({ length: count }, (_, column) => (
          <span key={column} className="ui-skeleton" style={{ width: headerWidths[column % headerWidths.length] }} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="ui-table-skeleton-row" style={style}>
          {Array.from({ length: count }, (_, column) => (
            <span
              key={column}
              className="ui-skeleton"
              style={{ width: cellWidths[(row * 5 + column * 3) % cellWidths.length] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export type TableErrorProps = {
  /** What went wrong, in plain words. Defaults to "Something went wrong while loading this table." */
  message?: string;
  /** Shows a Retry button that calls this. Omit it when retrying cannot help, such as a permissions error. */
  onRetry?: () => void;
};

/**
 * The failed state for a table: an icon, the message and an optional Retry button, announced as an alert.
 * DataTable renders it for `error`, so use it directly only in a hand-built table. For API data components,
 * use `DataState` or `ErrorState`.
 *
 * @summary A table's error state with an optional Retry button.
 * @import import { TableError } from 'src/components/TableStates';
 */
export function TableError({ message = 'Something went wrong while loading this table.', onRetry }: TableErrorProps) {
  return (
    <div className="ui-table-state" role="alert">
      <ErrorIcon className="ui-table-state-icon" />
      <p>{message}</p>
      {onRetry ? (
        <Button className="ui-btn" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export type TableEmptyRowProps = {
  /** Number of columns the row spans. Set it to the table's visible column count. */
  colSpan: number;
  /** The empty message, e.g. "No meters match these filters." */
  children: ReactNode;
};

/**
 * A single full-width body row for a table with no rows to show. Render it inside `<tbody>`. DataTable
 * renders it when nothing matches, so use it directly only in a hand-built table. For an empty page or
 * list, use `EmptyState`.
 *
 * @summary A full-width empty-state row for a table body.
 * @import import { TableEmptyRow } from 'src/components/TableStates';
 */
export function TableEmptyRow({ colSpan, children }: TableEmptyRowProps) {
  return (
    <tr>
      <td className="ui-table-none" colSpan={colSpan}>
        {children}
      </td>
    </tr>
  );
}
