import type { InternalAxiosRequestConfig } from 'axios';
import { lookups, portfolio } from '../fixtures/data';
import { at } from '../fixtures/data/seed';
import { logBuilding, submeterLogs, tickets, utilityTypes } from '../fixtures/data/billing';
import { pmTypesOfMeter, sampleAccounts, sampleMeters } from '../fixtures/data/coverage';
import { budgets, carbonPlanSummaries, chartDataByPlan, portfolioPathway, projects } from '../fixtures/data/planning';
import { daysBetween, isoDay, locationData, scoreOn } from '../fixtures/data/series';
import {
  entityPaths,
  lookupPaths,
  scoreKinds,
  type CarbonPlanSummary,
  type Count,
  type CursorPage,
  type EnergyData,
  type EntityName,
  type GroupedCount,
  type ListParams,
  type Location,
  type LocationDataResponse,
  type LocationDataSeries,
  type LocationScorePoint,
  type LookupName,
  type IsoDate,
  type PmMeterCoverage,
  type Project,
  type ScoreAverage,
  type SubmeterLog,
  type UtilityAccountCoverage,
  type ScoreKind,
  type ScorePoint,
} from './types';

/**
 * In-process stand-in for the Enertiv API. Same paths, same envelopes, same
 * filter grammar, so the query layer and the components cannot tell the
 * difference. Stories and pages run against this until the backend exists.
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
    const range = /^(.+)__(gte|lte|gt|lt)$/.exec(key);
    if (range) {
      const [, field, op] = range;
      return current.filter((row) => {
        const left = readField(row, field!);
        if (left === null || left === undefined) return false;
        const order = compare(left, raw);
        return op === 'gte' ? order >= 0 : op === 'lte' ? order <= 0 : op === 'gt' ? order > 0 : order < 0;
      });
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
      const left = readField(a, field);
      const right = readField(b, field);
      // Nulls sort last in both directions, as the API does.
      const leftNull = left === null || left === undefined;
      const rightNull = right === null || right === undefined;
      if (leftNull !== rightNull) return leftNull ? 1 : -1;
      const result = compare(left, right) * (descending ? -1 : 1);
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

/** The buildings a scope prefix covers: every building for none or a client, one for a location. `undefined` for an id that doesn't exist. */
export function scopedBuildings(scope: 'client' | 'location' | undefined, id: string | undefined, params: ListParams = {}): Location[] | undefined {
  let buildings: Location[];
  if (scope === 'location') {
    const building = portfolio.buildings.find((candidate) => candidate.id === id);
    if (!building) return undefined;
    buildings = [building];
  } else if (scope === 'client') {
    if (!portfolio.clients.some((client) => client.id === id)) return undefined;
    buildings = portfolio.buildings;
  } else {
    buildings = portfolio.buildings;
  }
  const wanted = params.location_id__in ? String(params.location_id__in).split(',') : params.location_id ? [String(params.location_id)] : undefined;
  return wanted ? buildings.filter((building) => wanted.includes(building.id)) : buildings;
}

const average = (values: Array<number | null>) => {
  const known = values.filter((value): value is number => value !== null);
  return known.length ? known.reduce((sum, value) => sum + value, 0) / known.length : null;
};

/** The API's 400 for a missing or malformed date, e.g. `{ from_time: ['Enter a valid date.'] }`. */
function requireDates(params: ListParams, fields: string[]) {
  const invalid = fields.filter((field) => !/^\d{4}-\d{2}-\d{2}$/.test(String(params[field] ?? '')));
  if (invalid.length) throw new MockApiError('dates', 400, Object.fromEntries(invalid.map((field) => [field, ['Enter a valid date.']])));
}

/** `/{kind}/score/`: one row per location per day, or one per day with `aggregate=true`. */
export function selectScores(kind: ScoreKind, buildings: Location[], params: ListParams): ScorePoint[] | LocationScorePoint[] {
  requireDates(params, ['from_time', 'to_time']);
  const days = daysBetween(String(params.from_time), String(params.to_time));
  if (params.aggregate === true || params.aggregate === 'true') {
    return days.map((day) => ({ timestamp: isoDay(day), score: average(buildings.map((building) => scoreOn(kind, building, day))) }));
  }
  return days.flatMap((day) => buildings.map((building) => ({ timestamp: isoDay(day), location_id: building.id, score: scoreOn(kind, building, day) })));
}

