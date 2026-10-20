/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The amCharts 5 license key, from `.env.local` (see `.env.example`). */
  readonly VITE_AMCHARTS_LICENSE?: string;
  /** A CARTO API access token for CARTO's platform APIs, from `.env.local` (see `.env.example`). The basemaps don't need it. */
  readonly VITE_CARTO_API_KEY?: string;
}
