import type { IsoDate, IsoDateTime, Location, SubmeterLog, UtilityType, Uuid } from '../../api/types';
import { actionCategories } from './lookups';
import { portfolio } from './portfolio';
import { at, chance, int, pick, rng, uuid } from './seed';

/**
 * The sample portfolio's tenant billing and tenant tickets, from their own seed so they don't shift the
 * rest of the sample. States the widgets need:
 *
 * - **Twelve billed months**, November 2025 to October 2026, for every building with tenants, in
 *   electricity, and in water for half of them.
 * - **An incomplete month.** October 2026 is billed for only some buildings so far, so its recovery is provisional.
 * - **Recovery that varies.** Most buildings recover 85–97% of their utility cost; 200 Vesey Street, about 62%.
 * - **Tickets pending approval** across several categories, some with no category at all.
 */

const random = rng(20261023);
const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

/** Utility types as submeter logs expand them, with the API's ids and names. */
export const utilityTypes: UtilityType[] = [
  { id: 1, name: 'Electricity', tag_name: 'electric' },
  { id: 2, name: 'Water', tag_name: 'water' },
];

/** The retail store has no tenants to bill. */
const billed = portfolio.buildings.filter((building) => building.location_type !== 31);

/** The buildings billed for October 2026 so far: the first half. */
const billedInOctober = new Set(billed.slice(0, Math.ceil(billed.length / 2)).map(({ id }) => id));

/** What share of its utility cost each building recovers from tenants, steady month to month. */
const recoveryOf = (building: Location, index: number) => (building.name === '200 Vesey Street' ? 0.62 : 0.85 + ((index * 37) % 12) / 100);

const iso = (time: number): IsoDate => new Date(time).toISOString().slice(0, 10);

function buildLogs(): SubmeterLog[] {
  let id = 100;
  return Array.from({ length: 12 }, (_, m) => Date.UTC(2025, 10 + m, 1)).flatMap((month) =>
    billed.flatMap((building, b) => {
      const october = month === Date.UTC(2026, 9, 1);
      if (october && !billedInOctober.has(building.id)) return [];
      const types = b % 2 === 0 ? utilityTypes : utilityTypes.slice(0, 1);
      return types.map((type): SubmeterLog => {
        const summer = Math.cos(((new Date(month).getUTCMonth() - 6.5) / 12) * 2 * Math.PI);
        const utility = Math.round((type.id === 1 ? 62_000 * (1 + 0.3 * summer) : 9_000) * (0.7 + ((b * 13) % 7) / 10) * (0.95 + random() * 0.1) * 100) / 100;
        const recovery = Math.min(1, recoveryOf(building, b) + (random() - 0.5) * 0.04);
        const end = Date.UTC(new Date(month).getUTCFullYear(), new Date(month).getUTCMonth() + 1, 0);
        return {
          id: id++,
          client_id: client.id,
          utility_type: type.id,
          issue_date: iso(end + 5 * 86_400_000),
          processed_count: int(random, 8, 40),
          submeter_log_status: 6,
          reading_type: type.id === 1 ? 3 : 7,
          display_reading_type: null,
          estimated: chance(random, 0.1),
          properties: {
            'Billing Period Start': iso(month),
            'Billing Period End': iso(end),
            'Building Name': building.name,
            'Total Cost': Math.round(utility * recovery * 100) / 100,
            'Utility Total Cost': utility,
            'Recovery Percentage': recovery,
            'Tenant Count': int(random, 6, 40),
            'Leased Square Footage Percentage': 0.8 + random() * 0.18,
          },
        };
      });
    }),
  );
}

/** Every submeter log, oldest first, with utility types as bare ids and properties included. */
export const submeterLogs: SubmeterLog[] = buildLogs();

/** Which building each log bills, for scoping to a location: a log names its building only in `properties`. */
export const logBuilding = new Map(
  submeterLogs.map((log) => [log.id, billed.find((building) => building.name === log.properties!['Building Name'])!.id]),
);

/** A tenant ticket, for counting: only `/action_request/count/` is served, so these are the fields it groups and filters by. */
export type TicketRecord = {
  id: Uuid;
  location_id: Uuid;
  action_category: number | null;
  action_request_status: number;
  created: IsoDateTime;
};

/** The categories tickets are most often filed under, weighted by repetition. */
const common = ['HVAC - Too Hot', 'HVAC - Too Cold', 'HVAC - Too Hot', 'Plumbing Leak', 'Lighting', 'Janitorial', 'Janitorial', 'Keys/Locks', 'Door Issue', 'Pest Control', 'Elevator', 'Amenity Reservation', 'Signage'];

/** Statuses tickets end up in, weighted: most are done; about one in four waits for approval. */
const statuses = [1, 1, 1, 3, 4, 5, 5, 5, 5, 2, 7, 9];

/** Every tenant ticket: 90 across the buildings with tenants, created over the last six months. */
export const tickets: TicketRecord[] = Array.from({ length: 90 }, (_, i) => {
  const name = pick(random, common);
  const category = i % 15 === 4 ? null : actionCategories.find((candidate) => candidate.name === name)!.id;
  return {
    id: uuid(random),
    location_id: pick(random, billed).id,
    action_category: category,
    action_request_status: pick(random, statuses),
    created: at(-int(random, 0, 180), int(random, 7, 19)),
  };
});
