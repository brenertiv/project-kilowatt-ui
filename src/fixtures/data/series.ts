import type {
  IsoDate,
  LocationData,
  LocationDataPoint,
  LocationDataSeries,
  LocationSeriesData,
  Location,
  ScoreKind,
} from '../../api/types';
import { today } from './seed';

/**
 * Deterministic time series for the sample portfolio's buildings: daily scores and monthly utility
 * data, drawn from each building's id so a building always tells the same story. Every chart state
 * the dashboard widgets need is in here somewhere:
 *
 * - **A dip and a recovery.** 350 Park Avenue's work-order score falls into poor in September and climbs back.
 * - **No score.** 1000 Darrell Waltrip Drive, the retail store, has no tenants and no tenant-billing score.
 * - **Metering began late.** 55 Water Street's data starts in April 2026, so earlier months have no points.
 * - **A gap.** 4 Times Square has no data for February 2026.
 * - **A partial month.** The current month (October 2026) is `Partial`, its coverage the share of days so far.
 * - **An outlier.** 599 Lexington Avenue's July 2026 electricity spikes.
 */

/** A number from 0 to 1, fixed by the text it's drawn from. */
function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10_000) / 10_000;
}

const dayMs = 86_400_000;

/** A date as `YYYY-MM-DD`, in UTC. */
export function isoDay(time: number): IsoDate {
  return new Date(time).toISOString().slice(0, 10);
}

/** The days from `from` to `to`, inclusive, as UTC midnights. */
export function daysBetween(from: IsoDate, to: IsoDate): number[] {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  return Array.from({ length: Math.min(1100, Math.round((end - start) / dayMs) + 1) }, (_, i) => start + i * dayMs);
}

const todayTime = Date.UTC(today.year, today.month - 1, today.day);

/** Kinds of score a building doesn't have: the retail store has no tenants to bill. */
function hasScore(kind: ScoreKind, building: Location): boolean {
  return !(kind === 'tenant_billing' && building.location_type === 31);
}

/**
 * A building's score of one kind on one day, 0 to 1 with two decimals, or `null` where it has none or the
 * day is in the future. Each building and kind has its own level and drift; 350 Park Avenue's work-order
 * score dips into poor in September 2026.
 */
export function scoreOn(kind: ScoreKind, building: Location, time: number): number | null {
  if (!hasScore(kind, building) || time > todayTime) return null;
  const seed = hash(`${kind}:${building.id}`);
  const level = 0.55 + 0.38 * seed;
  const days = (time - todayTime) / dayMs;
  const drift = 0.05 * Math.sin(days / (9 + 10 * seed) + seed * 6);
  const dip = kind === 'action' && building.name === '350 Park Avenue' ? 0.4 * Math.exp(-(((days + 30) / 9) ** 2)) : 0;
  return Math.round(Math.min(1, Math.max(0, level + drift - dip)) * 100) / 100;
}

/** The units each series is served in. Energy is kBtu and GHG tCO₂e, as observed; the others are the units the widgets label them with. */
export const seriesUnits: Record<LocationDataSeries, string> = {
  energy: 'kBtu',
  electricity: 'kWh',
  natural_gas: 'therms',
  water: 'gal',
  ghg: 'tCO₂e',
};

/** kBtu per kWh and per therm, to add electricity and gas into energy. */
const kBtuPer = { kWh: 3.412, therm: 100 };

/** The first month a building has data: 55 Water Street was metered from April 2026. */
function firstMonth(building: Location): number {
  return building.name === '55 Water Street' ? Date.UTC(2026, 3, 1) : Date.UTC(2023, 0, 1);
}

/** Months a building has no data for. */
function missing(building: Location, month: number): boolean {
  return building.name === '4 Times Square' && month === Date.UTC(2026, 1, 1);
}

/** One building's raw monthly use, before units: electricity peaks in summer, gas in winter, water stays level. */
function monthlyUse(building: Location, month: number) {
  const seed = hash(building.id);
  const size = 0.5 + 1.5 * seed;
  const m = new Date(month).getUTCMonth();
  const summer = Math.cos(((m - 6.5) / 12) * 2 * Math.PI);
  // A slow decline year over year, as efficiency projects land, and a little noise of its own.
  const years = (month - Date.UTC(2023, 0, 1)) / (365 * dayMs);
  const trend = 1 - 0.025 * years * (0.5 + seed);
  const noise = 1 + 0.06 * (hash(`${building.id}:${month}`) - 0.5);
  const spike = building.name === '599 Lexington Avenue' && month === Date.UTC(2026, 6, 1) ? 1.45 : 1;
  const electricity = 420_000 * size * (1 + 0.28 * summer) * trend * noise * spike;
  const naturalGas = 9_000 * size * (1 - 0.6 * summer) * trend * noise;
  const water = 1_600_000 * size * (1 + 0.08 * summer) * noise;
  const energy = electricity * kBtuPer.kWh + naturalGas * kBtuPer.therm;
  // About 65 kg of CO₂e per MMBtu, a grid-and-gas blend.
  return { electricity, natural_gas: naturalGas, water, energy, ghg: (energy / 1000) * 0.065 };
}

/** The months from the window's start through its end, as UTC month starts. */
function monthsBetween(from: IsoDate, to: IsoDate): number[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const months: number[] = [];
  for (let m = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1); m <= end.getTime() && months.length < 240; ) {
    months.push(m);
    const d = new Date(m);
    m = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  return months;
}

/** One series for one building over a window, month by month, in the API's envelope. */
export function locationSeries(building: Location, series: LocationDataSeries, from: IsoDate, to: IsoDate): LocationSeriesData {
  const current = Date.UTC(today.year, today.month - 1, 1);
  const daysInMonth = new Date(Date.UTC(today.year, today.month, 0)).getUTCDate();
  const points = monthsBetween(from, to)
    .filter((month) => month >= firstMonth(building) && month <= current && !missing(building, month))
    .map((month): LocationDataPoint => {
      const partial = month === current;
      const coverage = partial ? today.day / daysInMonth : 1;
      return {
        point_key: hash(`${building.id}:${series}:${month}`).toString(16).slice(2).padEnd(24, '0'),
        ts: new Date(month).toISOString().slice(0, 19),
        value: monthlyUse(building, month)[series] * coverage,
        unit: seriesUnits[series],
        coverage,
        data_provenance: series,
        source: series,
        is_interpolated: true,
        data_status: partial ? 'Partial' : 'OK',
      };
    });
  return {
    series,
    unit: seriesUnits[series],
    points,
    data_range: { first_ts: points[0]?.ts ?? null, last_ts: points[points.length - 1]?.ts ?? null },
  };
}

/** A building's `/location_data/` entry: the first series at the top level, every requested series in `series_data`. */
export function locationData(building: Location, series: LocationDataSeries[], from: IsoDate, to: IsoDate): LocationData {
  const all = series.map((name) => locationSeries(building, name, from, to));
  return {
    location_id: building.id,
    location_name: building.name,
    ...all[0]!,
    series_data: Object.fromEntries(all.map((data) => [data.series, data])),
  };
}
