import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { http } from './client';
import {
  entityPaths,
  lookupPaths,
  type Budget,
  type CarbonPlanSummary,
  type ChartDataResponse,
  type Count,
  type CountParams,
  type CursorPage,
  type EnergyData,
  type EnergyDataParams,
  type EntityName,
  type EntityRecord,
  type GroupedCount,
  type IsoDate,
  type ListParams,
  type LocationDataParams,
  type LocationDataResponse,
  type LocationScorePoint,
  type LookupName,
  type LookupRecord,
  type PmMeterCoverage,
  type PmTypeOfMeter,
  type PortfolioPathwayResponse,
  type Project,
  type ScoreAverage,
  type ScoreKind,
  type SubmeterLog,
  type SubmeterLogParams,
  type UtilityAccountCoverage,
  type ScoreParams,
  type ScorePoint,
  type Uuid,
} from './types';

/**
 * Where a portfolio-level request looks: every building the user can see, one client's
 * (`/client/{id}/…`), or one building's (`/location/{id}/…`).
 */
export type Scope = { client: Uuid } | { location: Uuid } | 'all';

/** The path prefix for a scope: `''`, `/client/{id}` or `/location/{id}`. */
export function scopePrefix(scope: Scope): string {
  if (scope === 'all') return '';
  return 'client' in scope ? `/client/${scope.client}` : `/location/${scope.location}`;
}

/**
 * Query hooks over the entity endpoints. Keys are `[entity, kind, args]` so
 * invalidating `['action']` refreshes every work-order view.
 */

export async function fetchList<E extends EntityName>(
  entity: E,
  params: ListParams = {},
): Promise<CursorPage<EntityRecord[E]>> {
  const { data } = await http.get<CursorPage<EntityRecord[E]>>(entityPaths[entity], { params });
  return data;
}

export async function fetchOne<E extends EntityName>(
  entity: E,
  id: string | number,
  params: ListParams = {},
): Promise<EntityRecord[E]> {
  const { data } = await http.get<EntityRecord[E]>(`${entityPaths[entity]}${id}/`, { params });
  return data;
}

export async function fetchLookup<L extends LookupName>(name: L): Promise<LookupRecord[L][]> {
  const { data } = await http.get<LookupRecord[L][]>(lookupPaths[name]);
  return data;
}

export async function fetchEnergyData(
  entity: 'meter' | 'equipment',
  id: string,
  params: EnergyDataParams,
): Promise<EnergyData> {
  const { data } = await http.get<EnergyData>(`${entityPaths[entity]}${id}/data/`, { params });
  return data;
}

export async function fetchScores(kind: ScoreKind, scope: Scope, params: ScoreParams): Promise<ScorePoint[] | LocationScorePoint[]> {
  const { data } = await http.get<ScorePoint[] | LocationScorePoint[]>(`${scopePrefix(scope)}/${kind}/score/`, { params });
  return data;
}

export async function fetchScoreAverage(kind: ScoreKind, scope: Scope, params: ScoreParams): Promise<ScoreAverage> {
  const { data } = await http.get<ScoreAverage>(`${scopePrefix(scope)}/${kind}/score/average/`, { params });
  return data;
}

export async function fetchActionCount(scope: Scope, params: CountParams = {}): Promise<Count | GroupedCount[]> {
  const { data } = await http.get<Count | GroupedCount[]>(`${scopePrefix(scope)}/action/count/`, { params });
  return data;
}

export async function fetchLocationData(scope: Exclude<Scope, 'all'>, params: LocationDataParams): Promise<LocationDataResponse> {
  const { data } = await http.get<LocationDataResponse>(`${scopePrefix(scope)}/location_data/`, { params });
  return data;
}

export async function fetchProjects(scope: Scope, params: ListParams = {}): Promise<CursorPage<Project>> {
  const { data } = await http.get<CursorPage<Project>>(`${scopePrefix(scope)}/project/`, { params });
  return data;
}

export async function fetchBudgets(scope: Scope, params: ListParams = {}): Promise<CursorPage<Budget>> {
  const { data } = await http.get<CursorPage<Budget>>(`${scopePrefix(scope)}/budget/`, { params });
  return data;
}

export async function fetchCarbonPlans(client: Uuid, params: ListParams = {}): Promise<CursorPage<CarbonPlanSummary>> {
  const { data } = await http.get<CursorPage<CarbonPlanSummary>>(`/client/${client}/carbon_planner/`, { params });
  return data;
}

export async function fetchPlanChartData(plan: Uuid): Promise<ChartDataResponse> {
  const { data } = await http.get<ChartDataResponse>(`/budget/${plan}/carbon_planner/chart-data/`);
  return data;
}

export async function fetchPathway(client: Uuid): Promise<PortfolioPathwayResponse> {
  const { data } = await http.get<PortfolioPathwayResponse>(`/client/${client}/carbon_planner/pathway/`);
  return data;
}

