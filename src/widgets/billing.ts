import { useSubmeterLogs, type Scope } from '../api/queries';
import { fromQuery } from '../api/state';
import type { IsoDate } from '../api/types';

/**
 * The submeter logs the tenant billing recipes share: one request per scope and window, with every figure
 * and the utility types, so the cards of one board draw from one cached response.
 */
export function useBilledLogs(scope: Scope, from: IsoDate, to: IsoDate) {
  // The submeter routes take dates as YYYYMMDD.
  const compact = (day: IsoDate) => day.replaceAll('-', '');
  const query = useSubmeterLogs(scope, {
    page_size: 500,
    properties: true,
    utility_type: true,
    submeter_bills: false,
    utility_bills: false,
    fromTime: compact(from),
    toTime: compact(to),
  });
  return { logs: query.data?.results, state: fromQuery(query) };
}

const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** A billing month, `YYYY-MM`, as people write it: `October 2026`. */
export const billingMonthName = (month: string) => monthName.format(new Date(`${month}-01T00:00:00Z`));
