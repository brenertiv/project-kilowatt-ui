import { useEffect, useState, type ReactNode } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';
import type { ListParams } from '../../api/types';
import { SearchIcon } from '../../icons';

export type OrderingOption = { value: string; label: string };

export type FilterBarProps = {
  params: ListParams;
  /** Receives the next params. Changing a filter clears the cursor so the list restarts from the first page. */
  onChange: (next: ListParams) => void;
  searchPlaceholder?: string;
  /** `ordering` values the API accepts, e.g. `-due_date`. */
  ordering?: OrderingOption[];
  pageSizes?: number[];
  /** Extra filter controls, rendered inline. */
  children?: ReactNode;
};

const searchDelayMs = 250;

/** Search, sort and page size over the API's list params. Any change restarts the cursor. */
export function FilterBar({ params, onChange, searchPlaceholder, ordering, pageSizes, children }: FilterBarProps) {
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
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 4 }}>
      <TextField
        size="small"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={searchPlaceholder ?? t('data.search')}
        aria-label={searchPlaceholder ?? t('data.search')}
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
