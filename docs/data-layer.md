# Data Layer

How the UI gets data before the backend exists, and keeps working after it does. The layer mirrors the Enertiv API's shapes exactly, so nothing in a component changes when the mock adapter is swapped for the real host.

## Entity shapes

`src/api/types.ts` holds the entity types, copied field for field from live API responses: `Client`, `Location`, `Sublocation`, `Equipment`, `Meter`, `UtilityBill`, `PropertyAlert`, `Action` (a work order), and the lookup tables for status, priority, alert type and bill type. Values in the sample data are synthesized; only the shapes come from the API.

The API's conventions:

- **Cursor pagination.** Lists return `{ next, previous, results }`. Requests take `cursor`, `page_size`, `ordering` (a field, `-field` for descending) and `search`. There is no page number and no total count.
- **Mixed id types.** Entities use UUID strings. Utility bills and lookup tables use integers.
- **Relations are bare ids unless expanded.** `utility_bill.location` is a UUID until the request passes `expand=location`, then it is the location object. The `Expandable<T>` type and the `isExpanded` guard cover both.
- **Ranges and timestamps.** Schedule dates and alert periods are `{ lower, upper, bounds }`. Timestamps carry an offset and microseconds. Every entity has `created` and `modified`.
- **Placeholder values are real.** Live equipment and meters named `???` or `0` with empty descriptions exist. This is a state, distinct from empty, and the sample sets include it.

The energy-data envelope `{ data, units, names }` has only been observed empty. Its row layout is modelled as `[timestamp, ...values]` and must be confirmed against a meter with readings before a chart depends on it.

## Mock adapter

`src/api/mock.ts` answers the same paths with the same envelopes, filter grammar and expansion rules, in process, with a simulated round trip. `src/api/client.ts` routes every request through it. Supported: every entity list and retrieve, the lookups, `/meter/{id}/data/` and `/equipment/{id}/data/`, equality filters, `__in`, `__isnull`, the ranges `__gte`, `__lte`, `__gt` and `__lt`, the `_id` alias, `search`, `ordering` and `expand`.

The dashboard routes are served too, at the top level or under a `/client/{id}` or `/location/{id}` prefix:

| Route | Response |
| --- | --- |
| `/{kind}/score/average/` | `{ score, location_scores, previous_score, previous_from_time, previous_to_time, previous_location_scores }`: the window's average, and the same-length window before it. |
| `/{kind}/score/` | `[{ timestamp, location_id, score }]`, one row per location per day; with `aggregate=true`, `[{ timestamp, score }]`. |
| `/action/count/` | `{ count }`; with `group_by=action_status_id` (or any work-order field), `[{ action_status_id, count }]`. Takes the work-order filters. |
| `/project/` (client, location or budget) | Cursor paged. Relations expand per field (`project_type=true`, `location=true`); `projectcost_set` and `budgetproject_set` are included only with `=true`. |
| `/budget/` (client or location) | Cursor paged; `budget_status=true` expands the status. A capital plan or a carbon plan (`auto_generated`). |
| `/client/{id}/carbon_planner/` | Cursor paged carbon plans; `totals=true` and `budget_status=true` include their totals and status. |
| `/budget/{id}/carbon_planner/chart-data/` | `{ projects, yearly_summary, crrem_pathway, … }`; `yearly_summary` holds each year's spend and the running totals of savings and avoided CO₂. |
| `/client/{id}/carbon_planner/pathway/` | `{ baseline_kgco2e, crrem_pathway, crrem_pathway_version }`. |
| `/submeter_log/` (with `client_hierarchy_id`) and `/location/{id}/submeter_log/` | Cursor paged tenant billing logs, one per building, utility and billing month. `properties=true` includes their figures under display names (`Total Cost`, `Utility Total Cost`, `Billing Period End`, `Building Name`); `utility_type=true` expands the type. `fromTime` and `toTime` are `YYYYMMDD`, matched on the billing period's end. |
| `/action_request/count/` | Tenant tickets, as `/action/count/` counts work orders: `{ count }`, or `[{ action_category_id, count }]` with `group_by`, the category `null` for uncategorized tickets. |
| `/pm_meter/data_coverage/` (top level, client or location) | Cursor paged ENERGY STAR meters, each with `data_coverage` over `data_coverage_start_date`–`data_coverage_end_date`: the window in segments, billed (`meter_consumption`) or a gap (`null`), clipped to the meter's first bill and retirement. `type=true` expands the meter type. |
| `/location_utility_account/data_coverage/` (top level, client or location) | Cursor paged utility accounts with the same segments, billed when `utility_bill` is set. `utility_bill_type=true` expands the bill type and its `utility_type`. |
| `/pm_type_of_meter/` | ENERGY STAR meter types; with `utilitytypepmtypeofmeter=true`, the utility each measures. The sample serves the four types it uses. |
| `/location_data/` (client or location) | `{ fromTime, toTime, interval, series, series__in, …, locations: [{ location_id, location_name, unit, points, data_range, series_data }] }`, one location per building. |

