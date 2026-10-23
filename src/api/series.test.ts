import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { actionStatuses, portfolio } from '../fixtures/data';
import { mockControls, resetMockControls } from './mock';
import { fetchActionCount, fetchLocationData, fetchScoreAverage, fetchScores } from './queries';
import { errorMessage } from './state';
import type { GroupedCount, LocationScorePoint, ScorePoint } from './types';

/**
 * The score, count and location-data routes, checked against the envelopes the live API returned
 * (October 2026): field names, value ranges, the previous window, and the chart states the sample data draws.
 */

beforeAll(() => {
  mockControls.latencyMs = 0;
});

afterEach(() => {
  resetMockControls();
  mockControls.latencyMs = 0;
});

const building = (name: string) => portfolio.buildings.find((candidate) => candidate.name === name)!;
const client = portfolio.clients.find((candidate) => !candidate.tenant)!;
const window = { from_time: '2026-09-01', to_time: '2026-10-15' };

describe('scores', () => {
  it('averages a window, with the same-length window before it, as the API does', async () => {
    const average = await fetchScoreAverage('action', 'all', window);
    expect(Object.keys(average).sort()).toEqual(
      ['location_scores', 'previous_from_time', 'previous_location_scores', 'previous_score', 'previous_to_time', 'score'].sort(),
    );
    // 1 September to 15 October is 45 days, so the window before runs 18 July to 31 August.
    expect(average.previous_from_time).toBe('2026-07-18');
    expect(average.previous_to_time).toBe('2026-08-31');
    expect(average.score).toBeGreaterThan(0);
    expect(average.score).toBeLessThanOrEqual(1);
    expect(average.location_scores).toHaveLength(portfolio.buildings.length);
  });

  it('serves one row per day aggregated, and one per location per day otherwise', async () => {
    const params = { from_time: '2026-10-11', to_time: '2026-10-13' };
    const daily = (await fetchScores('action', 'all', { ...params, aggregate: true })) as ScorePoint[];
    expect(daily.map(({ timestamp }) => timestamp)).toEqual(['2026-10-11', '2026-10-12', '2026-10-13']);
    const rows = (await fetchScores('action', { client: client.id }, params)) as LocationScorePoint[];
    expect(rows).toHaveLength(3 * portfolio.buildings.length);
    expect(Object.keys(rows[0]!).sort()).toEqual(['location_id', 'score', 'timestamp']);
  });

  it('draws a dip into poor and a recovery, and no score where a building has none', async () => {
    const park = building('350 Park Avenue');
    const days = (await fetchScores('action', { location: park.id }, { from_time: '2026-08-15', to_time: '2026-10-13', aggregate: true })) as ScorePoint[];
    const scores = days.map(({ score }) => score!);
    expect(Math.min(...scores)).toBeLessThan(0.5);
    expect(scores[scores.length - 1]).toBeGreaterThan(0.6);
    const retail = building('1000 Darrell Waltrip Drive');
    const billing = await fetchScoreAverage('tenant_billing', { location: retail.id }, window);
    expect(billing.score).toBeNull();
    expect(billing.location_scores).toEqual([]);
  });

  it('rejects a missing date with the field error the API sends', async () => {
    const failure = await fetchScoreAverage('action', 'all', { from_time: '20260901', to_time: '2026-10-15' }).catch((error: unknown) => error);
    expect(errorMessage(failure)).toBe('Enter a valid date.');
  });
});

describe('work-order counts', () => {
  it('counts every match, or one row per value of group_by', async () => {
    expect(await fetchActionCount('all')).toEqual({ count: portfolio.actions.length });
    const byStatus = (await fetchActionCount('all', { group_by: 'action_status_id' })) as GroupedCount[];
    expect(byStatus.reduce((sum, row) => sum + row.count, 0)).toBe(portfolio.actions.length);
    expect(byStatus.map((row) => row.action_status_id)).toEqual(actionStatuses.map(({ id }) => id).sort((a, b) => a - b));
  });

  it('applies the work-order filters and the scope, ranges included', async () => {
    const park = building('350 Park Avenue');
    const atPark = await fetchActionCount({ location: park.id });
    expect(atPark).toEqual({ count: portfolio.actions.filter((action) => action.location_id === park.id).length });
    const due = await fetchActionCount('all', { due_date__lt: '2026-10-13' });
    expect(due).toEqual({ count: portfolio.actions.filter((action) => action.due_date !== null && action.due_date < '2026-10-13').length });
  });
});

describe('location data', () => {
  const params = { series: 'energy', interval: 'month', fromTime: '2026-01-01', toTime: '2026-10-31' } as const;

  it('serves the API envelope, one location per building of a client', async () => {
    const data = await fetchLocationData({ client: client.id }, params);
    expect(data.series__in).toEqual(['energy']);
    expect(data.locations).toHaveLength(portfolio.buildings.length);
    const point = data.locations[0]!.points[0]!;
    expect(Object.keys(point).sort()).toEqual(
      ['coverage', 'data_provenance', 'data_status', 'is_interpolated', 'point_key', 'source', 'ts', 'unit', 'value'].sort(),
    );
    expect(point.ts).toBe('2026-01-01T00:00:00');
    expect(point.unit).toBe('kBtu');
  });

  it('marks the current month partial, and leaves out months with no data', async () => {
    const water = (await fetchLocationData({ location: building('55 Water Street').id }, params)).locations[0]!;
    expect(water.data_range.first_ts).toBe('2026-04-01T00:00:00');
    const last = water.points[water.points.length - 1]!;
    expect(last.data_status).toBe('Partial');
    expect(last.coverage).toBeLessThan(1);
    const times = (await fetchLocationData({ location: building('4 Times Square').id }, params)).locations[0]!;
    expect(times.points.map(({ ts }) => ts)).not.toContain('2026-02-01T00:00:00');
  });

  it('fetches several series at once into series_data', async () => {
    const data = await fetchLocationData({ location: building('120 Broadway').id }, { ...params, series__in: 'electricity,natural_gas' });
    const location = data.locations[0]!;
    expect(Object.keys(location.series_data)).toEqual(['electricity', 'natural_gas']);
    expect(location.series_data.natural_gas!.unit).toBe('therms');
  });

  it('answers 404 for a scope that does not exist', async () => {
    const failure = await fetchLocationData({ location: 'missing' }, params).catch((error: unknown) => error);
    expect((failure as { response: { status: number } }).response.status).toBe(404);
  });
});
