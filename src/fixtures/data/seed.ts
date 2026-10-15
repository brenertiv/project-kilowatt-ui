import type { IsoDate, IsoDateTime, Uuid } from '../../api/types';

/**
 * Deterministic helpers for synthesized sample data. Every build of the
 * sample portfolio yields the same records, so stories, tests and
 * screenshots stay stable.
 */

export type Rng = () => number;

/** mulberry32: small, fast, and good enough for sample data. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function int(random: Rng, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

export function pick<T>(random: Rng, list: readonly T[]): T {
  return list[Math.floor(random() * list.length)]!;
}

export function chance(random: Rng, probability: number): boolean {
  return random() < probability;
}

export function uuid(random: Rng): Uuid {
  const hex = () => Math.floor(random() * 16).toString(16);
  const run = (length: number) => Array.from({ length }, hex).join('');
  return `${run(8)}-${run(4)}-4${run(3)}-${pick(random, ['8', '9', 'a', 'b'])}${run(3)}-${run(12)}`;
}

/** The sample portfolio's "today". All offsets count from here. */
export const today = { year: 2026, month: 10, day: 13 } as const;

/** Operations time zone offset the API reports on its timestamps. */
const offset = '-04:00';

const pad = (value: number, width = 2) => String(value).padStart(width, '0');

function localDate(dayOffset: number, hour = 0, minute = 0, second = 0): Date {
  return new Date(Date.UTC(today.year, today.month - 1, today.day + dayOffset, hour, minute, second));
}

/** A calendar date some days from today. */
export function day(dayOffset: number): IsoDate {
  const date = localDate(dayOffset);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** A timestamp some days from today at a local wall-clock time, with the API's offset and microseconds. */
export function at(dayOffset: number, hour = 9, minute = 0, second = 0, micro = 0): IsoDateTime {
  const date = localDate(dayOffset, hour, minute, second);
  return `${day(dayOffset)}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.${pad(micro, 6)}${offset}`;
}

/** First day of a month some months back, as a calendar date. */
export function monthStart(monthsBack: number): IsoDate {
  const date = new Date(Date.UTC(today.year, today.month - 1 - monthsBack, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-01`;
}

/** Last day of the month that starts on `start`. */
export function monthEnd(start: IsoDate): IsoDate {
  const [year, month] = start.split('-').map(Number) as [number, number];
  const date = new Date(Date.UTC(year, month, 0));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}
