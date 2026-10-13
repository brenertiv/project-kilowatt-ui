import type {
  Action,
  Client,
  Equipment,
  Location,
  Meter,
  PropertyAlert,
  Sublocation,
  UtilityBill,
} from '../../api/types';
import { actionPriorities, actionStatuses, alertTypes, utilityBillTypes } from './lookups';
import { at, chance, day, int, monthEnd, monthStart, pick, rng, uuid, type Rng } from './seed';
import { makeSets, type SampleSets } from './sets';

/**
 * One coherent sample portfolio: a parent client with tenants, buildings with
 * units and rooms, equipment and meters in those rooms, a year of utility
 * bills, open and resolved alerts, and work orders in every status. Every
 * relation points at a record that exists, so expanded and bare-id renders
 * both have something to show.
 */

const buildingSeeds = [
  { name: '120 Broadway', city: 'New York', state: 'NY', zip: '10271', lat: 40.7081, lng: -74.0109, type: 56 },
  { name: '1 World Trade Center', city: 'New York', state: 'NY', zip: '10007', lat: 40.7127, lng: -74.0134, type: 56 },
  { name: '350 Park Avenue', city: 'New York', state: 'NY', zip: '10022', lat: 40.758, lng: -73.9725, type: 56 },
  { name: '200 Vesey Street', city: 'New York', state: 'NY', zip: '10281', lat: 40.7136, lng: -74.0155, type: 56 },
  { name: '4 Times Square', city: 'New York', state: 'NY', zip: '10036', lat: 40.756, lng: -73.986, type: 56 },
  { name: '599 Lexington Avenue', city: 'New York', state: 'NY', zip: '10022', lat: 40.758, lng: -73.9706, type: 56 },
  { name: '55 Water Street', city: 'New York', state: 'NY', zip: '10041', lat: 40.7032, lng: -74.0085, type: 56 },
  { name: '1000 Darrell Waltrip Drive', city: 'Lebanon', state: 'TN', zip: '37090', lat: null, lng: null, type: 31 },
];

const roomNames = ['Main Electrical Rm', 'Mechanical Rm 2910', 'Penthouse', 'Loading Dock', 'Level 3 Riser'];

const equipmentSeeds = [
  { name: 'AHU-1', description: 'Air handling unit, floors 2 to 8' },
  { name: 'Chiller 1', description: 'Centrifugal chiller, 600 ton' },
  { name: 'Boiler B-2', description: 'Condensing boiler, 2,000 MBH' },
  { name: 'Panel LP-3', description: 'Lighting panel, level 3' },
  { name: 'Cooling Tower CT-1', description: 'Induced draft, two cells' },
  { name: 'Elevator Bank A', description: 'Six cars, low rise' },
];

const meterSeeds = [
  { name: 'Main electric', description: 'Utility service entrance', source: 2 },
  { name: 'Chiller plant', description: 'Sub-meter on chiller feeder', source: 2 },
  { name: 'Steam service', description: 'Con Edison steam', source: 4 },
  { name: 'Domestic water', description: 'Left middle meter on the right-hand wall', source: 3 },
  { name: 'Gas boiler', description: 'Behind the switchgear, panel side', source: 4 },
  { name: 'Tenant sub-meter 12F', description: '', source: 1 },
];

const actionSeeds: Array<{ name: string; description: string; entity: Action['action_entity_type'] }> = [
  {
    name: 'Electric Consumption Meter Reading',
    description: 'Read the consumption (kWh) from an electrical meter',
    entity: 'MeterAction',
  },
  {
    name: 'Replace AHU filter',
    description: 'Swap MERV-13 filters and log the pressure drop',
    entity: 'EquipmentAction',
  },
  {
    name: 'Inspect steam trap',
    description: 'Check for blow-through and log the outlet temperature',
    entity: 'EquipmentAction',
  },
  {
    name: 'Calibrate CT sensor',
    description: 'Verify the current transformer against a clamp meter',
    entity: 'MeterAction',
  },
  {
    name: 'Chiller setpoint review',
    description: 'Compare the chilled water setpoint with the sequence of operations',
    entity: 'EquipmentAction',
  },
  {
    name: 'Roof drain clearing',
    description: 'Clear debris from all roof drains before the storm season',
    entity: 'LocationAction',
  },
  {
    name: 'Water Consumption Meter Reading',
    description: 'Read the consumption (gal) from a domestic water meter',
    entity: 'MeterAction',
  },
];

