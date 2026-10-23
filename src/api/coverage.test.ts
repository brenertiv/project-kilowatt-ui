import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { portfolio } from '../fixtures/data';
import { mockControls, resetMockControls } from './mock';
import { fetchAccountCoverage, fetchMeterCoverage, fetchPmTypesOfMeter } from './queries';

/** The data coverage routes, checked against the shapes the live API returned (October 2026). */

beforeAll(() => {
  mockControls.latencyMs = 0;
});

afterEach(() => {
  resetMockControls();
  mockControls.latencyMs = 0;
});

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;
const window = { data_coverage_start_date: '2026-01-01', data_coverage_end_date: '2026-09-30', page_size: 0 };
const building = (name: string) => portfolio.buildings.find((candidate) => candidate.name === name)!;

describe('meter coverage', () => {
  it('pages meters, each window in segments that tile it: billed, or a gap', async () => {
    const page = await fetchMeterCoverage({ client: client.id }, window);
    expect(Object.keys(page)).toEqual(['next', 'previous', 'results']);
    for (const meter of page.results) {
      const days = meter.data_coverage.reduce((sum, segment) => sum + segment.days, 0);
      const first = meter.data_coverage[0]!;
      const last = meter.data_coverage[meter.data_coverage.length - 1]!;
      expect(days).toBe((Date.parse(last.end_date) - Date.parse(first.start_date)) / 86_400_000 + 1);
    }
  });

  it('leaves a gap where a bill is missing, and clips the window to a retired meter', async () => {
    const trade = await fetchMeterCoverage({ location: building('1 World Trade Center').id }, window);
    const electric = trade.results.find((meter) => meter.type === 11)!;
    expect(electric.data_coverage.some((segment) => segment.meter_consumption === null && segment.start_date <= '2026-02-15' && segment.end_date >= '2026-02-15')).toBe(true);
    const times = await fetchMeterCoverage({ location: building('4 Times Square').id }, { ...window, type: true });
    const retired = times.results.find((meter) => meter.inactive_date)!;
    expect(retired.data_coverage[retired.data_coverage.length - 1]!.end_date).toBe('2026-03-31');
    expect(retired.type).toEqual({ id: 19, name: 'Natural Gas' });
  });
});

describe('utility account coverage and meter types', () => {
  it('serves accounts with bill segments, and the meter types with their utilities', async () => {
    const accounts = await fetchAccountCoverage({ location: building('55 Water Street').id }, { ...window, utility_bill_type: true });
    const account = accounts.results[0]!;
    expect(account.data_coverage[0]!.start_date).toBe('2026-04-02');
    expect(account.data_coverage.every((segment) => segment.utility_bill !== null)).toBe(true);
    expect(account.utility_bill_type).toEqual(expect.objectContaining({ utility_type: 1 }));
    const types = await fetchPmTypesOfMeter();
    expect(types.find(({ id }) => id === 11)!.utilitytypepmtypeofmeter!.utility_type.name).toBe('Electricity');
  });
});
