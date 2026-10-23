/**
 * One async contract for every data component. Components take an
 * `AsyncState` and never a query result, so they stay prop-driven and a
 * story can put them in any state without a network. Pages derive the
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
  /** The API refused: the user's account doesn't include this data (a module they don't have). Retrying won't help. */
  | 'forbidden'
  | 'ready';

export type AsyncState = {
  status: AsyncStatus;
  /** Human-readable message for the error and forbidden states. */
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
    const response = (error as { response?: { data?: Record<string, unknown>; status?: number } }).response;
    if (typeof response?.data?.detail === 'string') return response.data.detail;
    // A 400 names the fields it rejected: `{ from_time: ['Enter a valid date.'] }`.
    const field = response?.status === 400 ? Object.values(response.data ?? {}).find((value) => Array.isArray(value) && typeof value[0] === 'string') : undefined;
    if (Array.isArray(field)) return field[0] as string;
    if (response?.status === 404) return 'Not found.';
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

/** True when the API answered 404: the record does not exist, so retrying will not help. */
export function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (error as { response?: { status?: number } }).response?.status === 404;
}

/** True when the API answered 403: the user has no access to this data, so retrying will not help. */
export function isForbidden(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (error as { response?: { status?: number } }).response?.status === 403;
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
  if (query.status === 'error' && isForbidden(query.error)) return { status: 'forbidden', error: errorMessage(query.error, 'You don’t have access to this data.') };
  if (query.status === 'error') return { status: 'error', error: errorMessage(query.error), onRetry };
  if (query.status === 'pending' || query.data === undefined) return { status: 'loading' };
  const empty = options.isEmpty ? options.isEmpty(query.data) : isEmptyData(query.data);
  if (empty) return { status: 'empty' };
  return { status: query.fetchStatus === 'fetching' ? 'fetching' : 'ready', onRetry };
}

/** How strongly each status claims a view that several requests share, strongest first. */
const precedence: AsyncStatus[] = ['forbidden', 'error', 'idle', 'loading', 'empty', 'fetching', 'ready'];

/**
 * One state for a view built from several requests: no access or a failure in any of them wins, then
 * anything still to load, then empty, and the view is ready only when all of them are. A failure's retry
 * retries every request that failed.
 */
export function combineStates(...states: AsyncState[]): AsyncState {
  const status = precedence.find((candidate) => states.some((state) => state.status === candidate)) ?? 'ready';
  const failed = states.filter((state) => state.status === status && state.onRetry);
  const first = states.find((state) => state.status === status);
  return {
    status,
    ...(first?.error ? { error: first.error } : {}),
    ...(status === 'error' && failed.length ? { onRetry: () => failed.forEach((state) => state.onRetry!()) } : {}),
  };
}
