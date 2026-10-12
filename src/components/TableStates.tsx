import type { ReactNode } from 'react';
import { Button } from '@base-ui/react/button';
import { ErrorIcon } from '../icons';

// Deterministic widths so the skeleton reads like a table, not a stripe pattern.
const headerWidths = ['56%', '72%', '48%', '64%', '40%', '60%', '52%', '44%'];
const cellWidths = ['84%', '62%', '70%', '46%', '58%', '76%', '38%', '66%', '52%', '80%', '44%', '68%'];

export function TableSkeleton({
  columns,
  rows = 8,
  label = 'Loading table',
}: {
  /** Number of columns to block out. */
  columns: number;
  rows?: number;
  label?: string;
}) {
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

export function TableError({
  message = 'Something went wrong while loading this table.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
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

export function TableEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td className="ui-table-none" colSpan={colSpan}>
        {children}
      </td>
    </tr>
  );
}
