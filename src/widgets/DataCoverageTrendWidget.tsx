import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useAccountCoverage, useMeterCoverage, usePmTypesOfMeter, type Scope } from '../api/queries';
import { combineStates, fromQuery } from '../api/state';
import type { IsoDate } from '../api/types';
import { LineChart } from '../charts/LineChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { coverageByMonth } from './mappings';

export type DataCoverageTrendWidgetProps = {
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The first day of the window, `YYYY-MM-DD`. */
  from: IsoDate;
  /** The last day of the window, `YYYY-MM-DD`. */
  to: IsoDate;
  /** Today, `YYYY-MM-DD`: its month and later are left out, since their bills haven't arrived. Default today. */
  asOf?: IsoDate;
  /** The card's title, in title case. Default `'Data Coverage Trend'`. */
  title?: string;
};

const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * How much of each month has bills behind it, utility by utility: the recipe for Data Coverage Trend. It
 * asks `/pm_meter/data_coverage/` and `/location_utility_account/data_coverage/` for the window and
 * `/pm_type_of_meter/` for each meter's utility, maps them with `coverageByMonth` (a day covered when every
 * meter active that day is billed for it, averaged over buildings), and draws a `LineChart` from 0 to 100%,
 * one line per utility in its slot. The month still being billed is left out.
 *
 * @summary Monthly data coverage per utility, from meter and utility-account bills, fetched and mapped from the API.
 * @import import { DataCoverageTrendWidget } from 'src/widgets/DataCoverageTrendWidget';
 */
export function DataCoverageTrendWidget({ scope, from, to, asOf = new Date().toISOString().slice(0, 10), title = 'Data Coverage Trend' }: DataCoverageTrendWidgetProps) {
  const window = { data_coverage_start_date: from, data_coverage_end_date: to, page_size: 500 };
  const meters = useMeterCoverage(scope, { ...window, type: true });
  const accounts = useAccountCoverage(scope, { ...window, utility_bill_type: true });
  const types = usePmTypesOfMeter();
  const coverage = useMemo(
    () => (meters.data && accounts.data && types.data ? coverageByMonth(meters.data.results, accounts.data.results, types.data, asOf) : undefined),
    [meters.data, accounts.data, types.data, asOf],
  );
  const rows = coverage?.rows ?? [];
  const state = combineStates(fromQuery(meters), fromQuery(accounts), fromQuery(types));
  const last = rows[rows.length - 1];
  const summary = last
    ? `In ${monthName.format(last.date)}, ${coverage!.series
        .filter(({ field }) => last[field] !== undefined)
        .map(({ name, field }) => `${name.toLowerCase()} was ${percent.format(last[field]!)}% covered`)
        .join(', ')}.`
    : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent
        state={state.status === 'ready' && rows.length === 0 ? { status: 'empty' } : state}
        height={296}
        loadingLabel="Loading data coverage"
        emptyText="No ENERGY STAR meters or utility accounts to measure coverage for."
      >
        <LineChart data={rows} series={coverage?.series ?? []} unit="%" interval="month" max={100} summary={summary} />
      </AsyncContent>
    </Card>
  );
}
