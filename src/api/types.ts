/**
 * Entity shapes mirrored from the Enertiv API. Field names, id types and
 * envelope shapes match the live responses so components built against this
 * file survive the backend hookup unchanged. Values in the sample data are
 * synthesized; only the shapes come from the API.
 *
 * Conventions the API follows and components must honor:
 * - Lists are cursor paged: `{ next, previous, results }`, driven by
 *   `cursor`, `page_size`, `ordering` and `search`.
 * - Entities use UUID ids. Utility bills and lookup tables use integers.
 * - Relations arrive as bare ids unless expanded, so a field can be either.
 * - Ranges are `{ lower, upper, bounds }`. Timestamps carry an offset.
 * - Every entity has `created` and `modified`.
 */

export type Uuid = string;
/** ISO 8601 with an offset, e.g. `2026-10-13T07:13:49.425673-04:00`. */
export type IsoDateTime = string;
/** Calendar date, e.g. `2026-10-13`. */
export type IsoDate = string;

export type RangeBounds = '[)' | '[]' | '(]' | '()';

export type DateRange<T extends string = IsoDateTime> = {
  lower: T | null;
  upper: T | null;
  bounds: RangeBounds;
};

/** A relation the API returns as a bare id unless the request expands it. */
export type Expandable<T extends { id: string | number }> = T['id'] | T;

export function isExpanded<T extends { id: string | number }>(value: Expandable<T> | null): value is T {
  return value !== null && typeof value === 'object';
}