/** `/{kind}/score/average/`: the window's average per location and overall, and the same for the same-length window before it. */
export function selectScoreAverage(kind: ScoreKind, buildings: Location[], params: ListParams): ScoreAverage {
  requireDates(params, ['from_time', 'to_time']);
  const days = daysBetween(String(params.from_time), String(params.to_time));
  const previousTo = (days[0] ?? 0) - 86_400_000;
  const previousDays = days.map((_, i) => previousTo - (days.length - 1 - i) * 86_400_000);
  const perLocation = (window: number[]) =>
    buildings.map((building) => {
      const score = average(window.map((day) => scoreOn(kind, building, day)));
      return { location_id: building.id, score: score === null ? null : Math.round(score * 1000) / 1000 };
    });
  const current = perLocation(days);
  const previous = perLocation(previousDays);
  return {
    score: average(current.map(({ score }) => score)),
    location_scores: current.filter(({ score }) => score !== null),
    previous_score: average(previous.map(({ score }) => score)),
    previous_from_time: isoDay(previousDays[0] ?? previousTo),
    previous_to_time: isoDay(previousTo),
    previous_location_scores: previous.filter(({ score }) => score !== null),
  };
}

/** The records the filters match, counted, or one row per value of `group_by` (`{ [field]: value, count }`), as the API's count routes answer. */
function countRecords(records: Array<Record<string, unknown>>, params: ListParams): Count | GroupedCount[] {
  const { group_by: groupBy, ...filters } = params;
  const rows = applyFilters(records, filters);
  if (!groupBy) return { count: rows.length };
  const field = String(groupBy);
  const counts = new Map<string | number | null, number>();
  for (const row of rows) {
    const value = (readField(row, field) ?? null) as string | number | null;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => compare(a, b)).map(([value, count]) => ({ [field]: value, count }));
}

/** `/action/count/`: the work orders the filters match, at the scope's buildings, counted, or grouped by one field. */
export function selectActionCount(buildings: Location[], params: ListParams): Count | GroupedCount[] {
  const ids = new Set(buildings.map((building) => building.id));
  return countRecords(portfolio.actions.filter((action) => ids.has(action.location_id)) as unknown as Array<Record<string, unknown>>, params);
}

/** Fields the planning routes expand or include only when a request asks with `field=true`; the rest of the params filter. */
const planningFlags = ['project_type', 'project_status', 'location', 'projectcost_set', 'budgetproject_set', 'budget_status', 'totals'];

const flagged = (params: ListParams, field: string) => params[field] === true || params[field] === 'true';

/** Params without the expansion flags, to filter and page with. */
const planningFilters = (params: ListParams) => Object.fromEntries(Object.entries(params).filter(([key]) => !planningFlags.includes(key))) as ListParams;

/** Projects at a scope: all of a client's, one building's, or one budget's. `undefined` for a scope that doesn't exist. */
function scopedProjects(scope: 'client' | 'location' | 'budget' | undefined, id: string | undefined) {
  if (scope === 'budget') {
    if (!budgets.some((budget) => budget.id === id)) return undefined;
    return projects.filter((project) => project.budgetproject_set?.some(({ budget }) => budget === id));
  }
  const buildings = scopedBuildings(scope, id);
  if (!buildings) return undefined;
  const ids = new Set(buildings.map(({ id: building }) => building));
  return projects.filter((project) => ids.has(project.location as string));
}

/** `/project/` at a scope: cursor paged, relations expanded and sets included per `field=true`, as the API does. */
export function selectProjects(scope: 'client' | 'location' | 'budget' | undefined, id: string | undefined, params: ListParams, path: string) {
  const rows = scopedProjects(scope, id);
  if (!rows) return undefined;
  const filters = planningFilters(params);
  const page = paginate(applyOrdering(applyFilters(rows as unknown as Array<Record<string, unknown>>, filters), filters.ordering), filters, path);
  return {
    ...page,
    results: page.results.map((row) => {
      const { projectcost_set: costs, budgetproject_set: links, ...project } = row as unknown as Project;
      return {
        ...project,
        project_type: flagged(params, 'project_type') ? lookups.project_type.find((type) => type.id === project.project_type) : project.project_type,
        project_status: flagged(params, 'project_status') ? { id: 1, name: 'Open', description: null } : project.project_status,
        location: flagged(params, 'location') ? portfolio.buildings.find((building) => building.id === project.location) : project.location,
        ...(flagged(params, 'projectcost_set') ? { projectcost_set: costs } : {}),
        ...(flagged(params, 'budgetproject_set') ? { budgetproject_set: links } : {}),
      };
    }),
  };
}

