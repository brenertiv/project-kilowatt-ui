import { describe, expect, it, vi } from 'vitest';
import { combineStates, errorMessage, fromQuery, isEmptyData, isForbidden, isNotFound, type QueryLike } from './state';

function query<T>(overrides: Partial<QueryLike<T>>): QueryLike<T> {
  return { status: 'success', fetchStatus: 'idle', data: undefined, error: null, refetch: vi.fn(), ...overrides };
}

describe('fromQuery', () => {
  it('maps the query lifecycle onto the async states', () => {
    expect(fromQuery(query({ status: 'pending', fetchStatus: 'fetching' })).status).toBe('loading');
    expect(fromQuery(query({ data: { results: [] } })).status).toBe('empty');
    expect(fromQuery(query({ data: { results: [1] } })).status).toBe('ready');
    expect(fromQuery(query({ data: { results: [1] }, fetchStatus: 'fetching' })).status).toBe('fetching');
    expect(fromQuery(query({ status: 'pending', fetchStatus: 'idle' }), { enabled: false }).status).toBe('idle');
  });

  it('carries the message and a retry on error', () => {
    const refetch = vi.fn();
    const state = fromQuery(
      query({ status: 'error', error: { response: { status: 500, data: { detail: 'Server error.' } } }, refetch }),
    );
    expect(state.status).toBe('error');
    expect(state.error).toBe('Server error.');
    state.onRetry?.();
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('tells no access from a failure, with no retry', () => {
    const state = fromQuery(query({ status: 'error', error: { response: { status: 403 } } }));
    expect(state).toEqual({ status: 'forbidden', error: 'You don’t have access to this data.' });
  });

  it('lets the caller decide what empty means', () => {
    expect(fromQuery(query({ data: { total: 0 } }), { isEmpty: (data) => data.total === 0 }).status).toBe('empty');
  });
});

describe('helpers', () => {
  it('recognises empty arrays, pages and series', () => {
    expect(isEmptyData([])).toBe(true);
    expect(isEmptyData({ results: [] })).toBe(true);
    expect(isEmptyData({ data: [], units: '', names: [] })).toBe(true);
    expect(isEmptyData({ results: [1] })).toBe(false);
    expect(isEmptyData({ id: 1 })).toBe(false);
  });

  it('reads the most specific error message available', () => {
    expect(errorMessage(new Error('Network down'))).toBe('Network down');
    expect(errorMessage({ response: { status: 404 } })).toBe('Not found.');
    expect(errorMessage({ response: { status: 400, data: { from_time: ['Enter a valid date.'] } } })).toBe('Enter a valid date.');
    expect(errorMessage(undefined)).toBe('Something went wrong.');
  });

  it('tells a missing record from other failures', () => {
    expect(isNotFound({ response: { status: 404 } })).toBe(true);
    expect(isNotFound({ response: { status: 500 } })).toBe(false);
    expect(isNotFound(new Error('Network down'))).toBe(false);
    expect(isNotFound(null)).toBe(false);
    expect(isForbidden({ response: { status: 403 } })).toBe(true);
    expect(isForbidden({ response: { status: 404 } })).toBe(false);
  });
});

describe('combineStates', () => {
  it('lets a failure win, then loading, then empty, and is ready only when every request is', () => {
    const retry = vi.fn();
    expect(combineStates({ status: 'ready' }, { status: 'error', error: 'Down.', onRetry: retry }, { status: 'loading' }).status).toBe('error');
    expect(combineStates({ status: 'ready' }, { status: 'loading' }).status).toBe('loading');
    expect(combineStates({ status: 'ready' }, { status: 'empty' }).status).toBe('empty');
    expect(combineStates({ status: 'ready' }, { status: 'fetching' }).status).toBe('fetching');
    expect(combineStates({ status: 'ready' }, { status: 'ready' }).status).toBe('ready');
    combineStates({ status: 'error', onRetry: retry }, { status: 'error', onRetry: retry }).onRetry?.();
    expect(retry).toHaveBeenCalledTimes(2);
  });
});
