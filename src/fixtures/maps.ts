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
