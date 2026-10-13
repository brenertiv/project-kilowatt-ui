import type { CursorPage, UtilityBill } from '../api/types';

/** The API gives no totals, so a count is what is on the page plus whether there is more. */
export function countOf(page: CursorPage<unknown> | undefined): { value: number | null; more: boolean } {
  if (!page) return { value: null, more: false };
  return { value: page.results.length, more: Boolean(page.next) };
}

/** Sum of the bills in the most recent billing month on the page. */
export function latestMonthSpend(bills: UtilityBill[] | undefined): { value: number | null; month: string | null } {
  if (!bills || bills.length === 0) return { value: null, month: null };
  const month = bills
    .map((bill) => bill.end_date.slice(0, 7))
    .sort()
    .at(-1)!;
  const value = bills.filter((bill) => bill.end_date.startsWith(month)).reduce((sum, bill) => sum + bill.total_cost, 0);
  return { value, month };
}

/** Work-order statuses that still need someone: Open, In Progress, On Hold, Requires Attention. */
export const activeActionStatuses = '1,2,6,7';
