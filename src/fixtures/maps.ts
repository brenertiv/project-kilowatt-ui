import type { MapSite } from '../maps/SiteMap';
import { portfolio } from './data';

/**
 * The sample portfolio's buildings that have coordinates, as map sites, with September 2026's energy
 * use (kWh) as each one's value. Deterministic, so screenshots and tests stay stable.
 */
export const sites: MapSite[] = portfolio.locations
  .filter((location) => location.latitude !== null && location.longitude !== null && location.parent_location === null)
  .map((location, i) => ({
    id: location.id,
    name: location.name,
    latitude: location.latitude!,
    longitude: location.longitude!,
    value: 28_000 + ((i * 7_919) % 19_000),
  }));

/** The same sites with the one that used the most energy as the point and the rest as context (`neutral`). */
export const highlightedSites: MapSite[] = sites.map((site) => ({
  ...site,
  neutral: site.value !== Math.max(...sites.map(({ value = 0 }) => value)),
}));

const statuses: { status: MapSite['status']; detail: string }[] = [
  { status: 'success', detail: 'Data complete' },
  { status: 'warning', detail: 'Data late, last reading 3 days ago' },
  { status: 'error', detail: 'No data for 14 days' },
];

/**
 * The same sites by data status: each takes an intent and a detail line saying what its color stands
 * for, and the last has no data for the period, so it's hollow.
 */
export const statusSites: MapSite[] = sites.map((site, i) =>
  i === sites.length - 1
    ? { ...site, value: undefined, hollow: true, status: 'error', detail: 'No meters connected' }
    : { ...site, ...statuses[i % statuses.length] },
);
