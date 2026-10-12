import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';

/** The slices of table state that round-trip through the URL (and through `state`/`onStateChange`). */
export type TableUrlState = {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
};

export const defaultTableUrlState: TableUrlState = {
  pagination: { pageIndex: 0, pageSize: 10 },
  sorting: [],
  columnFilters: [],
  globalFilter: '',
};

/** Keys written under `${prefix}.`: sort, q, f.<columnId>, page, size. */
export function tableUrlKeys(prefix: string) {
  return {
    sort: `${prefix}.sort`,
    query: `${prefix}.q`,
    filter: (columnId: string) => `${prefix}.f.${columnId}`,
    filterPrefix: `${prefix}.f.`,
    page: `${prefix}.page`,
    size: `${prefix}.size`,
  };
}

/**
 * Writes `state` into a copy of `params`, dropping keys whose value equals `defaults`
 * so the URL stays clean. Keys outside the prefix are left untouched.
 */
export function encodeTableUrlState(
  params: URLSearchParams,
  prefix: string,
  state: TableUrlState,
  defaults: TableUrlState = defaultTableUrlState,
): URLSearchParams {
  const keys = tableUrlKeys(prefix);
  const next = new URLSearchParams(params);

  // Clear every key we own before writing the current state.
  for (const key of [...next.keys()]) {
    if (key === keys.sort || key === keys.query || key === keys.page || key === keys.size || key.startsWith(keys.filterPrefix)) {
      next.delete(key);
    }
  }

  const sort = state.sorting[0];
  const defaultSort = defaults.sorting[0];
  if (sort && !(defaultSort && defaultSort.id === sort.id && defaultSort.desc === sort.desc)) {
    next.set(keys.sort, `${sort.id}:${sort.desc ? 'desc' : 'asc'}`);
  }

  if (state.globalFilter && state.globalFilter !== defaults.globalFilter) {
    next.set(keys.query, state.globalFilter);
  }

  for (const filter of state.columnFilters) {
    const value = filter.value;
    if (value === undefined || value === null || value === '') continue;
    const asString = Array.isArray(value) ? value.map(String).join(',') : String(value);
    const defaultValue = defaults.columnFilters.find((item) => item.id === filter.id)?.value;
    if (defaultValue !== undefined && String(defaultValue) === asString) continue;
    next.set(keys.filter(filter.id), asString);
  }

  if (state.pagination.pageIndex !== defaults.pagination.pageIndex) {
    next.set(keys.page, String(state.pagination.pageIndex + 1));
  }
  if (state.pagination.pageSize !== defaults.pagination.pageSize) {
    next.set(keys.size, String(state.pagination.pageSize));
  }

  return next;
}

function parseInteger(value: string | null) {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

/** Reads the state for `prefix` from `params`, falling back to `defaults` for anything missing or malformed. */
export function decodeTableUrlState(
  params: URLSearchParams,
  prefix: string,
  defaults: TableUrlState = defaultTableUrlState,
): TableUrlState {
  const keys = tableUrlKeys(prefix);

  let sorting = defaults.sorting;
  const sortParam = params.get(keys.sort);
  if (sortParam) {
    const separator = sortParam.lastIndexOf(':');
    const id = separator === -1 ? sortParam : sortParam.slice(0, separator);
    const dir = separator === -1 ? 'asc' : sortParam.slice(separator + 1);
    if (id && (dir === 'asc' || dir === 'desc')) sorting = [{ id, desc: dir === 'desc' }];
  }

  const globalFilter = params.get(keys.query) ?? defaults.globalFilter;

  const columnFilters: ColumnFiltersState = [];
  const seen = new Set<string>();
  for (const [key, value] of params.entries()) {
    if (!key.startsWith(keys.filterPrefix)) continue;
    const id = key.slice(keys.filterPrefix.length);
    if (!id || seen.has(id) || value === '') continue;
    seen.add(id);
    columnFilters.push({ id, value });
  }
  for (const filter of defaults.columnFilters) {
    if (!seen.has(filter.id)) columnFilters.push(filter);
  }

  const page = parseInteger(params.get(keys.page));
  const size = parseInteger(params.get(keys.size));
  const pagination: PaginationState = {
    pageIndex: page !== undefined && page >= 1 ? page - 1 : defaults.pagination.pageIndex,
    pageSize: size !== undefined && size >= 0 ? size : defaults.pagination.pageSize,
  };

  return { pagination, sorting, columnFilters, globalFilter };
}
