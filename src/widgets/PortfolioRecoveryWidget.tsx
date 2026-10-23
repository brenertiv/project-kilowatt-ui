import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { Scope } from '../api/queries';
import type { IsoDate } from '../api/types';
import { LineChart } from '../charts/LineChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { billingMonthName, useBilledLogs } from './billing';
import { recoveryByMonth } from './mappings';

export type PortfolioRecoveryWidgetProps = {
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The first day of the window, `YYYY-MM-DD`. */
  from: IsoDate;
  /** The last day of the window, `YYYY-MM-DD`. */
  to: IsoDate;
  /** The card's title, in title case. Default `'Portfolio Recovery'`. */
  title?: string;
};

/** One decimal always, so the table's column lines up. */
const percent = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * How much of their utility cost buildings recover from tenants, month by month, and by property: the
 * recipe for Portfolio Recovery. It asks `/submeter_log/` for the window, maps it with `recoveryByMonth`,
 * and draws a `LineChart` in percent, dashed for a month still being billed (fewer buildings than the month
 * before), with a table of each property's recovery in the last complete month, lowest first.
 *
 * @summary Monthly tenant recovery of utility cost, with recovery by property, fetched and mapped from the API.
 * @import import { PortfolioRecoveryWidget } from 'src/widgets/PortfolioRecoveryWidget';
 */
export function PortfolioRecoveryWidget({ scope, from, to, title = 'Portfolio Recovery' }: PortfolioRecoveryWidgetProps) {
  const { logs, state } = useBilledLogs(scope, from, to);
  const recovery = useMemo(() => (logs ? recoveryByMonth(logs) : undefined), [logs]);
  const series = useMemo(() => [{ field: 'recovery', name: 'Recovery', projectedFrom: recovery?.incompleteFrom, projectedNote: 'incomplete month', markers: 'all' as const }], [recovery?.incompleteFrom]);
  const rows = recovery?.rows ?? [];
  const complete = recovery?.completeMonth ? billingMonthName(recovery.completeMonth) : '';
  const lowest = recovery?.byProperty[0];
  const latest = rows.find(({ date }) => date === Date.parse(`${recovery?.completeMonth}-01T00:00:00Z`));
  const summary = latest && lowest
    ? `Tenants were billed ${percent.format(latest.recovery)}% of utility cost in ${complete}; ${lowest.building} recovered the least, ${percent.format(lowest.recovery)}%.${recovery?.incompleteFrom ? ' The latest month is still being billed.' : ''}`
    : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={480} loadingLabel="Loading tenant billing" emptyText="No billing in this period.">
        <LineChart data={rows} series={series} unit="%" interval="month" summary={summary} />
        {recovery && recovery.byProperty.length > 0 && (
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="subtitle2" component="h3" id="recovery-by-property">
              Recovery by property, {complete}
            </Typography>
            <Table aria-labelledby="recovery-by-property">
              <TableHead>
                <TableRow>
                  <TableCell>Property</TableCell>
                  <TableCell align="right">Recovery</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recovery.byProperty.map(({ building, recovery: value }) => (
                  <TableRow key={building}>
                    <TableCell>{building}</TableCell>
                    <TableCell align="right">{percent.format(value)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </AsyncContent>
    </Card>
  );
}
