import { describe, expect, it, vi } from 'vitest';
import { errorMessage, fromQuery, isEmptyData, type QueryLike } from './state';

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
    expect(errorMessage(undefined)).toBe('Something went wrong.');
  });
});
