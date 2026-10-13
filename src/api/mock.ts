import type { InternalAxiosRequestConfig } from 'axios';
import { lookups, portfolio } from '../fixtures/data';
import { at } from '../fixtures/data/seed';
import {
  entityPaths,
  lookupPaths,
  type CursorPage,
  type EnergyData,
  type EntityName,
  type ListParams,
  type LookupName,
} from './types';

/**
 * In-process stand-in for the Enertiv API. Same paths, same envelopes, same
 * filter grammar, so the query layer and the components cannot tell the
 * difference. Fixtures and pages run against this until the backend exists.
 */

export const mockControls = {
  /** Simulated round trip. Tests set it to 0. */
  latencyMs: 350,
  /** Paths that reject with a 500. `*` fails everything. */
  failing: new Set<string>(),
};

export function setMockFailure(path: string, fail: boolean) {
  if (fail) mockControls.failing.add(path);
  else mockControls.failing.delete(path);
}

export function resetMockControls() {
  mockControls.latencyMs = 350;
  mockControls.failing.clear();
}

const tables: Record<EntityName, Array<Record<string, unknown>>> = {
  client: portfolio.clients,
  location: portfolio.locations,
  sublocation: portfolio.sublocations,
  equipment: portfolio.equipment,
  meter: portfolio.meters,
  utility_bill: portfolio.utilityBills,
  property_alert: portfolio.propertyAlerts,
  action: portfolio.actions,
};

/** Which fields are relations, and which table resolves them. */
const relations: Partial<Record<EntityName, Record<string, EntityName | LookupName>>> = {
  location: { location_type: 'location_type', parent_location: 'location' },
  sublocation: { location: 'location' },
  equipment: { sublocation: 'sublocation', parent_equipment: 'equipment' },
  meter: { sublocation: 'sublocation', parent_equipment: 'meter' },
  utility_bill: { location: 'location', utility_bill_type: 'utility_bill_type' },
  property_alert: { alert_type: 'alert_type' },
  action: {
    action_status: 'action_status',
    action_priority: 'action_priority',
    equipment: 'equipment',
    meter: 'meter',
  },
};

function tableFor(name: EntityName | LookupName): Array<Record<string, unknown>> {
  return name in tables ? tables[name as EntityName] : (lookups[name as LookupName] as Array<Record<string, unknown>>);
}

export function encodeCursor(offset: number): string {
  return btoa(`o=${offset}`);
}

export function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  try {
    const match = /^o=(\d+)$/.exec(atob(cursor));
    return match ? Number(match[1]) : 0;
  } catch {
    return 0;
  }
}

const reservedParams = new Set(['cursor', 'page_size', 'ordering', 'search', 'expand']);

function coerce(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '') return null;
  return value;
}

function same(left: unknown, right: unknown): boolean {
  if (left === null || left === undefined) return right === null;
  return String(left) === String(right);
}

/** Resolves `field`, `field_id`, and `relation__field` against a record. */
function readField(record: Record<string, unknown>, field: string): unknown {
  if (field in record) return record[field];
  if (field.endsWith('_id') && field.slice(0, -3) in record) return record[field.slice(0, -3)];
  return undefined;
}

export function applyFilters<T extends Record<string, unknown>>(rows: T[], params: ListParams): T[] {
  return Object.entries(params).reduce((current, [key, raw]) => {
    if (reservedParams.has(key) || raw === undefined) return current;
    const value = coerce(raw);
    if (key.endsWith('__isnull')) {
      const field = key.slice(0, -'__isnull'.length);
      return current.filter(
        (row) => (readField(row, field) === null || readField(row, field) === undefined) === Boolean(value),
      );
    }
    if (key.endsWith('__in')) {
      const field = key.slice(0, -'__in'.length);
      const wanted = String(raw).split(',');
      return current.filter((row) => wanted.some((candidate) => same(readField(row, field), candidate)));
    }
    return current.filter((row) => same(readField(row, key), value));
  }, rows);
}

export function applySearch<T extends Record<string, unknown>>(rows: T[], search: string | undefined): T[] {
  const needle = search?.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    Object.values(row).some((value) => typeof value === 'string' && value.toLowerCase().includes(needle)),
  );
}

function compare(left: unknown, right: unknown): number {
  if (left === right) return 0;
  if (left === null || left === undefined) return 1;
  if (right === null || right === undefined) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  return String(left).localeCompare(String(right), 'en', { numeric: true, sensitivity: 'base' });
}

export function applyOrdering<T extends Record<string, unknown>>(rows: T[], ordering: string | undefined): T[] {
  if (!ordering) return rows;
  const keys = ordering
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  return [...rows].sort((a, b) => {
    for (const key of keys) {
      const descending = key.startsWith('-');
      const field = descending ? key.slice(1) : key;
      const result = compare(readField(a, field), readField(b, field)) * (descending ? -1 : 1);
      if (result !== 0) return result;
    }
    return 0;
  });
}

export const defaultPageSize = 25;

function pageUrl(path: string, params: ListParams, cursor: string): string {
  const query = new URLSearchParams();
  query.set('cursor', cursor);
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'cursor' && value !== undefined) query.set(key, String(value));
  }
  return `/api${path}?${query.toString()}`;
}

