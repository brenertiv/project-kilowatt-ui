import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { portfolio } from '../fixtures/data';
import { submeterLogs, tickets } from '../fixtures/data/billing';
import { mockControls, resetMockControls } from './mock';
import { fetchSubmeterLogs, fetchTicketCount } from './queries';
import type { GroupedCount, UtilityType } from './types';

/** The tenant billing and tenant ticket routes, checked against the shapes the live API returned (October 2026). */

beforeAll(() => {
  mockControls.latencyMs = 0;
});

afterEach(() => {
  resetMockControls();
  mockControls.latencyMs = 0;
});

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

describe('submeter logs', () => {
  it('pages a portfolio’s logs, with figures and utility types only when asked for', async () => {
    const bare = await fetchSubmeterLogs({ client: client.id }, { page_size: 1 });
    expect(Object.keys(bare)).toEqual(['next', 'previous', 'results']);
    expect(bare.results[0]).not.toHaveProperty('properties');
    expect(typeof bare.results[0]!.utility_type).toBe('number');
    const full = await fetchSubmeterLogs({ client: client.id }, { page_size: 1, properties: true, utility_type: true });
    const log = full.results[0]!;
    expect((log.utility_type as UtilityType).name).toBe('Electricity');
    expect(log.properties!['Total Cost']).toBeLessThanOrEqual(log.properties!['Utility Total Cost']);
  });

  it('serves the logs whose billing period ends in the window, YYYYMMDD', async () => {
    const september = await fetchSubmeterLogs({ client: client.id }, { page_size: 0, properties: true, fromTime: '20260901', toTime: '20260930' });
    expect(september.results.length).toBe(submeterLogs.filter((log) => log.properties!['Billing Period End'].startsWith('2026-09')).length);
    expect(september.results.every((log) => log.properties!['Billing Period End'] === '2026-09-30')).toBe(true);
  });

  it('scopes to one building, and 404s for one that does not exist', async () => {
    const building = portfolio.buildings.find(({ name }) => name === '200 Vesey Street')!;
    const logs = await fetchSubmeterLogs({ location: building.id }, { page_size: 0, properties: true });
    expect(logs.results.every((log) => log.properties!['Building Name'] === '200 Vesey Street')).toBe(true);
    const missing = await fetchSubmeterLogs({ location: 'missing' }).catch((error: unknown) => error);
    expect((missing as { response: { status: number } }).response.status).toBe(404);
  });
});

describe('tenant ticket counts', () => {
  it('groups pending tickets by category, uncategorized ones under null, as the API does', async () => {
    const rows = (await fetchTicketCount({ client: client.id }, { group_by: 'action_category_id', action_request_status_id__in: '1' })) as GroupedCount[];
    const pending = tickets.filter((ticket) => ticket.action_request_status === 1);
    expect(rows.reduce((sum, row) => sum + row.count, 0)).toBe(pending.length);
    expect(rows.some((row) => row.action_category_id === null)).toBe(true);
    expect(await fetchTicketCount('all')).toEqual({ count: tickets.length });
  });
});
