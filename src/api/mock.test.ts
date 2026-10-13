import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { portfolio } from '../fixtures/data';
import { http } from './client';
import {
  applyFilters,
  applyOrdering,
  decodeCursor,
  encodeCursor,
  mockControls,
  resetMockControls,
  selectList,
  setMockFailure,
} from './mock';
import { fetchEnergyData, fetchList, fetchLookup, fetchOne } from './queries';
import type { Action, CursorPage, Location } from './types';

beforeAll(() => {
  mockControls.latencyMs = 0;
});

afterEach(() => {
  resetMockControls();
  mockControls.latencyMs = 0;
});

describe('cursor paging', () => {
  it('walks every row exactly once through next links', async () => {
    const seen: string[] = [];
    let params: Record<string, string | number> = { page_size: 7 };
    for (let guard = 0; guard < 50; guard += 1) {
      const page = await fetchList('action', params);
      seen.push(...page.results.map((row) => row.id));
      if (!page.next) {
        expect(page.results.length).toBeLessThanOrEqual(7);
        break;
      }
      const cursor = new URL(page.next, 'http://lab').searchParams.get('cursor');
      expect(cursor).toBeTruthy();
      params = { ...params, cursor: cursor! };
    }
    expect(seen).toHaveLength(portfolio.actions.length);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('round-trips the cursor and links the previous page', () => {
    expect(decodeCursor(encodeCursor(42))).toBe(42);
    expect(decodeCursor('garbage')).toBe(0);
    const second = selectList('location', { page_size: 3, cursor: encodeCursor(3) });
    expect(second.previous).toContain(`cursor=${encodeURIComponent(encodeCursor(0))}`);
    expect(second.previous).toContain('page_size=3');
  });

  it('returns everything when page_size is 0', () => {
    const page = selectList('meter', { page_size: 0 });
    expect(page.results).toHaveLength(portfolio.meters.length);
    expect(page.next).toBeNull();
  });
});

describe('filters, search and ordering', () => {
  it('honors __isnull, __in and equality, including the _id alias', () => {
    const buildings = applyFilters(portfolio.locations, { parent_location_id__isnull: true });
    expect(buildings).toHaveLength(portfolio.buildings.length);
    const open = applyFilters(portfolio.actions, { action_status__in: '1,2' });
    expect(open.every((action) => action.action_status === 1 || action.action_status === 2)).toBe(true);
    const fixed = applyFilters(portfolio.propertyAlerts, { fixed: 'true' });
    expect(fixed.every((alert) => alert.fixed)).toBe(true);
  });

  it('searches string fields and orders with a leading minus for descending', () => {
    const page = selectList('location', { search: 'broadway', page_size: 0 });
    expect(page.results.length).toBeGreaterThan(0);
    expect(page.results.every((row) => String(row.name).toLowerCase().includes('broadway'))).toBe(true);
    const sorted = applyOrdering(portfolio.actions, '-work_order_number') as Action[];
    expect(sorted[0]!.work_order_number).toBeGreaterThan(sorted[sorted.length - 1]!.work_order_number);
  });
});

describe('expansion and retrieval', () => {
  it('returns bare ids by default and objects when expanded', async () => {
    const bare = await fetchList('utility_bill', { page_size: 1 });
    expect(typeof bare.results[0]!.location).toBe('string');
    const expanded = await fetchList('utility_bill', { page_size: 1, expand: 'location,utility_bill_type' });
    const location = expanded.results[0]!.location as Location;
    expect(location.name).toBeTruthy();
    expect((expanded.results[0]!.utility_bill_type as { name: string }).name).toBe('Electricity');
  });

  it('retrieves one record by id and 404s otherwise', async () => {
    const building = portfolio.buildings[0]!;
    const row = await fetchOne('location', building.id);
    expect(row.name).toBe(building.name);
    await expect(fetchOne('location', 'missing')).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('serves lookups as plain arrays', async () => {
    const statuses = await fetchLookup('action_status');
    expect(statuses.map((status) => status.name)).toContain('Requires Attention');
  });

  it('draws a seeded hourly series for a meter', async () => {
    const meter = portfolio.meters[0]!;
    const series = await fetchEnergyData('meter', meter.id, {
      fromTime: '2026-10-06 00:00:00',
      toTime: '2026-10-06 06:00:00',
      interval: 'hour',
    });
    expect(series.data).toHaveLength(6);
    expect(series.units).toBe('kWh');
    const again = await fetchEnergyData('meter', meter.id, {
      fromTime: '2026-10-06 00:00:00',
      toTime: '2026-10-06 06:00:00',
      interval: 'hour',
    });
    expect(again).toEqual(series);
  });
});

describe('failure switch', () => {
  it('fails one path, its children, or everything', async () => {
    setMockFailure('/meter/', true);
    await expect(fetchList('meter')).rejects.toMatchObject({ response: { status: 500 } });
    await expect(fetchOne('meter', portfolio.meters[0]!.id)).rejects.toMatchObject({ response: { status: 500 } });
    await expect(fetchList('client')).resolves.toBeTruthy();
    setMockFailure('*', true);
    await expect(http.get<CursorPage<Action>>('/action/')).rejects.toThrow(/Lab mock failure/);
  });
});
