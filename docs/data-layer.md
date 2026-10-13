# Data Layer

How components get data before the backend exists, and how they keep working after it does. The layer mirrors the Enertiv API's shapes exactly, so nothing in a component changes when the mock adapter is swapped for the real host.

## Entity shapes

`src/api/types.ts` holds the entity types, copied field for field from live API responses: `Client`, `Location`, `Sublocation`, `Equipment`, `Meter`, `UtilityBill`, `PropertyAlert`, `Action` (a work order), and the lookup tables for status, priority, alert type and bill type. Values in fixtures are synthesized; only the shapes come from the API.

The API's conventions, which every component must honor:

- **Cursor pagination.** Lists return `{ next, previous, results }`. Requests take `cursor`, `page_size`, `ordering` (a field, `-field` for descending) and `search`. There is no page number and no total count.
- **Mixed id types.** Entities use UUID strings. Utility bills and lookup tables use integers.
- **Relations are bare ids unless expanded.** `utility_bill.location` is a UUID until the request passes `expand=location`, then it is the location object. The `Expandable<T>` type and the `isExpanded` guard cover both. A component that shows a relation must render the bare id too, usually as a link.
- **Ranges and timestamps.** Schedule dates and alert periods are `{ lower, upper, bounds }`. Timestamps carry an offset and microseconds. Every entity has `created` and `modified`.
- **Placeholder values are real.** Live equipment and meters named `???` or `0` with empty descriptions exist. This is a state, distinct from empty, and the sample sets include it.

The energy-data envelope `{ data, units, names }` has only been observed empty. Its row layout is modelled as `[timestamp, ...values]` and must be confirmed against a meter with readings before a chart depends on it.

## Mock adapter

`src/api/mock.ts` answers the same paths with the same envelopes, filter grammar and expansion rules, in process, with a simulated round trip. `src/api/client.ts` routes every request through it. Supported: every entity list and retrieve, the lookups, `/meter/{id}/data/` and `/equipment/{id}/data/`, equality filters, `__in`, `__isnull`, the `_id` alias, `search`, `ordering` and `expand`.

`mockControls` is the switchboard: `latencyMs` sets the delay (tests set 0), and `setMockFailure('/meter/', true)` makes that entity's list, retrieve and data routes reject with a 500 so error and retry states are reachable from a fixture. `setMockFailure('*', true)` fails everything.

## Sample data

`src/fixtures/data` builds one coherent portfolio from a fixed seed: a parent client with tenants, eight buildings with units and rooms, equipment and meters in those rooms, a year of bills, alerts in every flag combination, and work orders in every status. Every relation resolves. The build is deterministic, so screenshots and tests are stable.

Each entity exposes the same named sets: `none`, `one`, `few`, `page`, `all`, `sparse`, `long` and `placeholder`. A fixture offers them in one select so every state is one choice away.

## Async state

`src/api/state.ts` defines the one contract data components accept:

```ts
type AsyncState = {
  status: 'idle' | 'loading' | 'fetching' | 'empty' | 'error' | 'ready';
  error?: string;
  onRetry?: () => void;
};
```

Components are prop-driven: they take an `AsyncState` plus the rows, never a query result, so a fixture can put them in any state with no network. Pages derive the state with `fromQuery(result)`, which also reads the API's `detail` message out of an error and wires `refetch` to `onRetry`.

## Query hooks

`src/api/queries.ts` wraps TanStack Query: `useEntityList(entity, params)`, `useEntity(entity, id)`, `useLookup(name)` and `useEnergyData(entity, id, params)`. Keys are `[entity, kind, args]`, so invalidating `['action']` refreshes every work-order view. Lists keep the previous page on screen while the next one loads, which is what the `fetching` state renders.
