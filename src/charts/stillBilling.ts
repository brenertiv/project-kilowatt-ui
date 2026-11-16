/**
 * The still-being-billed mark (Rules → Charts): on a monthly chart of billed data, a trailing month with
 * bills for fewer than nine in ten of the properties in scope is drawn dashed in its own hue and says
 * "Still being billed: 9 of 18 properties", in its tooltip and in a line under the chart. Once the month
 * passes nine in ten it draws solid. `LineChart`, `ColumnChart` and `MonthLinesChart` take the months as
 * `stillBilling`; this file holds the rule and the words, so every chart and mapping uses one version.
 */

/** A trailing month that is still being billed, and how far its billing has got. */
export type StillBilling = {
  /** The month: its label on a category axis (`ColumnChart`, `MonthLinesChart`), or its UTC timestamp on a date axis (`LineChart`). */
  month: string | number;
  /** How many of the properties in scope have a bill for the month so far. */
  billed: number;
  /** How many properties are in scope. */
  properties: number;
};

/** The share of the properties in scope a month needs bills from before it draws solid: nine in ten. */
export const billedShare = 0.9;

/**
 * Whether a month is still being billed: fewer than nine in ten of the properties in scope have a bill for it.
 *
 * @param billed - The properties with a bill for the month.
 * @param properties - The properties in scope.
 */
export function isStillBilling(billed: number, properties: number): boolean {
  return properties > 0 && billed < properties * billedShare;
}

const count = new Intl.NumberFormat();

/** What a month still being billed says in its tooltip: "Still being billed: 9 of 18 properties". */
export function stillBillingNote({ billed, properties }: Pick<StillBilling, 'billed' | 'properties'>): string {
  return `Still being billed: ${count.format(billed)} of ${count.format(properties)} ${properties === 1 ? 'property' : 'properties'}`;
}

/**
 * The line under the chart: the tooltip's words for one month, and each month named with its count for several
 * ("Still being billed: Sep, 15 of 18 properties; Oct, 9 of 18 properties").
 *
 * @param months - The months still being billed, oldest first.
 * @param label - A month's name as the chart's axis writes it.
 */
export function stillBillingCaption(months: StillBilling[], label: (month: StillBilling['month']) => string): string | undefined {
  if (!months.length) return undefined;
  if (months.length === 1) return stillBillingNote(months[0]!);
  return `Still being billed: ${months.map((month) => `${label(month.month)}, ${stillBillingNote(month).replace('Still being billed: ', '')}`).join('; ')}`;
}

/** The dash a still-being-billed month is drawn with, as a projected stretch is. */
export const stillBillingDash = [4, 4];