/** `/budget/` at a scope: a client's plans, or those with projects at one building. Cursor paged, `budget_status=true` expanding the status. */
export function selectBudgets(scope: 'client' | 'location' | undefined, id: string | undefined, params: ListParams, path: string) {
  const atScope = scopedProjects(scope, id);
  if (!atScope) return undefined;
  const ids = new Set(atScope.flatMap((project) => (project.budgetproject_set ?? []).map(({ budget }) => budget)));
  // A plan belongs to one client: a client's budgets are its own, a building's those with projects there.
  const rows = scope === 'location' ? budgets.filter((budget) => ids.has(budget.id)) : scope === 'client' ? budgets.filter((budget) => budget.client === id) : budgets;
  const filters = planningFilters(params);
  const page = paginate(applyFilters(rows as unknown as Array<Record<string, unknown>>, filters), filters, path);
  return {
    ...page,
    results: page.results.map((budget) => ({
      ...budget,
      budget_status: flagged(params, 'budget_status') ? lookups.budget_status.find((status) => status.id === budget.budget_status) : budget.budget_status,
    })),
  };
}

/** `/client/{id}/carbon_planner/`: the carbon plans, cursor paged, with status and totals only when asked for. */
export function selectCarbonPlans(scope: 'client' | 'location', id: string, params: ListParams, path: string) {
  const atScope = scopedProjects(scope, id);
  if (!atScope) return undefined;
  const ids = new Set(atScope.flatMap((project) => (project.budgetproject_set ?? []).map(({ budget }) => budget)));
  const rows = carbonPlanSummaries.filter((plan) => (scope === 'client' ? plan.client_id === id : ids.has(plan.id)));
  const page = paginate(rows as unknown as Array<Record<string, unknown>>, planningFilters(params), path);
  return {
    ...page,
    results: page.results.map((row) => {
      const { budget_status: status, totals, ...plan } = row as unknown as CarbonPlanSummary;
      return { ...plan, ...(flagged(params, 'budget_status') ? { budget_status: status } : {}), ...(flagged(params, 'totals') ? { totals } : {}) };
    }),
  };
}

/** Params `/submeter_log/` reads itself rather than filtering by. */
const submeterFlags = ['client_hierarchy_id', 'fromTime', 'toTime', 'utility_type', 'properties', 'submeter_bills', 'utility_bills'];

/** `YYYYMMDD`, as the submeter routes take dates, to `YYYY-MM-DD`. */
const compactDay = (value: unknown) => (/^\d{8}$/.test(String(value)) ? `${String(value).slice(0, 4)}-${String(value).slice(4, 6)}-${String(value).slice(6, 8)}` : undefined);

/**
 * `/submeter_log/` (a portfolio through `client_hierarchy_id`, or all) and `/location/{id}/submeter_log/`:
 * the logs whose billing period ends in `fromTime`–`toTime`, cursor paged, utility types expanded and
 * properties included only when asked for.
 */
