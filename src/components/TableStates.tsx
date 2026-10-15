import type { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { useTranslation } from 'react-i18next';
import { RefreshIcon } from '../icons';

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
 * A placeholder table shape shown while rows load for the first time: a grid of MUI `Skeleton` text lines, one
 * header row and `rows` body rows, separated by dividers. DataTable renders it for `isLoading`, so use it directly
 * only in a hand-built table. For loading API data in `src/components/data`, use `DataState`.
 *
 * @summary A loading skeleton shaped like a table.
 * @import import { TableSkeleton } from 'src/components/TableStates';
 */
export function TableSkeleton({ columns, rows = 8, label }: TableSkeletonProps) {
  const { t } = useTranslation();
  const count = Math.max(1, columns);
  const rowSx = {
    display: 'grid',
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
    alignItems: 'center',
    gap: 2,
    px: 2,
    py: 1.5,
    borderBottom: 1,
    borderColor: 'divider',
  } as const;
  return (
    <Box role="status" aria-busy="true" aria-label={label ?? t('table.loading')} sx={{ borderTop: 1, borderColor: 'divider' }}>
      <Box sx={rowSx}>
        {Array.from({ length: count }, (_, column) => (
          <Skeleton key={column} variant="text" width={headerWidths[column % headerWidths.length]} />
        ))}
      </Box>
      {Array.from({ length: rows }, (_, row) => (
        <Box key={row} sx={rowSx}>
          {Array.from({ length: count }, (_, column) => (
            <Skeleton key={column} variant="text" width={cellWidths[(row * 5 + column * 3) % cellWidths.length]} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

export type TableErrorProps = {
  /** What went wrong, in plain words. Defaults to "Something went wrong while loading this table." */
  message?: string;
  /** Shows a Retry button that calls this. Omit it when retrying cannot help, such as a permissions error. */
  onRetry?: () => void;
};

/**
 * The failed state for a table: an error MUI `Alert` with the message and an optional Retry button, announced as
 * an alert. DataTable renders it for `error`, so use it directly only in a hand-built table. For API data
 * components, use `DataState` or `ErrorState`.
 *
 * @summary A table's error state with an optional Retry button.
 * @import import { TableError } from 'src/components/TableStates';
 */
export function TableError({ message, onRetry }: TableErrorProps) {
  const { t } = useTranslation();
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            {t('data.retry')}
          </Button>
        ) : undefined
      }
    >
      {message ?? t('table.error')}
    </Alert>
  );
}

export type TableEmptyRowProps = {
  /** Number of columns the row spans. Set it to the table's visible column count. */
  colSpan: number;
  /** The empty message, e.g. "No meters match these filters." when filtered, or "No meters to show." */
  children: ReactNode;
};

/**
 * A single full-width MUI `TableRow` for a table with no rows to show: the message centered in the secondary text
 * color. Render it inside a `TableBody` (or `<tbody>`). DataTable renders it when nothing matches, so use it
 * directly only in a hand-built table. For an empty page or list, use `EmptyState`.
 *
 * @summary A full-width empty-state row for a table body.
 * @import import { TableEmptyRow } from 'src/components/TableStates';
 */
export function TableEmptyRow({ colSpan, children }: TableEmptyRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: 'text.secondary' }}>
        {children}
      </TableCell>
    </TableRow>
  );
}