Score kinds are `action` (work orders), `tenant_billing`, `notification` (alerts), `insight` and `energy_star`, each 0 to 1. Score routes require `from_time` and `to_time` as `YYYY-MM-DD`; location data requires `fromTime`, `toTime` and `series` (`energy`, `electricity`, `natural_gas`, `water` or `ghg`, or several in `series__in`). A missing or malformed date answers 400 with the API's field error, `{ from_time: ['Enter a valid date.'] }`, which `errorMessage` reads. A location-data point is `{ point_key, ts, value, unit, coverage, data_provenance, source, is_interpolated, data_status }`, `ts` the month's start without an offset.

These shapes were read from the live API in October 2026. The lookups include `/budget_status/`, `/project_type/`, `/action_category/` and `/action_request_status/`, with the API's values. Not served yet: tenant ticket lists (only their counts are), and the link between a building and its ENERGY STAR property (`locationpmproperty_set`).

`mockControls` is the switchboard: `latencyMs` sets the delay (tests set 0), and `setMockFailure('/meter/', true)` makes that entity's list, retrieve and data routes reject with a 500 so error and retry states are reachable from a story (`parameters.mockApi`). `setMockFailure('*', true)` fails everything.

## Sample data

`src/fixtures/data` builds one coherent portfolio from a fixed seed: a parent client with tenants, eight buildings with units and rooms, equipment and meters in those rooms, a year of bills, alerts in every flag combination, and work orders in every status. Every relation resolves. The build is deterministic, so screenshots and tests are stable.

Each entity exposes the same named sets: `none`, `one`, `few`, `page`, `all`, `sparse`, `long` and `placeholder`.

`src/fixtures/data/series.ts` draws the buildings' time series from their ids: a daily score of each kind and monthly utility data, with seasons (electricity peaks in summer, gas in winter) and a slow decline year over year. Every state a dashboard chart has to handle is in the sample:

- **A dip and a recovery.** 350 Park Avenue's work-order score falls into poor in September 2026 and climbs back.
- **No score.** 1000 Darrell Waltrip Drive, the retail store, has no tenants and no tenant-billing score.
- **Metering began late.** 55 Water Street's data starts in April 2026.
- **A gap.** 4 Times Square has no data for February 2026.
- **A partial month.** The current month is `Partial`, its `coverage` the share of days so far.
- **An outlier.** 599 Lexington Avenue's electricity spikes in July 2026.
- **Every work-order status**, from the sample's work orders, for counts grouped by status.

`src/fixtures/data/coverage.ts` adds ENERGY STAR meters and their bills: a two-month electricity gap at 1 World Trade Center, a gas meter replaced at 4 Times Square in April 2026, a second electricity meter at 120 Broadway silent in June and July, water billed a month behind, and 55 Water Street reported only through a utility account from April 2026.

`src/fixtures/data/billing.ts` adds tenant billing and tickets: twelve billed months for the buildings with tenants, October 2026 billed for only some of them so far, recovery mostly 85–97% but 62% at 200 Vesey Street, and 90 tenant tickets, about a quarter pending approval, some with no category.

`src/fixtures/data/planning.ts` adds the client's plans: a capital plan from 2025 (part spent, eight properties), two approved carbon plans and one under review, their projects with yearly costs (most capital projects without a CO₂ estimate), each carbon plan's chart data, and a CRREM pathway that the portfolio rises above in 2028 without its plans and in 2029 with them.

The chart stories in `src/charts` still draw from `src/fixtures/charts.ts`, small hand-shaped series for showing one variant each. Widget recipes, which map API data to charts, use the routes above (Guides → Dashboard widgets).

## Async state

`src/api/state.ts` defines the one contract data components accept:

```ts
type AsyncState = {
  status: 'idle' | 'loading' | 'fetching' | 'empty' | 'error' | 'forbidden' | 'ready';
  error?: string;
  onRetry?: () => void;
};
```

`fromQuery(result)` derives it from a query result, reads the API's `detail` message out of an error and wires `refetch` to `onRetry`. A 403 becomes `forbidden`, with no retry: the user's account doesn't include that data, so asking again won't help.

`AsyncContent` (`src/components/AsyncContent`) renders every state in the space the data will take, so a card keeps its height from loading to loaded. Data components wrap what they draw in it rather than each building their own loading, empty and error views.

## Query hooks

`src/api/queries.ts` wraps TanStack Query: `useEntityList(entity, params)`, `useEntity(entity, id)`, `useLookup(name)` and `useEnergyData(entity, id, params)`, and for the dashboard routes `useScores(kind, scope, params)`, `useScoreAverage(kind, scope, params)`, `useActionCount(scope, params)` and `useLocationData(scope, params)`. A `Scope` is `'all'`, `{ client: id }` or `{ location: id }`. Keys are `[entity, kind, args]`, so invalidating `['action']` refreshes every work-order view. Lists keep the previous page on screen while the next one loads, which is what the `fetching` state renders.