export function selectSubmeterLogs(location: string | undefined, params: ListParams, path: string) {
  let buildings: Set<string>;
  if (location) {
    if (!portfolio.buildings.some(({ id }) => id === location)) return undefined;
    buildings = new Set([location]);
  } else if (params.client_hierarchy_id) {
    buildings = new Set(portfolio.clients.some(({ id }) => id === params.client_hierarchy_id) ? portfolio.buildings.map(({ id }) => id) : []);
  } else {
    buildings = new Set(portfolio.buildings.map(({ id }) => id));
  }
  const from = compactDay(params.fromTime);
  const to = compactDay(params.toTime);
  const inWindow = submeterLogs.filter((log) => {
    const end = log.properties!['Billing Period End'];
    return buildings.has(logBuilding.get(log.id)!) && (!from || end >= from) && (!to || end <= to);
  });
  const filters = Object.fromEntries(Object.entries(params).filter(([key]) => !submeterFlags.includes(key))) as ListParams;
  const page = paginate(applyFilters(inWindow as unknown as Array<Record<string, unknown>>, filters), filters, path);
  return {
    ...page,
    results: page.results.map((row) => {
      const { properties, ...log } = row as unknown as SubmeterLog;
      return {
        ...log,
        utility_type: flagged(params, 'utility_type') ? utilityTypes.find(({ id }) => id === log.utility_type) : log.utility_type,
        ...(flagged(params, 'properties') ? { properties } : {}),
      };
    }),
  };
}

const coverageFlags = ['type', 'utility_bill_type', 'data_coverage_start_date', 'data_coverage_end_date'];

/**
 * A window's days in segments, as `data_coverage` lists them: consecutive days under the same bill form one
 * segment, and consecutive days under none form a gap. `undefined` when the window is empty.
 */
function coverageSegments<Bill extends { start_date: IsoDate; end_date: IsoDate }>(bills: Bill[], from: IsoDate, to: IsoDate) {
  const days = daysBetween(from, to);
  const segments: { start_date: IsoDate; end_date: IsoDate; days: number; bill: Bill | null }[] = [];
  for (const time of days) {
    const date = isoDay(time);
    const bill = bills.find((candidate) => candidate.start_date <= date && date <= candidate.end_date) ?? null;
    const last = segments[segments.length - 1];
    if (last && last.bill === bill) {
      last.end_date = date;
      last.days += 1;
    } else {
      segments.push({ start_date: date, end_date: date, days: 1, bill });
    }
  }
  return segments;
}

/** The later or earlier of two days, `YYYY-MM-DD`, ignoring a missing one. */
const later = (a: IsoDate, b: IsoDate | null) => (b && b > a ? b : a);
const earlier = (a: IsoDate, b: IsoDate | null) => (b && b < a ? b : a);

/** The coverage window a request asks for, defaulting to the last twelve months. */
function coverageWindow(params: ListParams) {
  return {
    from: /^\d{4}-\d{2}-\d{2}$/.test(String(params.data_coverage_start_date)) ? String(params.data_coverage_start_date) : isoDay(Date.UTC(2025, 9, 1)),
    to: /^\d{4}-\d{2}-\d{2}$/.test(String(params.data_coverage_end_date)) ? String(params.data_coverage_end_date) : isoDay(Date.UTC(2026, 9, 13)),
  };
}

/**
 * `/pm_meter/data_coverage/` at a scope: each ENERGY STAR meter with its coverage over the window, the window
 * clipped to the meter's first bill and retirement. Cursor paged; `type=true` expands the meter type.
 */
export function selectMeterCoverage(buildings: Location[], params: ListParams, path: string) {
  const ids = new Set(buildings.map(({ id }) => id));
  const { from, to } = coverageWindow(params);
  const records = sampleMeters
    .filter((meter) => ids.has(meter.location))
    .map((meter): PmMeterCoverage => {
      const type = pmTypesOfMeter.find(({ id }) => id === meter.type)!;
      const start = later(from, meter.first_bill_date);
      const end = earlier(to, meter.inactive_date);
      return {
        id: meter.id,
        type: flagged(params, 'type') ? { id: type.id, name: type.name } : type.id,
        name: meter.name,
        metered: true,
        unit_of_measure: meter.type === 11 ? 18 : 1,
        first_bill_date: meter.first_bill_date,
        in_use: meter.inactive_date === null,
        inactive_date: meter.inactive_date,
        other_description: null,
        access_level: 2,
        aggregate_meter: null,
        property: meter.property,
        associated: true,
        created_by: 'enertiv',
        created_date: '2024-09-15T09:00:00-04:00',
        last_updated_by: 'enertiv',
        last_updated_date: '2026-10-08T04:00:00-04:00',
        data_coverage: start > end ? [] : coverageSegments(meter.bills, start, end).map(({ bill, ...segment }) => ({ ...segment, meter_consumption: bill ? { ...bill, meter: meter.id } : null })),
      };
    });
  const filters = Object.fromEntries(Object.entries(params).filter(([key]) => !coverageFlags.includes(key))) as ListParams;
  return paginate(applyFilters(records as unknown as Array<Record<string, unknown>>, filters), filters, path);
}