/** Submeter logs at a scope: a building's at `/location/{id}/submeter_log/`, a portfolio's at `/submeter_log/?client_hierarchy_id=…`. */
export async function fetchSubmeterLogs(scope: Scope, params: SubmeterLogParams = {}): Promise<CursorPage<SubmeterLog>> {
  const path = scope !== 'all' && 'location' in scope ? `/location/${scope.location}/submeter_log/` : '/submeter_log/';
  const portfolio = scope !== 'all' && 'client' in scope ? { client_hierarchy_id: scope.client } : {};
  const { data } = await http.get<CursorPage<SubmeterLog>>(path, { params: { ...portfolio, ...params } });
  return data;
}

export async function fetchTicketCount(scope: Scope, params: CountParams = {}): Promise<Count | GroupedCount[]> {
  const { data } = await http.get<Count | GroupedCount[]>(`${scopePrefix(scope)}/action_request/count/`, { params });
  return data;
}

/** The coverage window, `YYYY-MM-DD`, as the coverage routes take it. */
export type CoverageParams = ListParams & { data_coverage_start_date: IsoDate; data_coverage_end_date: IsoDate };

export async function fetchMeterCoverage(scope: Scope, params: CoverageParams): Promise<CursorPage<PmMeterCoverage>> {
  const { data } = await http.get<CursorPage<PmMeterCoverage>>(`${scopePrefix(scope)}/pm_meter/data_coverage/`, { params });
  return data;
}

export async function fetchAccountCoverage(scope: Scope, params: CoverageParams): Promise<CursorPage<UtilityAccountCoverage>> {
  const { data } = await http.get<CursorPage<UtilityAccountCoverage>>(`${scopePrefix(scope)}/location_utility_account/data_coverage/`, { params });
  return data;
}

export async function fetchPmTypesOfMeter(): Promise<PmTypeOfMeter[]> {
  const { data } = await http.get<PmTypeOfMeter[]>('/pm_type_of_meter/', { params: { utilitytypepmtypeofmeter: true } });
  return data;
}

export const queryKeys = {
  list: (entity: EntityName, params: ListParams = {}) => [entity, 'list', params] as const,
  one: (entity: EntityName, id: string | number, params: ListParams = {}) => [entity, 'one', id, params] as const,
  lookup: (name: LookupName) => ['lookup', name] as const,
  energy: (entity: 'meter' | 'equipment', id: string, params: EnergyDataParams) =>
    [entity, 'energy', id, params] as const,
  scores: (kind: ScoreKind, scope: Scope, params: ScoreParams) => [kind, 'score', scope, params] as const,
  scoreAverage: (kind: ScoreKind, scope: Scope, params: ScoreParams) => [kind, 'scoreAverage', scope, params] as const,
  actionCount: (scope: Scope, params: CountParams) => ['action', 'count', scope, params] as const,
  locationData: (scope: Scope, params: LocationDataParams) => ['location', 'data', scope, params] as const,
  projects: (scope: Scope, params: ListParams) => ['project', 'list', scope, params] as const,
  budgets: (scope: Scope, params: ListParams) => ['budget', 'list', scope, params] as const,
  carbonPlans: (client: Uuid, params: ListParams) => ['carbon_planner', 'plans', client, params] as const,
  planChartData: (plan: Uuid) => ['carbon_planner', 'chart-data', plan] as const,
  pathway: (client: Uuid) => ['carbon_planner', 'pathway', client] as const,
  submeterLogs: (scope: Scope, params: SubmeterLogParams) => ['submeter_log', 'list', scope, params] as const,
  ticketCount: (scope: Scope, params: CountParams) => ['action_request', 'count', scope, params] as const,
  meterCoverage: (scope: Scope, params: CoverageParams) => ['pm_meter', 'coverage', scope, params] as const,
  accountCoverage: (scope: Scope, params: CoverageParams) => ['location_utility_account', 'coverage', scope, params] as const,
  pmTypesOfMeter: () => ['pm_type_of_meter'] as const,
};

export function useEntityList<E extends EntityName>(
  entity: E,
  params: ListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.list(entity, params),
    queryFn: () => fetchList(entity, params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useEntity<E extends EntityName>(entity: E, id: string | number | undefined, params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.one(entity, id ?? '', params),
    queryFn: () => fetchOne(entity, id!, params),
    enabled: id !== undefined && id !== '',
  });
}

export function useLookup<L extends LookupName>(name: L) {
  return useQuery({ queryKey: queryKeys.lookup(name), queryFn: () => fetchLookup(name), staleTime: Infinity });
}