export type CursorPage<T> = {
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ListParams = {
  cursor?: string;
  page_size?: number;
  /** Field name, prefixed with `-` for descending. */
  ordering?: string;
  search?: string;
  /** Comma-separated relation names to expand. */
  expand?: string;
  /** Any further field filter, e.g. `parent_location_id__isnull`. */
  [filter: string]: string | number | boolean | undefined;
};

/** Lookup tables: small, unpaginated reference lists. */
export type Lookup = {
  id: number;
  name: string;
  description: string | null;
  sort_order?: number;
  default_filter?: boolean;
};

export type ActionStatus = Lookup;
export type ActionType = Lookup;
export type BudgetStatus = Lookup;
export type ActionCategory = Lookup;
export type ActionRequestStatus = Lookup;
export type ProjectType = Lookup;
export type ProjectStatus = Lookup;
export type ActionPriority = Lookup;
export type AlertTypeCategory = Lookup;
export type UtilityBillType = Lookup;
export type LocationType = Lookup;

export type AlertType = {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  alert_type_category: Expandable<AlertTypeCategory>;
};

/** A portfolio, tenant or organizational node. Not a customer account. */
export type Client = {
  id: Uuid;
  parent_client: Uuid | null;
  subscription: number;
  name: string;
  address_1: string | null;
  address_2: string | null;
  suite: string | null;
  floor: string | null;
  city: string | null;
  state: string | null;
  administrative_division: number | null;
  zip: string | null;
  zip4: string | null;
  logo: string | null;
  country: string;
  move_in_date: IsoDate | null;
  move_out_date: IsoDate | null;
  lease_start_date: IsoDate | null;
  lease_end_date: IsoDate | null;
  tenant: boolean;
  country_id: string;
};

/** A building when `parent_location` is null, otherwise a unit within one. */
export type Location = {
  id: Uuid;
  location_type: Expandable<LocationType>;
  parent_location: Uuid | null;
  sublocation: Uuid | null;
  name: string;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  state: string | null;
  administrative_division: number | null;
  zip: string | null;
  zip4: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  emission_factor: number | null;
  direct_emission_factor: number | null;
  timezone: number;
  three_sixty_enabled: boolean;
  created: IsoDateTime;
  modified: IsoDateTime;
};

/** A room or area inside a location. Equipment and meters hang off it. */
export type Sublocation = {
  id: Uuid;
  location: Expandable<Location>;
  name: string;
};

/** A physical asset at a sublocation. Meters share this shape. */
export type Equipment = {
  id: Uuid;
  sublocation: Expandable<Sublocation>;
  data_source: number;
  name: string;
  description: string;
  parent_equipment: Uuid | null;
  retired: boolean;
  created: IsoDateTime;
  modified: IsoDateTime;
};

export type Meter = Equipment;

export type UtilityBill = {
  id: number;
  location: Expandable<Location>;
  account: Uuid;
  utility_company: number;
  utility_bill_type: Expandable<UtilityBillType>;
  tariff: number | null;
  clean_utility_account_number: string;
  location_utility_account: Uuid;
  start_date: IsoDate;
  end_date: IsoDate;
  issue_date: IsoDate | null;
  total_cost: number;
  total_cost_allocated: number;
  allocation: number;
  consumption_unit: string | null;
  engine_version: number;
};

export type PropertyAlert = {
  id: Uuid;
  name: string;
  property: number;
  meter: number | null;
  alert_type: Expandable<AlertType>;
  description: string;
  query_end_date: IsoDate | null;
  time_evaluated: IsoDateTime;
  relevant_period: DateRange<IsoDate> | null;
  fixed: boolean;
  fixed_timestamp: IsoDateTime | null;
  acknowledged: boolean;
  acknowledged_timestamp: IsoDateTime | null;
  acknowledged_description: string | null;
};

export type ActionEntityType = 'MeterAction' | 'EquipmentAction' | 'LocationAction';

/** A work order. */
export type Action = {
  id: Uuid;
  action_template: Uuid | null;
  action_type: number;
  action_priority: Expandable<ActionPriority>;
  action_request: Uuid | null;
  action_source_type: number;
  action_status: Expandable<ActionStatus>;
  action_category: number | null;
  name: string;
  description: string;
  schedule_date: DateRange | null;
  due_date: IsoDate | null;
  timestamp: IsoDateTime;
  started_time: IsoDateTime | null;
  completed_by: Uuid | null;
  completed_time: IsoDateTime | null;
  assigned_worker: Uuid | null;
  task_set: Uuid[];
  created: IsoDateTime;
  modified: IsoDateTime;
  action_generator: Uuid | null;
  action_generator_context: Uuid | null;
  is_billable: boolean;
  time_spent: number | null;
  time_spent_automatic: number | null;
  created_by: Uuid | null;
  work_order_number: number;
  survey_assignment: Uuid | null;
  equipment: Uuid | null;
  location_id: Uuid;
  action_entity_type: ActionEntityType;
  meter: Uuid | null;
};

/**
 * Energy data for a meter or equipment over a window at an interval.
 * Only the empty envelope has been observed so far; the row layout is the
 * expected `[timestamp, ...values]` and must be confirmed against a meter
 * that has readings.
 */
export type EnergyData = {
  data: Array<[IsoDateTime, ...Array<number | null>]>;
  units: string;
  names: string[];
};

export type EnergyDataParams = {
  fromTime: string;
  toTime: string;
  interval: 'minute' | 'hour' | 'day' | 'month';
};

/** Entity names as the API paths them. */
export const entityPaths = {
  client: '/client/',
  location: '/location/',
  sublocation: '/sublocation/',
  equipment: '/equipment/',
  meter: '/meter/',
  utility_bill: '/utility_bill/',
  property_alert: '/property_alert/',
  action: '/action/',
} as const;

export type EntityName = keyof typeof entityPaths;

export type EntityRecord = {
  client: Client;
  location: Location;
  sublocation: Sublocation;
  equipment: Equipment;
  meter: Meter;
  utility_bill: UtilityBill;
  property_alert: PropertyAlert;
  action: Action;
};

export const lookupPaths = {
  action_status: '/action_status/',
  action_type: '/action_type/',
  budget_status: '/budget_status/',
  action_category: '/action_category/',
  action_request_status: '/action_request_status/',
  project_type: '/project_type/',
  action_priority: '/action_priority/',
  alert_type: '/alert_type/',
  alert_type_category: '/alert_type_category/',
  utility_bill_type: '/utility_bill_type/',
  location_type: '/location_type/',
} as const;

export type LookupName = keyof typeof lookupPaths;

export type LookupRecord = {
  action_status: ActionStatus;
  action_type: ActionType;
  budget_status: BudgetStatus;
  project_type: ProjectType;
  action_category: ActionCategory;
  action_request_status: ActionRequestStatus;
  action_priority: ActionPriority;
  alert_type: AlertType;
  alert_type_category: AlertTypeCategory;
  utility_bill_type: UtilityBillType;
  location_type: LocationType;
};

/**
 * The kinds of score the API serves, each from 0 to 1: work orders (`action`), tenant billing, alerts
 * (`notification`), insights and ENERGY STAR. Each is served at `/{kind}/score/` and
 * `/{kind}/score/average/`, scoped by a `/client/{id}` or `/location/{id}` prefix.
 */
export const scoreKinds = ['action', 'tenant_billing', 'notification', 'insight', 'energy_star'] as const;

export type ScoreKind = (typeof scoreKinds)[number];

export type ScoreParams = {
  /** First day of the window, `YYYY-MM-DD`. Required. */
  from_time: IsoDate;
  /** Last day of the window, `YYYY-MM-DD`, inclusive. Required. */
  to_time: IsoDate;
  /** `/score/` only: one row per day across locations rather than one per location per day. */
  aggregate?: boolean;
  location_id?: Uuid;
  /** Comma-separated location ids. */
  location_id__in?: string;
};

/** One location's score; `null` where the location has nothing to score. */
export type LocationScore = { location_id: Uuid; score: number | null };

/** `/{kind}/score/average/`: the window's average, and the same-length window before it. */
export type ScoreAverage = {
  score: number | null;
  location_scores: LocationScore[];
  previous_score: number | null;
  previous_from_time: IsoDate;
  previous_to_time: IsoDate;
  previous_location_scores: LocationScore[];
};

/** `/{kind}/score/?aggregate=true`: one row per day. */
export type ScorePoint = { timestamp: IsoDate; score: number | null };

/** `/{kind}/score/`: one row per location per day. */
export type LocationScorePoint = ScorePoint & { location_id: Uuid };

/** `/action/count/` takes the work-order filters, plus `group_by` for one row per value of a field. */
export type CountParams = ListParams & {
  /** A field to group by, e.g. `action_status_id`; each row carries that field and its `count`. */
  group_by?: string;
};

/** `/action/count/` without `group_by`. */
export type Count = { count: number };

/** One row of `/action/count/?group_by=…`: the grouped field's value under its own name, and the count. */
export type GroupedCount = { count: number; [field: string]: string | number | null };

/** The series `/location_data/` serves. Energy is in kBtu, GHG in tCO₂e. */
export type LocationDataSeries = 'energy' | 'electricity' | 'natural_gas' | 'water' | 'ghg';

export type LocationDataParams = {
  series: LocationDataSeries;
  /** Comma-separated series, to fetch several at once into `series_data`. */
  series__in?: string;
  interval: 'month';
  /** Start of the window, `YYYY-MM-DD`. */
  fromTime: IsoDate;
  /** End of the window, `YYYY-MM-DD`. */
  toTime: IsoDate;
  normalization?: 'actual' | 'weather';
  /** Client scope only: comma-separated location ids, to page through a portfolio. */
  location_id__in?: string;
};

/**
 * How complete a point is. `OK` and `Partial` are observed; a month with part of its days recorded is
 * `Partial`, with `coverage` below 1.
 */
export type DataStatus = 'OK' | 'Partial';

/** One month of one series at one location. `ts` is the month's start, local time, without an offset. */
export type LocationDataPoint = {
  point_key: string;
  ts: string;
  value: number;
  unit: string;
  /** The share of the month with data, 0 to 1. */
  coverage: number;
  data_provenance: string;
  source: string;
  is_interpolated: boolean;
  data_status: DataStatus;
};

/** One series at one location: its points (a month with no data has none), and the first and last month with data. */
export type LocationSeriesData = {
  series: LocationDataSeries;
  unit: string;
  points: LocationDataPoint[];
  data_range: { first_ts: string | null; last_ts: string | null };
};

export type LocationData = LocationSeriesData & {
  location_id: Uuid;
  location_name: string;
  series_data: Partial<Record<LocationDataSeries, LocationSeriesData>>;
};

/** `/location/{id}/location_data/` (one location) and `/client/{id}/location_data/` (one per building). */
export type LocationDataResponse = {
  fromTime: IsoDateTime;
  toTime: IsoDateTime;
  interval: 'month';
  series: LocationDataSeries;
  series__in: LocationDataSeries[];
  scope: 'building';
  normalization: 'actual' | 'weather';
  normalization_method: string | null;
  included_data_provenance: string[];
  locations: LocationData[];
};

/**
 * Carbon and capital planning. A budget is a plan: a capital plan someone wrote, or a carbon plan the
 * Carbon Planner generated (`auto_generated`). Projects belong to budgets through `budgetproject_set`, and
 * their costs fall in years through `projectcost_set`. Shapes read from the live API in October 2026.
 */

/** Budget statuses by id, as the API serves them. Only approved plans count toward a portfolio's totals. */
export const budgetStatusIds = { underReview: 1, declined: 2, approved: 3, generating: 4, failed: 5 } as const;

/** `/budget/`, `/client/{id}/budget/`: a plan, its status a bare id unless `budget_status=true`. */
export type Budget = {
  id: Uuid;
  client: Uuid;
  budget_status: Expandable<BudgetStatus>;
  name: string;
  description: string;
  auto_generated: boolean;
  /** The plan's first day, `YYYY-MM-DD`. */
  start_year: IsoDate;
};

/** A plan's totals, with `totals=true`. Money is US dollars; CO₂ is kilograms a year. */
export type CarbonPlanTotals = {
  total_investment: number;
  total_annual_co2_reduction_kg: number;
  total_annual_savings: number;
  avg_roi: number | null;
  avg_payback_years: number | null;
  npv: number | null;
  discount_rate: number | null;
  total_actual_cost: number | null;
};

/** `/client/{id}/carbon_planner/`, cursor paged: one carbon plan. */
export type CarbonPlanSummary = {
  id: Uuid;
  name: string;
  description: string;
  created: IsoDateTime;
  start_year: IsoDate;
  client_id: Uuid;
  budget_status_id: number;
  created_by_id: number | null;
  auto_generated: boolean;
  carbon_planner_preset_id: number | null;
  carbon_planner_preset_config: Record<string, unknown> | null;
  timeline_years: number;
  crrem_pathway_version: string;
  total_budget_constraint: number | null;
  /** The plan's baseline, in kgCO₂e a year: a decimal string, as the API sends it. */
  baseline_emissions_kgco2e: string | null;
  portfolio_strengths: string[];
  portfolio_gaps: string[];
  portfolio_reasoning: string;
  /** With `budget_status=true`. */
  budget_status?: BudgetStatus;
  /** With `totals=true`. */
  totals?: CarbonPlanTotals;
};

/** One project in a plan's chart data. */
export type ChartDataProject = {
  id: Uuid;
  name: string;
  project_type_name: string;
  location_name: string;
  project_status: string;
  start_year: number;
  cost: number;
  annual_savings: number | null;
  /** kgCO₂e a year, once the project is done. */
  co2_avoided: number | null;
  duration_years: number;
};

/** One year of a plan: what it spends, and what it has saved and avoided by then (cumulative, kg and US dollars). */
export type YearlySummaryRow = {
  year: number;
  spend: number;
  cumulative_co2_reduction: number;
  cumulative_cost_savings: number;
  projects_starting: number;
  budget_utilization: number;
};

/** A year of the CRREM decarbonization pathway, in kgCO₂e. */
export type CrremPathwayPoint = { year: number; kgco2e: number };

/** `/budget/{id}/carbon_planner/chart-data/`. */
export type ChartDataResponse = {
  projects: ChartDataProject[];
  yearly_summary: YearlySummaryRow[];
  crrem_pathway?: CrremPathwayPoint[];
  crrem_pathway_version?: string;
  npv?: number | null;
  discount_rate?: number | null;
  npv_methodology?: string;
};

/** `/client/{id}/carbon_planner/pathway/`: the portfolio's baseline and the CRREM pathway, whatever the plans. */
export type PortfolioPathwayResponse = {
  baseline_kgco2e: number | null;
  crrem_pathway: CrremPathwayPoint[];
  crrem_pathway_version: string;
};

/** One year's cost of a project. */
export type ProjectCost = { id: Uuid; project: Uuid; project_date: IsoDate; value: number };

/** A project's place in a budget. */
export type BudgetProject = { id: Uuid; budget: Uuid; project: Uuid };

/**
 * `/project/`, `/client/{id}/project/`, `/location/{id}/project/`, `/budget/{id}/project/`, cursor paged.
 * Relations expand per field (`project_type=true`, `location=true`); the cost and budget sets are
 * included only when asked for (`projectcost_set=true`, `budgetproject_set=true`).
 */
export type Project = {
  id: Uuid;
  project_type: Expandable<ProjectType>;
  project_priority: number;
  expense_type: number;
  name: string;
  description: string;
  recommendation: string;
  auto_generated: boolean;
  resourcetype: 'LocationProject';
  project_status: Expandable<ProjectStatus>;
  /** kgCO₂e a year, once the project is done; `null` where it isn't estimated. */
  co2_avoided: number | null;
  payback_period: number | null;
  declined: boolean;
  location: Expandable<Location>;
  projectcost_set?: ProjectCost[];
  budgetproject_set?: BudgetProject[];
};

/**
 * Tenant billing. A submeter log is one building's bill to its tenants for one utility and one billing
 * period: what the utility charged the building (`Utility Total Cost`) and what the tenants are billed
 * (`Total Cost`). The figures sit in `properties` under display names, as the API sends them. Shapes read
 * from the live API in October 2026.
 */

/** A utility type, as a submeter log expands it with `utility_type=true`. */
export type UtilityType = { id: number; name: string; tag_name: string };

/** The figures of a submeter log the dashboard reads. The API sends many more (per-area intensities, demand, tax), all under display names. */
export type SubmeterLogProperties = {
  /** `YYYY-MM-DD`. */
  'Billing Period Start': IsoDate;
  /** `YYYY-MM-DD`. */
  'Billing Period End': IsoDate;
  'Building Name': string;
  /** What the tenants are billed, in US dollars. */
  'Total Cost': number;
  /** What the utility charged the building, in US dollars. */
  'Utility Total Cost': number;
  /** `Total Cost` over `Utility Total Cost`, 0 to 1. */
  'Recovery Percentage': number;
  'Tenant Count': number;
  /** 0 to 1. */
  'Leased Square Footage Percentage': number;
  [figure: string]: string | number;
};

/** `/submeter_log/` (with `client_hierarchy_id`) and `/location/{id}/submeter_log/`, cursor paged. */
export type SubmeterLog = {
  id: number;
  client_id: Uuid;
  /** A bare id unless `utility_type=true`. */
  utility_type: Expandable<UtilityType>;
  issue_date: IsoDate;
  processed_count: number;
  submeter_log_status: number;
  reading_type: number;
  display_reading_type: number | null;
  estimated: boolean;
  /** With `properties=true`. */
  properties?: SubmeterLogProperties;
};

export type SubmeterLogParams = ListParams & {
  /** The portfolio, at the top-level route. */
  client_hierarchy_id?: Uuid;
  /** First day of the window, `YYYYMMDD`; logs whose billing period ends in the window are served. */
  fromTime?: string;
  /** Last day of the window, `YYYYMMDD`. */
  toTime?: string;
  utility_type?: boolean;
  properties?: boolean;
  submeter_bills?: boolean;
  utility_bills?: boolean;
};

/** Ticket statuses by id, as the API serves them. Pending approval is a tenant's request no one has approved yet. */
export const actionRequestStatusIds = { pendingApproval: 1, declined: 2, open: 3, inProgress: 4, completed: 5 } as const;

/**
 * Data coverage: how much of each period has bills behind it. A meter's `data_coverage` lists the
 * window's days in segments: a segment with a `meter_consumption` (or, for a utility account, a
 * `utility_bill`) is covered by a bill, and one with `null` is a gap. Shapes read from the live API in
 * October 2026.
 */

/** An ENERGY STAR meter type and the utility it measures, as `/pm_type_of_meter/?utilitytypepmtypeofmeter=true` serves it. */
export type PmTypeOfMeter = {
  id: number;
  name: string;
  utilitytypepmtypeofmeter?: { id: number; utility_type: UtilityType; type_of_meter: number; miscellaneous: boolean };
};

/** The bill behind a covered segment of a meter. */
export type MeterConsumption = {
  id: number;
  start_date: IsoDate;
  end_date: IsoDate;
  usage: number;
  cost: number | null;
  estimated_value: boolean;
  meter: number;
  demand: number | null;
  demand_cost: number | null;
};

/** A segment of a meter's window: covered when it has a `meter_consumption`, a gap when that's `null`. */
export type MeterCoveragePeriod = { start_date: IsoDate; end_date: IsoDate; days: number; meter_consumption: MeterConsumption | null };

/** `/pm_meter/data_coverage/` (top level, or under `/client/{id}` or `/location/{id}`), cursor paged: an ENERGY STAR meter and its coverage over `data_coverage_start_date`–`data_coverage_end_date`. */
export type PmMeterCoverage = {
  id: number;
  /** A bare id unless `type=true`. */
  type: Expandable<{ id: number; name: string }>;
  name: string;
  metered: boolean;
  unit_of_measure: number;
  /** The meter's first bill, `YYYY-MM-DD`: it isn't expected to have data before. */
  first_bill_date: IsoDate | null;
  in_use: boolean;
  /** When the meter was retired, `YYYY-MM-DD`: it isn't expected to have data after. */
  inactive_date: IsoDate | null;
  other_description: string | null;
  access_level: number;
  aggregate_meter: number | null;
  /** The ENERGY STAR property the meter belongs to. */
  property: number;
  associated: boolean;
  created_by: string;
  created_date: IsoDateTime;
  last_updated_by: string;
  last_updated_date: IsoDateTime;
  data_coverage: MeterCoveragePeriod[];
};

/** A segment of a utility account's window: covered when it has a `utility_bill`. */
export type AccountCoveragePeriod = { start_date: IsoDate; end_date: IsoDate; days: number; utility_bill: Uuid | null };

/** `/location_utility_account/data_coverage/` (top level, or under `/client/{id}` or `/location/{id}`), cursor paged: a building's utility account and its bill coverage. */
export type UtilityAccountCoverage = {
  id: Uuid;
  location: Uuid;
  utility_company: number;
  /** A bare id unless `utility_bill_type=true`; `utility_type` is the utility it bills. */
  utility_bill_type: Expandable<{ id: number; name: string; utility_type: number }>;
  tariff: number | null;
  clean_utility_account_number: string;
  additional_utility_account_number: string | null;
  allocation: number;
  enabled: boolean;
  start_date: IsoDate | null;
  end_date: IsoDate | null;
  landlord_tenant_controlled: boolean | null;
  meter_pm_meter: Uuid | null;
  meter_pm_waste_meter: Uuid | null;
  utility_account: Uuid;
  data_coverage: AccountCoveragePeriod[];
};