/** `/location_utility_account/data_coverage/` at a scope: each utility account with its bill coverage over the window. Cursor paged; `utility_bill_type=true` expands the bill type. */
export function selectAccountCoverage(buildings: Location[], params: ListParams, path: string) {
  const ids = new Set(buildings.map(({ id }) => id));
  const { from, to } = coverageWindow(params);
  const records = sampleAccounts
    .filter((account) => ids.has(account.location))
    .map((account): UtilityAccountCoverage => {
      const start = later(from, account.start_date);
      return {
        id: account.id,
        location: account.location,
        utility_company: 73,
        utility_bill_type: flagged(params, 'utility_bill_type') ? account.billType : account.billType.id,
        tariff: null,
        clean_utility_account_number: '000000000000000000',
        additional_utility_account_number: null,
        allocation: 1,
        enabled: true,
        start_date: account.start_date,
        end_date: null,
        landlord_tenant_controlled: null,
        meter_pm_meter: null,
        meter_pm_waste_meter: null,
        utility_account: account.id,
        data_coverage: start > to ? [] : coverageSegments(account.bills, start, to).map(({ bill, ...segment }) => ({ ...segment, utility_bill: bill?.id ?? null })),
      };
    });
  const filters = Object.fromEntries(Object.entries(params).filter(([key]) => !coverageFlags.includes(key))) as ListParams;
  return paginate(applyFilters(records as unknown as Array<Record<string, unknown>>, filters), filters, path);
}

/** `/action_request/count/`: the tenant tickets the filters match at the scope's buildings, counted, or grouped by one field. */
export function selectTicketCount(buildings: Location[], params: ListParams): Count | GroupedCount[] {
  const ids = new Set(buildings.map(({ id }) => id));
  return countRecords(tickets.filter((ticket) => ids.has(ticket.location_id)) as unknown as Array<Record<string, unknown>>, params);
}

const locationDataSeries: LocationDataSeries[] = ['energy', 'electricity', 'natural_gas', 'water', 'ghg'];

