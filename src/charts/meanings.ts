import type { StatusBand } from './LineChart';
import type { ChartStatus } from './theme';

/**
 * Enertiv's product meanings, each assigned once to a chart color role (Rules → Charts → Meaning is
 * an assignment, not a color), so electricity or a reactive work order is the same color on every
 * chart. Charts take these as a series `slot` or a status; none of them is a color.
 *
 * Every map is keyed on the API's own name for the thing (`utility_type.name`, `action_type.name`,
 * `action_status.name`), never on a translated label: look up by the API name and translate only what's shown.
 */

/** A utility type's series slot, by its API name. A utility not listed here is drawn `neutral`. */
export const utilitySlots: Record<string, number> = {
  Electricity: 0,
  Steam: 1,
  Water: 2,
  Sanitation: 4,
  'Natural Gas': 5,
};

/**
 * A work-order type's series slot, by its API name. The API has seven types and the palette six hues,
 * so Survey, the rarest, is drawn `neutral`; a chart of all seven groups the smallest into "Other".
 */
export const workOrderTypeSlots: Record<string, number> = {
  Preventative: 0,
  Reactive: 1,
  Inspection: 2,
  Rounds: 3,
  Installation: 4,
  'Meter Reading': 5,
};

/**
 * A work-order status's intent, by its API name, for a chart colored by status: the statuses that
 * need someone's attention take an intent, and the rest are drawn `neutral`. Seven statuses don't fit
 * four intents one to one, so a status chart always labels its parts as well (a legend or direct labels).
 */
export const workOrderStatusIntents: Record<string, ChartStatus | 'neutral'> = {
  Open: 'neutral',
  'In Progress': 'info',
  'On Hold': 'neutral',
  'Requires Attention': 'warning',
  Completed: 'success',
  Expired: 'error',
  Cancelled: 'neutral',
};

/**
 * A series' color for a product meaning: its `slot` when the meaning has one, `neutral` otherwise,
 * spread straight into a `LineSeries` or `ColumnSeries`.
 *
 * @param slots - One of the slot maps above.
 * @param name - The API's name for the meaning: `Natural Gas`, not a translation of it.
 */
export function meaningColor(slots: Record<string, number>, name: string): { slot: number } | { neutral: true } {
  const slot = slots[name];
  return slot === undefined ? { neutral: true } : { slot };
}

/**
 * The bands Enertiv's 0–100 scores are read in (maintenance, tenant billing, alerts, insights), from
 * best to worst, for a `LineSeries`' `bands`. Excellent and good share `success`, and poor and critical
 * share `error`; the tooltip names the band, so the color is never the only signal.
 */
export const scoreBands: StatusBand[] = [
  { from: 80, to: 100, status: 'success', label: 'Excellent' },
  { from: 70, to: 80, status: 'success', label: 'Good' },
  { from: 50, to: 70, status: 'warning', label: 'Fair' },
  { from: 30, to: 50, status: 'error', label: 'Poor' },
  { from: 0, to: 30, status: 'error', label: 'Critical' },
];
