/**
 * The CARTO API access token, from `.env.local` (see `.env.example`), for CARTO's platform APIs:
 * deck.gl's CARTO data sources (`vectorTableSource`, `h3QuerySource` and the rest) and `fetchMap`
 * take it as `accessToken`. The basemaps (`basemapStyle`) are public and don't need it. Vite puts it
 * in the browser bundle, so it must be a token scoped to read only what maps show.
 */
export const cartoAccessToken = import.meta.env.VITE_CARTO_API_KEY;
