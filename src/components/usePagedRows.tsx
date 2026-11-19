import { useState } from 'react';
import TablePagination from '@mui/material/TablePagination';

/**
 * A table's client-side pager: MUI's `TablePagination`, 10, 25 or 50 rows a page, shown only past ten rows.
 * Returns the rows on the current page and the pager to place after the table's `TableContainer`, or
 * nothing when every row fits. For a list the API pages by cursor, use Load More (Table → States).
 *
 * Pass `resetKey` when the rows can be sorted, searched or filtered: a value that names the list's sort, search and
 * filters (a string of them is enough). When it changes, paging returns to the first page, so a new order or a
 * narrower list is read from its start. Without it the page changes only when the reader changes it.
 *
 * @summary A table's client-side pager: 10, 25 or 50 rows a page, shown past ten rows.
 * @import import { usePagedRows } from 'src/components/usePagedRows';
 * @param rows Every row, in the order shown.
 * @param resetKey The list's sort, search and filters as one value; a change returns to the first page. Default none.
 */
export function usePagedRows<T>(rows: T[], resetKey?: string | number) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // A new sort, search or filter starts again from the first page: state adjusted while rendering, as React documents it.
  const [seenKey, setSeenKey] = useState(resetKey);
  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setPage(0);
  }
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
