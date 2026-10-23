import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import type { Uuid } from '../api/types';
import { ColumnChart } from '../charts/ColumnChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { spendAndSavings } from './mappings';
import { useApprovedPlans } from './planning';

export type SpendSavingsWidgetProps = {
  /** The portfolio, as its client id. Carbon plans belong to a portfolio, so there is no building scope. */
  client: Uuid;
  /** The card's title, in title case. Default `'Spend and Savings'`. */
  title?: string;
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const series = [
  { field: 'spend', name: 'Project spend' },
  { field: 'savings', name: 'Energy-cost savings' },
];

/**
 * What a portfolio's approved carbon plans spend and save each year: the recipe for Spend and Savings
 * (Carbon Planning). It asks `/client/{id}/carbon_planner/` for the plans and
 * `/budget/{id}/carbon_planner/chart-data/` for each approved one, maps them with `spendAndSavings`
 * (each year's savings from the running total), and draws a side-by-side `ColumnChart` in US dollars.
 * Plans under review don't count; with none approved, the card says so.
 *
 * @summary Approved carbon plans' yearly spend against savings, fetched and mapped from the API.
 * @import import { SpendSavingsWidget } from 'src/widgets/SpendSavingsWidget';
 */
export function SpendSavingsWidget({ client, title = 'Spend and Savings' }: SpendSavingsWidgetProps) {
  const { charts, state } = useApprovedPlans(client);
  const rows = useMemo(() => (charts ? spendAndSavings(charts) : []), [charts]);
  const spend = rows.reduce((sum, row) => sum + row.spend, 0);
  const last = rows[rows.length - 1];
  const summary = last ? `The approved plans spend ${usd.format(spend)} from ${rows[0]!.year} to ${last.year}, and save ${usd.format(last.savings)} a year by ${last.year}.` : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={296} loadingLabel="Loading carbon plans" emptyText="No approved carbon plans yet.">
        <ColumnChart data={rows} categoryField="year" series={series} unit="USD" summary={summary} />
      </AsyncContent>
    </Card>
  );
}