const tenantNames = [
  'Harbor Analytics',
  'Northfield Legal',
  'Pell & Rowe',
  'Greenway Health',
  'Marlow Studios',
  'Ashby Capital',
];

const workerNames = 3;

export type Portfolio = {
  clients: Client[];
  locations: Location[];
  buildings: Location[];
  units: Location[];
  sublocations: Sublocation[];
  equipment: Equipment[];
  meters: Meter[];
  utilityBills: UtilityBill[];
  propertyAlerts: PropertyAlert[];
  actions: Action[];
  workers: string[];
};

function buildClients(random: Rng): Client[] {
  const portfolioId = uuid(random);
  const base: Omit<Client, 'id' | 'name' | 'parent_client' | 'tenant'> = {
    subscription: 1,
    address_1: '120 Broadway',
    address_2: null,
    suite: null,
    floor: null,
    city: 'New York',
    state: 'NY',
    administrative_division: 33,
    zip: '10271',
    zip4: null,
    logo: null,
    country: 'US',
    move_in_date: null,
    move_out_date: null,
    lease_start_date: null,
    lease_end_date: null,
    country_id: 'US',
  };
  const portfolio: Client = {
    ...base,
    id: portfolioId,
    parent_client: null,
    name: 'Hudson Yards Partners',
    tenant: false,
  };
  const manager: Client = {
    ...base,
    id: uuid(random),
    parent_client: portfolioId,
    name: 'Hudson Property Management',
    tenant: false,
    address_1: '350 Park Avenue',
    zip: '10022',
  };
  const tenants = tenantNames.map((name, index): Client => {
    const moveIn = monthStart(int(random, 6, 60));
    return {
      ...base,
      id: uuid(random),
      parent_client: portfolioId,
      name,
      tenant: true,
      suite: `${int(random, 2, 40)}00`,
      floor: String(int(random, 2, 40)),
      move_in_date: moveIn,
      lease_start_date: moveIn,
      lease_end_date: day(int(random, -30, 900)),
      move_out_date: index === tenantNames.length - 1 ? day(-14) : null,
    };
  });
  return [portfolio, manager, ...tenants];
}

function buildLocations(random: Rng): { buildings: Location[]; units: Location[] } {
  const buildings = buildingSeeds.map((seed, index): Location => {
    const created = at(
      -int(random, 200, 900),
      int(random, 8, 18),
      int(random, 0, 59),
      int(random, 0, 59),
      int(random, 0, 999999),
    );
    return {
      id: uuid(random),
      location_type: seed.type,
      parent_location: null,
      sublocation: null,
      name: seed.name,
      address_1: seed.name,
      address_2: null,
      city: seed.city,
      state: seed.state,
      administrative_division: seed.state === 'NY' ? 33 : 42,
      zip: seed.zip,
      zip4: null,
      country: 'US',
      latitude: seed.lat,
      longitude: seed.lng,
      emission_factor: Number((0.28 + random() * 0.2).toFixed(6)),
      direct_emission_factor: 53.11,
      timezone: 1,
      three_sixty_enabled: index % 3 === 0,
      created,
      modified: at(
        -int(random, 0, 90),
        int(random, 8, 18),
        int(random, 0, 59),
        int(random, 0, 59),
        int(random, 0, 999999),
      ),
    };
  });
  const units = buildings.slice(0, 3).flatMap((building) =>
    [1, 2].map((suite): Location => ({
      ...building,
      id: uuid(random),
      location_type: 7,
      parent_location: building.id,
      name: `${building.name}, Suite ${suite}${int(random, 1, 9)}00`,
      latitude: null,
      longitude: null,
      three_sixty_enabled: false,
    })),
  );
  return { buildings, units };
}