/** `/location_data/`: monthly series for each building in scope, in the API's envelope. */
export function selectLocationData(buildings: Location[], params: ListParams): LocationDataResponse {
  requireDates(params, ['fromTime', 'toTime']);
  const series = (params.series__in ? String(params.series__in).split(',') : [String(params.series ?? 'energy')]).filter((name): name is LocationDataSeries =>
    locationDataSeries.includes(name as LocationDataSeries),
  );
  if (!series.length) throw new MockApiError('series', 400, { series: ['Select a valid choice.'] });
  const from = String(params.fromTime);
  const to = String(params.toTime);
  return {
    // The API answers in the portfolio's local time; the sample portfolio is in New York.
    fromTime: `${from}T00:00:00-04:00`,
    toTime: `${to}T00:00:00-04:00`,
    interval: 'month',
    series: series[0]!,
    series__in: series,
    scope: 'building',
    normalization: params.normalization === 'weather' ? 'weather' : 'actual',
    normalization_method: null,
    included_data_provenance: [],
    locations: buildings.map((building) => locationData(building, series, from, to)),
  };
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
  response: { status: number; data: Record<string, unknown> };

  /** `data` replaces the default body, for a 400's field errors. */
  constructor(path: string, status = 500, data?: Record<string, unknown>) {
    super(`Lab mock failure for ${path}`);
    this.name = 'MockApiError';
    this.response = { status, data: data ?? { detail: status === 404 ? 'Not found.' : 'Server error.' } };
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
  // Data coverage: ENERGY STAR meters and utility accounts at a scope, and the meter types' utilities.
  const coverage = /^(?:\/(client|location)\/([^/]+))?\/(pm_meter|location_utility_account)\/data_coverage\/$/.exec(path);
  if (coverage) {
    if (failing) return fail();
    return wait(() => {
      const buildings = scopedBuildings(coverage[1] as 'client' | 'location' | undefined, coverage[2], {});
      if (!buildings) throw new MockApiError(path, 404);
      return coverage[3] === 'pm_meter' ? selectMeterCoverage(buildings, params, path) : selectAccountCoverage(buildings, params, path);
    });
  }
  if (path === '/pm_type_of_meter/') {
    if (failing) return fail();
    return wait(() => pmTypesOfMeter.map(({ utilitytypepmtypeofmeter: utility, ...type }) => (flagged(params, 'utilitytypepmtypeofmeter') ? { ...type, utilitytypepmtypeofmeter: utility } : type)));
  }
  // Tenant billing: submeter logs for a portfolio (`client_hierarchy_id`) or one building.
  const submeter = /^(?:\/location\/([^/]+))?\/submeter_log\/$/.exec(path);
  if (submeter) {
    if (failing) return fail();
    return wait(() => {
      const body = selectSubmeterLogs(submeter[1], params, path);
      if (!body) throw new MockApiError(path, 404);
      return body;
    });
  }
  // Tenant tickets, counted: at the top level or under a /client/{id} or /location/{id} prefix.
  const ticketCount = /^(?:\/(client|location)\/([^/]+))?\/action_request\/count\/$/.exec(path);
  if (ticketCount) {
    if (failing) return fail();
    return wait(() => {
      const buildings = scopedBuildings(ticketCount[1] as 'client' | 'location' | undefined, ticketCount[2], params);
      if (!buildings) throw new MockApiError(path, 404);
      return selectTicketCount(buildings, params);
    });
  }
  // Capital and carbon planning: projects and budgets at a scope, the carbon plans, their chart data and the pathway.
  const planning = /^(?:\/(client|location|budget)\/([^/]+))?\/(project|budget|carbon_planner)\/(chart-data\/|pathway\/)?$/.exec(path) ??
    /^\/(budget)\/([^/]+)\/(carbon_planner)\/(chart-data\/)$/.exec(path);
  if (planning) {
    const [, scope, id, kind, view] = planning as unknown as [string, 'client' | 'location' | 'budget' | undefined, string | undefined, string, string | undefined];
    const served =
      (kind === 'project' && !view) ||
      (kind === 'budget' && !view && scope !== 'budget') ||
      (kind === 'carbon_planner' && !view && (scope === 'client' || scope === 'location')) ||
      (kind === 'carbon_planner' && view === 'chart-data/' && scope === 'budget') ||
      (kind === 'carbon_planner' && view === 'pathway/' && scope === 'client');
    if (served) {
      if (failing) return fail();
      return wait(() => {
        let body: unknown;
        if (kind === 'project') body = selectProjects(scope, id, params, path);
        else if (kind === 'budget') body = selectBudgets(scope as 'client' | 'location' | undefined, id, params, path);
        else if (view === 'chart-data/') body = chartDataByPlan.get(id!);
        else if (view === 'pathway/') body = portfolio.clients.some((client) => client.id === id) ? portfolioPathway : undefined;
        else body = selectCarbonPlans(scope as 'client' | 'location', id!, params, path);
        if (!body) throw new MockApiError(path, 404);
        return body;
      });
    }
  }
  // Scores, counts and location data, at the top level or under a /client/{id} or /location/{id} prefix.
  const scoped = /^(?:\/(client|location)\/([^/]+))?\/([a-z_]+)\/(score\/average|score|count)\/$/.exec(path) ??
    /^\/(client|location)\/([^/]+)\/(location_data)\/$/.exec(path);
  const [, scope, id, kind, view] = (scoped ?? []) as [string?, ('client' | 'location')?, string?, string?, string?];
  // Counts are served for work orders only; scores for the score kinds.
  const served = kind === 'location_data' || (view === 'count' ? kind === 'action' : scoreKinds.includes(kind as ScoreKind));
  if (scoped && served) {
    if (failing) return fail();
    return wait(() => {
      const buildings = scopedBuildings(scope, id, params);
      if (!buildings) throw new MockApiError(path, 404);
      if (kind === 'location_data') return selectLocationData(buildings, params);
      if (view === 'count') return selectActionCount(buildings, params);
      if (view === 'score/average') return selectScoreAverage(kind as ScoreKind, buildings, params);
      return selectScores(kind as ScoreKind, buildings, params);
    });
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
