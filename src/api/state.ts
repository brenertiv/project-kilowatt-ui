/**
 * One async contract for every data component. Components take an
 * `AsyncState` and never a query result, so they stay prop-driven and a
 * fixture can put them in any state without a network. Pages derive the
 * state from TanStack Query with `fromQuery`.
 */

export type AsyncStatus =
  /** Not asked yet, e.g. a filter is required first. */
  | 'idle'
  /** First load, nothing to show. */
  | 'loading'
  /** Data on screen while a newer page is on its way. */
  | 'fetching'
  /** The request succeeded with nothing in it. */
  | 'empty'
  /** The request failed. */
  | 'error'
  | 'ready';

export type AsyncState = {
  status: AsyncStatus;
  /** Human-readable message for the error state. */
  error?: string;
  onRetry?: () => void;
};

export const ready: AsyncState = { status: 'ready' };

/** The slice of a TanStack Query result the adapter reads, so tests need no client. */
export type QueryLike<T> = {
  status: 'pending' | 'error' | 'success';
  fetchStatus: 'fetching' | 'paused' | 'idle';
  data: T | undefined;
  error: unknown;
  refetch: () => unknown;
};

export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const response = (error as { response?: { data?: { detail?: unknown }; status?: number } }).response;
    if (typeof response?.data?.detail === 'string') return response.data.detail;
    if (response?.status === 404) return 'Not found.';
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

/** Arrays, cursor pages and nullish data count as empty. */
export function isEmptyData(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    const results = (data as { results?: unknown }).results;
    if (Array.isArray(results)) return results.length === 0;
    const rows = (data as { data?: unknown }).data;
    if (Array.isArray(rows)) return rows.length === 0;
  }
  return false;
}

export function fromQuery<T>(
  query: QueryLike<T>,
  options: { enabled?: boolean; isEmpty?: (data: T) => boolean } = {},
): AsyncState {
  const onRetry = () => void query.refetch();
  if (options.enabled === false && query.data === undefined) return { status: 'idle' };
  if (query.status === 'error') return { status: 'error', error: errorMessage(query.error), onRetry };
  if (query.status === 'pending' || query.data === undefined) return { status: 'loading' };
  const empty = options.isEmpty ? options.isEmpty(query.data) : isEmptyData(query.data);
  if (empty) return { status: 'empty' };
  return { status: query.fetchStatus === 'fetching' ? 'fetching' : 'ready', onRetry };
}