function buildSublocations(random: Rng, buildings: Location[]): Sublocation[] {
  return buildings.flatMap((building) =>
    roomNames.slice(0, 3).map((name): Sublocation => ({ id: uuid(random), location: building.id, name })),
  );
}

function stamp(random: Rng, daysBackMax: number) {
  return at(
    -int(random, 0, daysBackMax),
    int(random, 6, 20),
    int(random, 0, 59),
    int(random, 0, 59),
    int(random, 0, 999999),
  );
}

function buildEquipment(random: Rng, sublocations: Sublocation[]): Equipment[] {
  const rows: Equipment[] = [];
  for (let index = 0; index < sublocations.length; index += 3) {
    const rooms = sublocations.slice(index, index + 3);
    let parent: Equipment | null = null;
    equipmentSeeds.slice(0, 4).forEach((seed, order) => {
      const item: Equipment = {
        id: uuid(random),
        sublocation: rooms[order % rooms.length]!.id,
        data_source: 2,
        name: seed.name,
        description: seed.description,
        parent_equipment: order === 3 && parent ? parent.id : null,
        retired: chance(random, 0.1),
        created: stamp(random, 900),
        modified: stamp(random, 120),
      };
      if (order === 0) parent = item;
      rows.push(item);
    });
  }
  return rows;
}

function buildMeters(random: Rng, sublocations: Sublocation[]): Meter[] {
  const rows: Meter[] = [];
  for (let index = 0; index < sublocations.length; index += 3) {
    const rooms = sublocations.slice(index, index + 3);
    meterSeeds.slice(0, 5).forEach((seed, order) => {
      rows.push({
        id: uuid(random),
        sublocation: rooms[order % rooms.length]!.id,
        data_source: seed.source,
        name: seed.name,
        description: seed.description,
        parent_equipment: null,
        retired: chance(random, 0.08),
        created: stamp(random, 900),
        modified: stamp(random, 120),
      });
    });
  }
  return rows;
}

function buildUtilityBills(random: Rng, buildings: Location[]): UtilityBill[] {
  const rows: UtilityBill[] = [];
  let id = 2723;
  buildings.forEach((building, buildingIndex) => {
    const types = buildingIndex % 2 === 0 ? [1, 2] : [1, 3];
    types.forEach((type) => {
      const account = uuid(random);
      const locationAccount = uuid(random);
      const accountNumber = `${int(random, 4000000000, 4999999999)}${int(random, 100, 999)}`;
      for (let monthsBack = 12; monthsBack >= 1; monthsBack -= 1) {
        const start = monthStart(monthsBack);
        const end = monthEnd(start);
        const scale = type === 1 ? 60000 : type === 2 ? 12000 : 4000;
        const cost = Number((scale * (0.7 + random() * 0.6)).toFixed(2));
        rows.push({
          id: id++,
          location: building.id,
          account,
          utility_company: type === 1 ? 5 : type === 2 ? 11 : 17,
          utility_bill_type: type,
          tariff: type === 1 ? 10 : null,
          clean_utility_account_number: accountNumber,
          location_utility_account: locationAccount,
          start_date: start,
          end_date: end,
          issue_date: monthsBack === 1 && chance(random, 0.5) ? null : day(-monthsBack * 30 + int(random, 1, 5)),
          total_cost: cost,
          total_cost_allocated: cost,
          allocation: 1,
          consumption_unit: type === 1 ? 'kWh' : type === 2 ? 'therms' : 'gal',
          engine_version: 1,
        });
      }
    });
  });
  return rows;
}

