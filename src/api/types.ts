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
  action_priority: '/action_priority/',
  alert_type: '/alert_type/',
  alert_type_category: '/alert_type_category/',
  utility_bill_type: '/utility_bill_type/',
  location_type: '/location_type/',
} as const;

export type LookupName = keyof typeof lookupPaths;

export type LookupRecord = {
  action_status: ActionStatus;
  action_priority: ActionPriority;
  alert_type: AlertType;
  alert_type_category: AlertTypeCategory;
  utility_bill_type: UtilityBillType;
  location_type: LocationType;
};
