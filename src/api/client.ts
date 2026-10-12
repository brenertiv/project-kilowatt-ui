import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { tickets } from '../data';
import { meterInventory, type Meter } from '../meters';

const catalog: Record<string, unknown> = {
  '/tickets': tickets,
};

export type MetersPageParams = {
  /** Zero-based page index. */
  page?: number;
  /** Rows per page; `0` returns every matching row. */
  size?: number;
  /** Column to sort by (a `Meter` key). */
  sort?: keyof Meter | string;
  dir?: 'asc' | 'desc';
  /** Free-text search over name, description, and sublocation. */
  q?: string;
  /** Exact match on `source`. */
  source?: string;
};

export type MetersPage = { rows: Meter[]; total: number };

const metersLatencyMs = 350;

function compareMeters(a: Meter, b: Meter, key: string) {
  const left = a[key as keyof Meter];
  const right = b[key as keyof Meter];
  if (left === right) return 0;
  if (left === undefined || left === null) return 1;
  if (right === undefined || right === null) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), 'en', { numeric: true, sensitivity: 'base' });
}

/** Server-style paging over the meter sample. Exported so tests can exercise it without the delay. */
export function selectMetersPage(params: MetersPageParams, inventory: Meter[] = meterInventory): MetersPage {
  const needle = params.q?.trim().toLowerCase() ?? '';
  let rows = inventory;
  if (needle) {
    rows = rows.filter((meter) =>
      [meter.name, meter.description ?? '', meter.sublocation].some((field) => field.toLowerCase().includes(needle)),
    );
  }
  if (params.source) rows = rows.filter((meter) => meter.source === params.source);
  if (params.sort) {
    const direction = params.dir === 'desc' ? -1 : 1;
    const key = params.sort;
    rows = [...rows].sort((a, b) => compareMeters(a, b, key) * direction);
  }
  const total = rows.length;
  const size = params.size ?? 10;
  if (size > 0) {
    const start = Math.max(0, params.page ?? 0) * size;
    rows = rows.slice(start, start + size);
  }
  return { rows, total };
}

function toRecord(params: unknown): Record<string, unknown> {
  if (params instanceof URLSearchParams) return Object.fromEntries(params.entries());
  return params && typeof params === 'object' ? (params as Record<string, unknown>) : {};
}

function readMetersParams(params: unknown): MetersPageParams {
  const raw = toRecord(params);
  const number = (value: unknown) => (value === undefined || value === '' ? undefined : Number(value));
  const string = (value: unknown) => (value === undefined || value === '' ? undefined : String(value));
  return {
    page: number(raw.page),
    size: number(raw.size),
    sort: string(raw.sort),
    dir: raw.dir === 'desc' ? 'desc' : raw.dir === 'asc' ? 'asc' : undefined,
    q: string(raw.q),
    source: string(raw.source),
  };
}

const routes: Record<string, (config: InternalAxiosRequestConfig) => Promise<unknown>> = {
  '/meters': (config) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(selectMetersPage(readMetersParams(config.params))), metersLatencyMs);
    }),
};

export const http = axios.create({
  baseURL: '/api',
  timeout: 8000,
  adapter: async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const path = config.url ?? '';
    const route = routes[path];
    const data = route ? await route(config) : catalog[path];
    if (data === undefined) {
      return Promise.reject(new Error(`No lab mock for ${path}`));
    }
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
    };
  },
});
