import { useState } from 'react';
import TablePagination from '@mui/material/TablePagination';

/**
 * A table's client-side pager: MUI's `TablePagination`, 10, 25 or 50 rows a page, shown only past ten rows.
 * Returns the rows on the current page and the pager to place after the table's `TableContainer`, or
 * nothing when every row fits. For a list the API pages by cursor, use Load More (Table → States).
 *
 * @summary A table's client-side pager: 10, 25 or 50 rows a page, shown past ten rows.
 * @import import { usePagedRows } from 'src/components/usePagedRows';
 */
export function usePagedRows<T>(rows: T[]) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // A page past the end (the rows shrank) falls back to the last one.
  const last = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
  const current = Math.min(page, last);
  const shown = rows.slice(current * rowsPerPage, current * rowsPerPage + rowsPerPage);
  const pager =
    rows.length > 10 ? (
      <TablePagination
        component="div"
        count={rows.length}
        page={current}
        onPageChange={(_, next) => setPage(next)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    ) : null;
  return { shown, pager };
}
