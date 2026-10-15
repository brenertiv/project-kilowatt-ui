import { useEffect, useState, type ReactNode } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';
import type { ListParams } from '../../api/types';
import { SearchIcon } from '../../icons';

/** One choice in the FilterBar's Sort menu. */
export type OrderingOption = {
  /** An `ordering` value the API accepts: a field, or `-field` for descending, e.g. `-due_date`. */
  value: string;
  /** What the reader sees, e.g. "Due date, latest first". */
  label: string;
};

export type FilterBarProps = {
  /** The current list params. The bar reads `search`, `ordering` and `page_size` from it and follows outside changes, such as a reset. */
  params: ListParams;
  /** Receives the next params. Changing a filter clears the cursor so the list restarts from the first page. Search is debounced by 250ms and trimmed. */
  onChange: (next: ListParams) => void;
  /** Placeholder for the search field: name what is searched, e.g. "Search work orders". A hint only; the field's name is `searchLabel`. */
  searchPlaceholder?: string;
  /** Visible label and accessible name for the search field, like the Sort and Rows labels. Defaults to "Search". */
  searchLabel?: string;
  /** `ordering` values the API accepts, e.g. `-due_date`. Shows a Sort menu with a "Default order" choice first. Omit to hide the menu. */
  ordering?: OrderingOption[];
  /** Page sizes to offer, e.g. `[25, 50, 100]`. Shows a Rows menu at the end of the bar; the first size is shown when `params.page_size` is unset. Omit to hide the menu. */
  pageSizes?: number[];
  /** Extra filter controls, rendered inline after the Sort menu. They must call `onChange` themselves, with `cursor: undefined`. */
  children?: ReactNode;
};

const searchDelayMs = 250;

/**
 * Search, sort and page size over the API's list params. Any change restarts the cursor. Put it above an
 * `EntityList` or list card, with `CursorPagination` below. `DataTable` has its own toolbar; use that for tables.
 *
 * @summary Search, Sort and Rows controls bound to ListParams, resetting the cursor on change.
 * @import import { FilterBar } from 'src/components/data';
 */
export function FilterBar({
  params,
  onChange,
  searchPlaceholder,
  searchLabel,
  ordering,
  pageSizes,
  children,
}: FilterBarProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(params.search ?? '');
  // Follow the params when the caller changes them, e.g. a reset, without an effect.
  const [seenSearch, setSeenSearch] = useState(params.search);
  if (params.search !== seenSearch) {
    setSeenSearch(params.search);
    setSearch(params.search ?? '');
  }

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === (params.search ?? '')) return;
    const handle = setTimeout(
      () => onChange({ ...params, search: trimmed || undefined, cursor: undefined }),
      searchDelayMs,
    );
    return () => clearTimeout(handle);
  }, [search, params, onChange]);

  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
      <TextField
        size="small"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        label={searchLabel ?? t('data.search')}
        placeholder={searchPlaceholder}
        sx={{ minWidth: 240 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      {ordering && ordering.length > 0 ? (
        <TextField
          select
          size="small"
          label={t('data.ordering')}
          value={params.ordering ?? ''}
          onChange={(event) => onChange({ ...params, ordering: event.target.value || undefined, cursor: undefined })}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{t('data.orderingNone')}</MenuItem>
          {ordering.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ) : null}
      {children}
      {pageSizes && pageSizes.length > 0 ? (
        <TextField
          select
          size="small"
          label={t('data.pageSize')}
          value={String(params.page_size ?? pageSizes[0])}
          onChange={(event) => onChange({ ...params, page_size: Number(event.target.value), cursor: undefined })}
          sx={{ minWidth: 96, ml: 'auto' }}
        >
          {pageSizes.map((size) => (
            <MenuItem key={size} value={String(size)}>
              {size}
            </MenuItem>
          ))}
        </TextField>
      ) : null}
    </Stack>
  );
}