function buildPropertyAlerts(random: Rng, buildings: Location[]): PropertyAlert[] {
  return Array.from({ length: 26 }, (_, index): PropertyAlert => {
    const type = pick(random, alertTypes);
    const buildingIndex = index % buildings.length;
    const fixed = chance(random, 0.3);
    const acknowledged = fixed || chance(random, 0.35);
    const cycle = int(random, 9, 20);
    const periodStart = -int(random, 30, 400);
    const hasPeriod = type.alert_type_category === 2;
    return {
      id: uuid(random),
      name: type.id === 77 ? `Meter Consumption has a short cycle length: ${cycle} days` : type.display_name,
      property: 12700000 + buildingIndex,
      meter: type.alert_type_category === 2 ? 89000000 + int(random, 1000, 999999) : null,
      alert_type: type.id,
      description:
        type.id === 77 ? `Meter Consumption has an unusual cycle length of ${cycle} days` : type.display_name,
      query_end_date: hasPeriod ? day(periodStart + cycle) : null,
      time_evaluated: stamp(random, 10),
      relevant_period: hasPeriod ? { lower: day(periodStart), upper: day(periodStart + cycle), bounds: '[)' } : null,
      fixed,
      fixed_timestamp: fixed ? stamp(random, 5) : null,
      acknowledged,
      acknowledged_timestamp: acknowledged ? stamp(random, 8) : null,
      acknowledged_description:
        acknowledged && chance(random, 0.5) ? 'Reviewed with the utility; bill cycle confirmed.' : null,
    };
  });
}

function buildActions(
  random: Rng,
  buildings: Location[],
  equipment: Equipment[],
  meters: Meter[],
  workers: string[],
): Action[] {
  const statusCycle = [1, 1, 2, 2, 6, 7, 3, 3, 3, 4, 5];
  return Array.from({ length: 44 }, (_, index): Action => {
    const seed = actionSeeds[index % actionSeeds.length]!;
    const status = statusCycle[index % statusCycle.length]!;
    const building = buildings[index % buildings.length]!;
    const asset =
      seed.entity === 'MeterAction'
        ? pick(random, meters)
        : seed.entity === 'EquipmentAction'
          ? pick(random, equipment)
          : null;
    const scheduled = int(random, -40, 20);
    const dueOffset = scheduled + int(random, 3, 14);
    const done = status === 3;
    const started = status === 2 || status === 6 || status === 7 || done;
    const created = at(
      scheduled - int(random, 1, 10),
      int(random, 7, 18),
      int(random, 0, 59),
      int(random, 0, 59),
      int(random, 0, 999999),
    );
    return {
      id: uuid(random),
      action_template: uuid(random),
      action_type: seed.entity === 'MeterAction' ? 6 : 2,
      action_priority: pick(random, actionPriorities).id,
      action_request: chance(random, 0.3) ? uuid(random) : null,
      action_source_type: 2,
      action_status: actionStatuses.find((candidate) => candidate.id === status)!.id,
      action_category: null,
      name: seed.name,
      description: seed.description,
      schedule_date: chance(random, 0.85)
        ? { lower: at(scheduled, 19), upper: at(scheduled + 1, 19), bounds: '[)' }
        : null,
      due_date: chance(random, 0.9) ? day(dueOffset) : null,
      timestamp: created,
      started_time: started ? at(scheduled, int(random, 8, 11)) : null,
      completed_by: done ? pick(random, workers) : null,
      completed_time: done ? at(scheduled + int(random, 0, 3), int(random, 12, 17)) : null,
      assigned_worker: status === 5 ? null : pick(random, workers),
      task_set: Array.from({ length: int(random, 1, 3) }, () => uuid(random)),
      created,
      modified: stamp(random, 30),
      action_generator: chance(random, 0.5) ? uuid(random) : null,
      action_generator_context: chance(random, 0.5) ? uuid(random) : null,
      is_billable: chance(random, 0.2),
      time_spent: done ? int(random, 900, 14400) : null,
      time_spent_automatic: null,
      created_by: chance(random, 0.6) ? pick(random, workers) : null,
      work_order_number: 3 + index,
      survey_assignment: null,
      equipment: asset ? asset.id : null,
      location_id: building.id,
      action_entity_type: seed.entity,
      meter: seed.entity === 'MeterAction' && asset ? asset.id : null,
    };
  });
}

