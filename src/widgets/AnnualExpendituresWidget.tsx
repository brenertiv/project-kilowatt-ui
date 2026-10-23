import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import type { Scope } from '../api/queries';
import { ColumnChart } from '../charts/ColumnChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { annualExpenditures } from './mappings';
import { emptyWhenNone, useCommittedProjects } from './planning';

export type AnnualExpendituresWidgetProps = {
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The card's title, in title case. Default `'Total Annual Expenditures'`. */
  title?: string;
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * Committed capital spend by year, stacked by property: the recipe for Total Annual Expenditures. It
 * asks `/project/` (with costs and properties) and `/budget/` at the scope, keeps the projects in approved
 * budgets (`approvedProjects`), maps them with `annualExpenditures`, and draws a stacked `ColumnChart` in
 * US dollars. Past six properties, the smallest are grouped into Other rather than given more colors.
 *
 * @summary Committed capital spend by year, stacked by property, fetched and mapped from the API.
 * @import import { AnnualExpendituresWidget } from 'src/widgets/AnnualExpendituresWidget';
 */
export function AnnualExpendituresWidget({ scope, title = 'Total Annual Expenditures' }: AnnualExpendituresWidgetProps) {
  const { committed, state } = useCommittedProjects(scope);
  const { rows, series } = useMemo(() => annualExpenditures(committed), [committed]);
  const total = rows.reduce((sum, row) => sum + series.reduce((s, { field }) => s + Number((row as Record<string, unknown>)[field] ?? 0), 0), 0);
  const summary = rows.length
    ? `${usd.format(total)} of capital is committed across ${series.length} ${series.length === 1 ? 'property' : 'properties'} from ${rows[0]!.year} to ${rows[rows.length - 1]!.year}; ${series[0]!.name} has the most.`
    : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={emptyWhenNone(state, rows.length)} height={336} loadingLabel="Loading capital plans" emptyText="No committed capital spend.">
        <ColumnChart data={rows} categoryField="year" series={series} unit="USD" stacked height={280} summary={summary} />
      </AsyncContent>
    </Card>
  );
}