export function paginate<T>(rows: T[], params: ListParams, path: string): CursorPage<T> {
  const size = params.page_size === undefined ? defaultPageSize : Number(params.page_size);
  if (!(size > 0)) return { next: null, previous: null, results: rows };
  const offset = decodeCursor(params.cursor);
  const results = rows.slice(offset, offset + size);
  const next = offset + size < rows.length ? pageUrl(path, params, encodeCursor(offset + size)) : null;
  const previous = offset > 0 ? pageUrl(path, params, encodeCursor(Math.max(0, offset - size))) : null;
  return { next, previous, results };
}

export function expandRecord<T extends Record<string, unknown>>(entity: EntityName, record: T, expand: string[]): T {
  const map = relations[entity];
  if (!map || expand.length === 0) return record;
  const next: Record<string, unknown> = { ...record };
  for (const field of expand) {
    const target = map[field];
    const id = record[field];
    if (!target || id === null || id === undefined || typeof id === 'object') continue;
    const match = tableFor(target).find((row) => same(row.id, id));
    if (match) next[field] = match;
  }
  return next as T;
}

export function selectList(entity: EntityName, params: ListParams): CursorPage<Record<string, unknown>> {
  const expand = String(params.expand ?? '')
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);
  const rows = applyOrdering(applySearch(applyFilters(tables[entity], params), params.search), params.ordering);
  const page = paginate(rows, params, entityPaths[entity]);
  return { ...page, results: page.results.map((row) => expandRecord(entity, row, expand)) };
}

export function selectOne(
  entity: EntityName,
  id: string,
  params: ListParams = {},
): Record<string, unknown> | undefined {
  const expand = String(params.expand ?? '')
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);
  const row = tables[entity].find((candidate) => same(candidate.id, id));
  return row ? expandRecord(entity, row, expand) : undefined;
}

/** Hourly kWh for a meter over a window. Seeded by id so a meter always draws the same curve. */
export function selectEnergyData(
  id: string,
  params: { fromTime?: string; toTime?: string; interval?: string },
): EnergyData {
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const from = params.fromTime ? new Date(params.fromTime.replace(' ', 'T')) : new Date(at(-1, 0));
  const to = params.toTime ? new Date(params.toTime.replace(' ', 'T')) : new Date(at(0, 0));
  const stepMs = params.interval === 'day' ? 86_400_000 : params.interval === 'minute' ? 60_000 : 3_600_000;
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to <= from)
    return { data: [], units: '', names: [] };
  const rows: EnergyData['data'] = [];
  for (let time = from.getTime(), index = 0; time < to.getTime() && index < 10_000; time += stepMs, index += 1) {
    const hour = new Date(time).getUTCHours();
    const daytime = hour >= 7 && hour <= 19 ? 1 : 0.45;
    const value = Math.round((40 + (seed % 60)) * daytime * (0.85 + ((seed * (index + 1)) % 30) / 100));
    rows.push([new Date(time).toISOString(), value]);
  }
  return { data: rows, units: 'kWh', names: ['Consumption'] };
}

function wait<T>(value: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(value());
      } catch (error) {
        reject(error);
      }
    }, mockControls.latencyMs);
  });
}

export class MockApiError extends Error {
  response: { status: number; data: { detail: string } };

  constructor(path: string, status = 500) {
    super(`Lab mock failure for ${path}`);
    this.name = 'MockApiError';
    this.response = { status, data: { detail: status === 404 ? 'Not found.' : 'Server error.' } };
  }
}

function toParams(params: unknown): ListParams {
  if (params instanceof URLSearchParams) return Object.fromEntries(params.entries());
  return params && typeof params === 'object' ? (params as ListParams) : {};
}

const entityByPath = Object.fromEntries(Object.entries(entityPaths).map(([name, path]) => [path, name])) as Record<
  string,
  EntityName
>;
const lookupByPath = Object.fromEntries(Object.entries(lookupPaths).map(([name, path]) => [path, name])) as Record<
  string,
  LookupName
>;

/** Resolves an API path to a response, or `undefined` when the path is not mocked. */
export function mockRoute(config: InternalAxiosRequestConfig): Promise<unknown> | undefined {
  const path = config.url ?? '';
  const params = toParams(config.params);
  // Failing an entity's list path, e.g. `/meter/`, also fails its retrieve and data routes.
  const base = /^\/[a-z_]+\//.exec(path)?.[0] ?? '';
  const failing = mockControls.failing.has('*') || mockControls.failing.has(path) || mockControls.failing.has(base);

  const fail = () =>
    wait(() => {
      throw new MockApiError(path);
    });

  if (lookupByPath[path]) {
    return failing ? fail() : wait(() => lookups[lookupByPath[path]!]);
  }
  if (entityByPath[path]) {
    return failing ? fail() : wait(() => selectList(entityByPath[path]!, params));
  }
  const energy = /^(\/(?:meter|equipment)\/)([^/]+)\/data\/$/.exec(path);
  if (energy) {
    return failing ? fail() : wait(() => selectEnergyData(energy[2]!, params as Record<string, string>));
  }
  const retrieve = /^(\/[a-z_]+\/)([^/]+)\/$/.exec(path);
  if (retrieve && entityByPath[retrieve[1]!]) {
    if (failing) return fail();
    return wait(() => {
      const row = selectOne(entityByPath[retrieve[1]!]!, retrieve[2]!, params);
      if (!row) throw new MockApiError(path, 404);
      return row;
    });
  }
  return undefined;
}
