import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import type { Scope } from '../api/queries';
import { ColumnChart } from '../charts/ColumnChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { expendituresByType } from './mappings';
import { emptyWhenNone, useCommittedProjects } from './planning';

export type ExpendituresBreakdownWidgetProps = {
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The card's title, in title case. Default `'Total Expenditures Breakdown'`. */
  title?: string;
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const series = [{ field: 'spend', name: 'Committed spend' }];

/** The height a bar takes, so the chart grows with the number of project types rather than squeezing them. */
const barHeight = 32;

/**
 * Committed capital spend ranked by project type: the recipe for Total Expenditures Breakdown. It asks
 * `/project/` (with costs and types) and `/budget/` at the scope, keeps the projects in approved budgets,
 * maps them with `expendituresByType`, and draws a horizontal `ColumnChart`: one series in one color,
 * largest first, so the bars read as a ranking.
 *
 * @summary Committed capital spend ranked by project type as horizontal bars, fetched and mapped from the API.
 * @import import { ExpendituresBreakdownWidget } from 'src/widgets/ExpendituresBreakdownWidget';
 */
export function ExpendituresBreakdownWidget({ scope, title = 'Total Expenditures Breakdown' }: ExpendituresBreakdownWidgetProps) {
  const { committed, state } = useCommittedProjects(scope);
  const rows = useMemo(() => expendituresByType(committed), [committed]);
  const height = Math.max(160, rows.length * barHeight + 48);
  const summary = rows.length
    ? `${rows[0]!.type} has the most committed spend, ${usd.format(rows[0]!.spend)}, of ${rows.length} project types.`
    : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={emptyWhenNone(state, rows.length)} height={height + 16} loadingLabel="Loading capital plans" emptyText="No committed capital spend.">
        <ColumnChart data={rows} categoryField="type" series={series} unit="USD" horizontal height={height} summary={summary} />
      </AsyncContent>
    </Card>
  );
}
