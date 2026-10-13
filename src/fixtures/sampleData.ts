import type { ChartData } from '../charts/types';
import { demandDay } from '../data';
import { meterInventory, type Meter } from '../meters';

/**
 * Sample data for fixtures. Each set is built to reach every state a component
 * defines: empty, single, typical, dense, missing values and long text.
 */

export const meters = {
  none: [] as Meter[],
  one: meterInventory.slice(0, 1),
  few: meterInventory.slice(0, 8),
  page: meterInventory.slice(0, 25),
  all: meterInventory,
  /** Rows with every optional field missing, to exercise empty cells. */
  sparse: meterInventory.slice(0, 6).map((meter) => ({
    ...meter,
    description: undefined,
    linkStartDate: undefined,
    utilityAccount: undefined,
  })),
  /** Long names and descriptions, to exercise truncation and wrapping. */
  long: meterInventory.slice(0, 4).map((meter, index) => ({
    ...meter,
    name: `${meter.name} — ${'very '.repeat(6 + index)}long meter name`,
    description: `${meter.description ?? 'Placement'} ${'with extended location notes '.repeat(4)}`,
  })),
};

export const demand: Record<'empty' | 'single' | 'pair' | 'four' | 'gaps', ChartData> = {
  empty: { xLabel: 'Hour', series: [{ id: 'today', label: 'Today', unit: 'kW', points: demandDay.map((s) => ({ x: s.time, y: null })) }] },
  single: { xLabel: 'Hour', series: [{ id: 'today', label: 'Today', unit: 'kW', points: demandDay.map((s) => ({ x: s.time, y: s.today })) }] },
  pair: {
    xLabel: 'Hour',
    series: [
      { id: 'today', label: 'Today', unit: 'kW', points: demandDay.map((s) => ({ x: s.time, y: s.today })) },
      { id: 'baseline', label: 'Last week', unit: 'kW', role: 'comparison', points: demandDay.map((s) => ({ x: s.time, y: s.baseline })) },
    ],
  },
  four: {
    xLabel: 'Hour',
    series: ['Chillers', 'AHUs', 'Lighting', 'Plug load'].map((label, index) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      unit: 'kW' as const,
      points: demandDay.map((s) => ({ x: s.time, y: Math.round(s.today * (0.45 - index * 0.1) + index * 12) })),
    })),
  },
  gaps: {
    xLabel: 'Hour',
    series: [
      {
        id: 'today',
        label: 'Today',
        unit: 'kW',
        points: demandDay.map((s, index) => ({ x: s.time, y: index > 8 && index < 12 ? null : s.today })),
      },
    ],
  },
};

export const categories: ChartData = {
  xLabel: 'Building',
  series: [
    { id: 'hvac', label: 'HVAC', unit: 'MWh', points: [{ x: '1 WTC', y: 1840 }, { x: '120 Broadway', y: 1120 }, { x: '200 Vesey', y: 940 }] },
    { id: 'lighting', label: 'Lighting', unit: 'MWh', points: [{ x: '1 WTC', y: 760 }, { x: '120 Broadway', y: 480 }, { x: '200 Vesey', y: 410 }] },
    { id: 'plug', label: 'Plug load', unit: 'MWh', points: [{ x: '1 WTC', y: 640 }, { x: '120 Broadway', y: 390 }, { x: '200 Vesey', y: 350 }] },
  ],
};

export const sparklines = {
  rising: [3, 4, 4, 5, 6, 6, 7, 8, 9, 9, 10, 12],
  falling: [12, 11, 11, 9, 8, 8, 7, 6, 5, 4, 4, 3],
  flat: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  noisy: [4, 9, 3, 8, 5, 10, 2, 7, 6, 9, 3, 8],
  short: [2, 5],
};