export function buildPortfolio(seed = 20261013): Portfolio {
  const random = rng(seed);
  const clients = buildClients(random);
  const { buildings, units } = buildLocations(random);
  const sublocations = buildSublocations(random, buildings);
  const equipment = buildEquipment(random, sublocations);
  const meters = buildMeters(random, sublocations);
  const utilityBills = buildUtilityBills(random, buildings);
  const propertyAlerts = buildPropertyAlerts(random, buildings);
  const workers = Array.from({ length: workerNames }, () => uuid(random));
  const actions = buildActions(random, buildings, equipment, meters, workers);
  return {
    clients,
    locations: [...buildings, ...units],
    buildings,
    units,
    sublocations,
    equipment,
    meters,
    utilityBills,
    propertyAlerts,
    actions,
    workers,
  };
}

export const portfolio: Portfolio = buildPortfolio();

const longText = (text: string, repeat: number) =>
  `${text} ${'with extended notes about placement and history '.repeat(repeat)}`.trim();

export const clientSets: SampleSets<Client> = makeSets(portfolio.clients, {
  sparse: (client) => ({
    ...client,
    address_1: null,
    city: null,
    state: null,
    zip: null,
    logo: null,
    lease_end_date: null,
    suite: null,
    floor: null,
  }),
  long: (client, index) => ({ ...client, name: `${client.name} ${'Holdings '.repeat(5 + index)}LLC` }),
  placeholder: (client, index) => ({ ...client, name: index % 2 ? '???' : '0' }),
});

export const locationSets: SampleSets<Location> = makeSets(portfolio.locations, {
  sparse: (location) => ({
    ...location,
    address_1: null,
    city: null,
    state: null,
    zip: null,
    latitude: null,
    longitude: null,
    emission_factor: null,
  }),
  long: (location, index) => ({
    ...location,
    name: `${location.name} ${'Annex '.repeat(6 + index)}Building`,
    address_1: longText(location.address_1 ?? '', 2),
  }),
  placeholder: (location, index) => ({ ...location, name: index % 2 ? '???' : '0', address_1: null }),
});

const equipmentShape = {
  sparse: (item: Equipment) => ({ ...item, description: '', parent_equipment: null }),
  long: (item: Equipment, index: number) => ({
    ...item,
    name: `${item.name} ${'very '.repeat(6 + index)}long asset name`,
    description: longText(item.description, 4),
  }),
  placeholder: (item: Equipment, index: number) => ({
    ...item,
    name: index % 2 ? '???' : '0',
    description: index % 2 ? '???' : '',
  }),
};

export const equipmentSets: SampleSets<Equipment> = makeSets(portfolio.equipment, equipmentShape);
export const meterSets: SampleSets<Meter> = makeSets(portfolio.meters, equipmentShape);

export const utilityBillSets: SampleSets<UtilityBill> = makeSets(portfolio.utilityBills, {
  sparse: (bill) => ({ ...bill, issue_date: null, tariff: null, consumption_unit: null }),
  long: (bill, index) => ({
    ...bill,
    clean_utility_account_number: `${bill.clean_utility_account_number}-${'0'.repeat(12 + index)}`,
  }),
  placeholder: (bill) => ({ ...bill, clean_utility_account_number: '0', total_cost: 0, total_cost_allocated: 0 }),
});

export const propertyAlertSets: SampleSets<PropertyAlert> = makeSets(portfolio.propertyAlerts, {
  sparse: (alert) => ({
    ...alert,
    meter: null,
    relevant_period: null,
    query_end_date: null,
    acknowledged_description: null,
  }),
  long: (alert, index) => ({
    ...alert,
    name: longText(alert.name, 2 + index),
    description: longText(alert.description, 4),
  }),
  placeholder: (alert, index) => ({ ...alert, name: index % 2 ? '???' : '0', description: '' }),
});

export const actionSets: SampleSets<Action> = makeSets(portfolio.actions, {
  sparse: (action) => ({
    ...action,
    description: '',
    schedule_date: null,
    due_date: null,
    assigned_worker: null,
    equipment: null,
    meter: null,
  }),
  long: (action, index) => ({
    ...action,
    name: `${action.name} ${'and follow-up '.repeat(4 + index)}`,
    description: longText(action.description, 4),
  }),
  placeholder: (action, index) => ({ ...action, name: index % 2 ? '???' : '0', description: '' }),
});

export { utilityBillTypes };
