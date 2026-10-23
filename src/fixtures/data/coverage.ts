import type { IsoDate, Location, MeterConsumption, PmTypeOfMeter, Uuid } from '../../api/types';
import { portfolio } from './portfolio';
import { rng, uuid } from './seed';

/**
 * The sample portfolio's ENERGY STAR meters and utility accounts, and the bills behind them, from their
 * own seed. The mock builds each request's `data_coverage` from these bills. States Data Coverage needs:
 *
 * - **A billing gap.** 1 World Trade Center's electricity has no bills for February and March 2026.
 * - **A replaced meter.** 4 Times Square's gas meter was retired on 31 March 2026 and its replacement
 *   billed from 1 April, so its coverage reads as continuous.
 * - **A silent second meter.** 120 Broadway has a second electricity meter with no bills for June and July
 *   2026, so those months aren't covered even though the first meter's are.
 * - **Lagging bills.** Water is billed through August 2026, a month behind electricity and gas.
 * - **Bills alone.** 55 Water Street has no ENERGY STAR meters; its electricity is reported through a
 *   utility account, billed from April 2026.
 */

const random = rng(20261024);

/** ENERGY STAR meter types the sample uses, with the API's ids, names and utilities. */
export const pmTypesOfMeter: PmTypeOfMeter[] = [
  [10, 'District Steam', 4, 'Steam', 'steam'],
  [11, 'Electric', 1, 'Electricity', 'electric'],
  [19, 'Natural Gas', 3, 'Natural Gas', 'gas'],
  [28, 'Municipally Supplied Potable Water - Indoor', 2, 'Water', 'water'],
].map(([id, name, utility, utilityName, tag]) => ({
  id: id as number,
  name: name as string,
  utilitytypepmtypeofmeter: {
    id: id as number,
    utility_type: { id: utility as number, name: utilityName as string, tag_name: tag as string },
    type_of_meter: id as number,
    miscellaneous: false,
  },
}));

/** A bill: the days it covers and what it measured. */
export type SampleBill = Omit<MeterConsumption, 'meter'>;

/** A meter as the sample keeps it: its record without coverage, the building it's in, and its bills. */
export type SampleMeter = {
  id: number;
  type: number;
  name: string;
  property: number;
  location: Uuid;
  first_bill_date: IsoDate;
  inactive_date: IsoDate | null;
  bills: SampleBill[];
};

const day = (time: number): IsoDate => new Date(time).toISOString().slice(0, 10);

/** Monthly bills from `from` through `through`, each running from `offset` days into a month to the day before the next, minus the months in `skip` (`YYYY-MM`). */
function monthlyBills(from: IsoDate, through: IsoDate, offset: number, usage: number, skip: string[] = []): SampleBill[] {
  const bills: SampleBill[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  for (let m = 0; m < 48; m++) {
    const begin = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m, 1 + offset);
    const end = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m + 1, offset);
    if (day(begin) > through) break;
    if (skip.includes(day(begin).slice(0, 7))) continue;
    bills.push({
      id: Math.floor(random() * 1e9),
      start_date: day(begin),
      end_date: day(Math.min(end, Date.parse(`${through}T00:00:00Z`))),
      usage: Math.round(usage * (0.85 + random() * 0.3)),
      cost: Math.round(usage * 0.14 * (0.85 + random() * 0.3) * 100) / 100,
      estimated_value: false,
      demand: null,
      demand_cost: null,
    });
  }
  return bills;
}

const building = (name: string): Location => portfolio.buildings.find((candidate) => candidate.name === name)!;

/** The ENERGY STAR properties: every New York building but 55 Water Street, which reports through bills alone. */
const metered = portfolio.buildings.filter(({ name, location_type: type }) => type !== 31 && name !== '55 Water Street');
const propertyOf = new Map(metered.map((candidate, i) => [candidate.id, 2_000_001 + i]));

let meterId = 300_000_001;
function meter(at: Location, type: number, name: string, bills: SampleBill[], first: IsoDate, inactive: IsoDate | null = null): SampleMeter {
  return { id: meterId++, type, name, property: propertyOf.get(at.id)!, location: at.id, first_bill_date: first, inactive_date: inactive, bills };
}

/** Every sample meter. Electricity and gas are billed through September 2026, water through August. */
export const sampleMeters: SampleMeter[] = metered.flatMap((at, i) => {
  const electricity = meter(
    at,
    11,
    'Electricity Supply and Delivery',
    monthlyBills('2024-10-01', '2026-09-30', 3, 300_000, at.name === '1 World Trade Center' ? ['2026-02', '2026-03'] : []),
    '2024-10-04',
  );
  const meters = [electricity];
  if (at.name === '120 Broadway') {
    // A second electricity meter, billed with the first until it goes silent in June and July 2026.
    meters.push(meter(at, 11, 'Electricity, tenant floors', monthlyBills('2024-10-01', '2026-09-30', 3, 80_000, ['2026-06', '2026-07']), '2024-10-04'));
  }
  if (i % 2 === 0) {
    if (at.name === '4 Times Square') {
      meters.push(meter(at, 19, 'Natural Gas, old meter', monthlyBills('2024-10-01', '2026-03-31', 0, 9_000), '2024-10-01', '2026-03-31'));
      meters.push(meter(at, 19, 'Natural Gas, replacement', monthlyBills('2026-04-01', '2026-09-30', 0, 9_000), '2026-04-01'));
    } else {
      meters.push(meter(at, 19, 'Natural Gas', monthlyBills('2024-10-01', '2026-09-30', 0, 9_000), '2024-10-01'));
    }
  }
  if (i % 3 !== 2) meters.push(meter(at, 28, 'Domestic Water', monthlyBills('2024-10-01', '2026-08-31', 0, 1_200_000), '2024-10-01'));
  if (at.name === '350 Park Avenue') meters.push(meter(at, 10, 'District Steam', monthlyBills('2024-10-01', '2026-09-30', 0, 4_000), '2024-10-01'));
  return meters;
});

/** A utility account as the sample keeps it: the building, the utility it bills, and its bills (each a start, an end and an id). */
export type SampleAccount = {
  id: Uuid;
  location: Uuid;
  utilityType: number;
  billType: { id: number; name: string; utility_type: number };
  start_date: IsoDate;
  bills: { id: Uuid; start_date: IsoDate; end_date: IsoDate }[];
};

/** 55 Water Street's electricity account, billed from April 2026, its only coverage. */
export const sampleAccounts: SampleAccount[] = [
  {
    id: uuid(random),
    location: building('55 Water Street').id,
    utilityType: 1,
    billType: { id: 1, name: 'Electricity Supply and Delivery', utility_type: 1 },
    start_date: '2026-04-02',
    bills: monthlyBills('2026-04-01', '2026-09-30', 1, 0).map(({ start_date: start, end_date: end }) => ({ id: uuid(random), start_date: start, end_date: end })),
  },
];
