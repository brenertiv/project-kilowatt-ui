/** A Cosmos fixture id: the fixture file and, for multi-fixture modules, the export name. */
export type FixtureRef = { path: string; name: string | null };

/**
 * Where the Cosmos UI runs. In development it is the local server from
 * `cosmos.config.json`; a deployed build links only when `VITE_COSMOS_URL`
 * points at an exported Cosmos site.
 */
export const cosmosBaseUrl: string | null =
  (import.meta.env.VITE_COSMOS_URL as string | undefined) ?? (import.meta.env.DEV ? 'http://localhost:5100' : null);

export function cosmosFixtureUrl(fixture: FixtureRef, base: string | null = cosmosBaseUrl): string | null {
  if (!base) return null;
  const id = JSON.stringify(fixture.name ? { path: fixture.path, name: fixture.name } : { path: fixture.path });
  return `${base.replace(/\/$/, '')}/?fixture=${encodeURIComponent(id)}`;
}
