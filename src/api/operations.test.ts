import { describe, expect, it } from 'vitest';
import { selectMetersPage } from './client';
import { fetchMetersPage, fetchTickets } from './operations';
import { meterInventory } from '../meters';

describe('fetchTickets', () => {
  it('returns the lab ticket catalog through axios', async () => {
    const tickets = await fetchTickets();
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0]?.id).toMatch(/^T-/);
  });
});

describe('selectMetersPage', () => {
  it('filters, sorts, and pages the inventory', () => {
    const page = selectMetersPage({ page: 1, size: 5, sort: 'channels', dir: 'desc', source: 'Monitored' });
    const monitored = meterInventory.filter((meter) => meter.source === 'Monitored');
    expect(page.total).toBe(monitored.length);
    expect(page.rows).toHaveLength(5);
    expect(page.rows.every((meter) => meter.source === 'Monitored')).toBe(true);
    const channels = page.rows.map((meter) => meter.channels);
    expect(channels).toEqual([...channels].sort((a, b) => b - a));
  });

  it('matches the search term across name, description, and sublocation', () => {
    const page = selectMetersPage({ q: 'penthouse', size: 0 });
    expect(page.rows.length).toBe(page.total);
    expect(
      page.rows.every((meter) => meter.sublocation === 'Penthouse' || meter.description?.includes('Penthouse')),
    ).toBe(true);
  });
});

describe('fetchMetersPage', () => {
  it('resolves a page through the mock adapter after the simulated delay', async () => {
    const started = Date.now();
    const page = await fetchMetersPage({ page: 0, size: 10 });
    expect(Date.now() - started).toBeGreaterThanOrEqual(300);
    expect(page.rows).toHaveLength(10);
    expect(page.total).toBe(meterInventory.length);
  });
});
