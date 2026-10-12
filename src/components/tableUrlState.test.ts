import { describe, expect, it } from 'vitest';
import { decodeTableUrlState, defaultTableUrlState, encodeTableUrlState, type TableUrlState } from './tableUrlState';

const state: TableUrlState = {
  pagination: { pageIndex: 2, pageSize: 25 },
  sorting: [{ id: 'name', desc: true }],
  columnFilters: [{ id: 'source', value: 'Energy Star' }],
  globalFilter: 'riser, 3',
};

describe('tableUrlState', () => {
  it('round-trips through URLSearchParams', () => {
    const params = encodeTableUrlState(new URLSearchParams(), 'meters', state);
    expect(params.get('meters.sort')).toBe('name:desc');
    expect(params.get('meters.q')).toBe('riser, 3');
    expect(params.get('meters.f.source')).toBe('Energy Star');
    expect(params.get('meters.page')).toBe('3');
    expect(params.get('meters.size')).toBe('25');
    expect(decodeTableUrlState(params, 'meters')).toEqual(state);
  });

  it('drops defaults so the URL stays clean', () => {
    const params = encodeTableUrlState(new URLSearchParams(), 'meters', defaultTableUrlState);
    expect([...params.keys()]).toEqual([]);

    const custom = { ...defaultTableUrlState, pagination: { pageIndex: 0, pageSize: 50 } };
    const withDefaults = encodeTableUrlState(new URLSearchParams(), 'meters', custom, custom);
    expect([...withDefaults.keys()]).toEqual([]);
    expect(decodeTableUrlState(withDefaults, 'meters', custom)).toEqual(custom);
  });

  it('ignores unknown keys and other prefixes', () => {
    const params = new URLSearchParams('tab=energy&other.sort=foo:asc&meters.sort=channels:asc&meters.bogus=1');
    const decoded = decodeTableUrlState(params, 'meters');
    expect(decoded.sorting).toEqual([{ id: 'channels', desc: false }]);
    expect(decoded.pagination).toEqual(defaultTableUrlState.pagination);

    const encoded = encodeTableUrlState(params, 'meters', defaultTableUrlState);
    expect(encoded.get('tab')).toBe('energy');
    expect(encoded.get('other.sort')).toBe('foo:asc');
    expect(encoded.get('meters.bogus')).toBe('1');
    expect(encoded.has('meters.sort')).toBe(false);
  });

  it('falls back to defaults for malformed values', () => {
    const params = new URLSearchParams('meters.sort=name:sideways&meters.page=abc&meters.size=-4&meters.f.source=');
    expect(decodeTableUrlState(params, 'meters')).toEqual(defaultTableUrlState);
  });

  it('writes page size 0 (all rows) explicitly', () => {
    const all = { ...defaultTableUrlState, pagination: { pageIndex: 0, pageSize: 0 } };
    const params = encodeTableUrlState(new URLSearchParams(), 'meters', all);
    expect(params.get('meters.size')).toBe('0');
    expect(decodeTableUrlState(params, 'meters').pagination.pageSize).toBe(0);
  });
});