export function useEnergyData(entity: 'meter' | 'equipment', id: string | undefined, params: EnergyDataParams) {
  return useQuery({
    queryKey: queryKeys.energy(entity, id ?? '', params),
    queryFn: () => fetchEnergyData(entity, id!, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
}

/** A score over time, 0 to 1: one row per day with `aggregate: true`, one per location per day without. */
export function useScores(kind: ScoreKind, scope: Scope, params: ScoreParams) {
  return useQuery({ queryKey: queryKeys.scores(kind, scope, params), queryFn: () => fetchScores(kind, scope, params), placeholderData: keepPreviousData });
}

/** A score's average over a window, per location and overall, with the window before it for comparison. */
export function useScoreAverage(kind: ScoreKind, scope: Scope, params: ScoreParams) {
  return useQuery({ queryKey: queryKeys.scoreAverage(kind, scope, params), queryFn: () => fetchScoreAverage(kind, scope, params), placeholderData: keepPreviousData });
}

/** How many work orders match, or how many per value of `group_by`. */
export function useActionCount(scope: Scope, params: CountParams = {}) {
  return useQuery({ queryKey: queryKeys.actionCount(scope, params), queryFn: () => fetchActionCount(scope, params), placeholderData: keepPreviousData });
}

/** Monthly utility series for a building, or for every building of a client. */
export function useLocationData(scope: Exclude<Scope, 'all'>, params: LocationDataParams) {
  return useQuery({ queryKey: queryKeys.locationData(scope, params), queryFn: () => fetchLocationData(scope, params), placeholderData: keepPreviousData });
}

/** Capital and carbon projects at a scope. Ask for `projectcost_set: true` for their costs, and `project_type: true`, `location: true` to expand. */
export function useProjects(scope: Scope, params: ListParams = {}) {
  return useQuery({ queryKey: queryKeys.projects(scope, params), queryFn: () => fetchProjects(scope, params), placeholderData: keepPreviousData });
}

/** Budgets, capital and carbon, at a scope. */
export function useBudgets(scope: Scope, params: ListParams = {}) {
  return useQuery({ queryKey: queryKeys.budgets(scope, params), queryFn: () => fetchBudgets(scope, params), placeholderData: keepPreviousData });
}

/** A client's carbon plans. Ask for `totals: true` and `budget_status: true` to include them. */
export function useCarbonPlans(client: Uuid, params: ListParams = {}) {
  return useQuery({ queryKey: queryKeys.carbonPlans(client, params), queryFn: () => fetchCarbonPlans(client, params) });
}

/**
 * The chart data of several carbon plans, fetched in parallel, as one query-like result: `data` once every
 * plan has answered, the first failure as its error, and a `refetch` that asks again for every plan.
 * With no plans it's a success with no data in it.
 */
export function usePlansChartData(plans: Uuid[]) {
  return useQueries({
    queries: plans.map((plan) => ({ queryKey: queryKeys.planChartData(plan), queryFn: () => fetchPlanChartData(plan) })),
    combine: (results) => {
      const failed = results.find((result) => result.status === 'error');
      const pending = results.some((result) => result.status === 'pending');
      return {
        status: failed ? ('error' as const) : pending ? ('pending' as const) : ('success' as const),
        fetchStatus: results.some((result) => result.fetchStatus === 'fetching') ? ('fetching' as const) : ('idle' as const),
        data: failed || pending ? undefined : results.map((result) => result.data!),
        error: failed?.error ?? null,
        refetch: () => Promise.all(results.map((result) => result.refetch())),
      };
    },
  });
}

/** A client's baseline and CRREM pathway, whatever its plans. */
export function usePathway(client: Uuid) {
  return useQuery({ queryKey: queryKeys.pathway(client), queryFn: () => fetchPathway(client) });
}

/** Submeter logs at a scope. Ask for `properties: true` for their figures and `utility_type: true` to expand the type. */
export function useSubmeterLogs(scope: Scope, params: SubmeterLogParams = {}) {
  return useQuery({ queryKey: queryKeys.submeterLogs(scope, params), queryFn: () => fetchSubmeterLogs(scope, params), placeholderData: keepPreviousData });
}

/** How many tenant tickets match, or how many per value of `group_by`. */
export function useTicketCount(scope: Scope, params: CountParams = {}) {
  return useQuery({ queryKey: queryKeys.ticketCount(scope, params), queryFn: () => fetchTicketCount(scope, params), placeholderData: keepPreviousData });
}

/** ENERGY STAR meters at a scope, each with its bill coverage over the window. Ask for `type: true` to expand the meter type. */
export function useMeterCoverage(scope: Scope, params: CoverageParams) {
  return useQuery({ queryKey: queryKeys.meterCoverage(scope, params), queryFn: () => fetchMeterCoverage(scope, params), placeholderData: keepPreviousData });
}

/** Utility accounts at a scope, each with its bill coverage over the window. Ask for `utility_bill_type: true` to expand the bill type. */
export function useAccountCoverage(scope: Scope, params: CoverageParams) {
  return useQuery({ queryKey: queryKeys.accountCoverage(scope, params), queryFn: () => fetchAccountCoverage(scope, params), placeholderData: keepPreviousData });
}

/** ENERGY STAR meter types and the utility each measures. They don't change, so they're fetched once. */
export function usePmTypesOfMeter() {
  return useQuery({ queryKey: queryKeys.pmTypesOfMeter(), queryFn: fetchPmTypesOfMeter, staleTime: Infinity });
}
