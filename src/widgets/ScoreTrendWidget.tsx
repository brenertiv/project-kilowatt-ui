import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useScores, type Scope } from '../api/queries';
import { fromQuery } from '../api/state';
import type { IsoDate, ScoreKind, ScorePoint } from '../api/types';
import { LineChart } from '../charts/LineChart';
import { scoreBands } from '../charts/meanings';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { scoreRows } from './mappings';

/** What each kind of score is called, in sentence case, for legends, tooltips and summaries. */
export const scoreNames: Record<ScoreKind, string> = {
  action: 'Maintenance score',
  tenant_billing: 'Tenant billing score',
  notification: 'Alerts score',
  insight: 'Insights score',
  energy_star: 'ENERGY STAR score',
};

export type ScoreTrendWidgetProps = {
  /** Which score: `action` (maintenance), `tenant_billing`, `notification` (alerts), `insight` or `energy_star`. */
  kind: ScoreKind;
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The first day shown, `YYYY-MM-DD`. The dashboard sets the window for every widget. */
  from: IsoDate;
  /** The last day shown, `YYYY-MM-DD`, inclusive. */
  to: IsoDate;
  /** The card's title, in title case: `Maintenance Score Trend`. */
  title: string;
  /** The benchmark the score is read against, 0 to 100, drawn as a dashed reference. Default none. */
  benchmark?: number;
};

const series = (kind: ScoreKind) => [{ field: 'score', name: scoreNames[kind], bands: scoreBands, markers: 'last' as const }];

/**
 * A score's daily trend, read against its bands and a benchmark: the recipe for Maintenance Score Trend
 * and Tenant Billing Score Trend. It asks `/{kind}/score/?aggregate=true` for the window, maps it with
 * `scoreRows` (0–1 to points, days without a score left out), and draws a `LineChart` colored by
 * `scoreBands`, its axis fixed at 0–100, the latest day marked. Loading, empty, failed and no-access states
 * come from `AsyncContent`.
 *
 * @summary A score's daily trend in its bands, against a benchmark, fetched and mapped from the API.
 * @import import { ScoreTrendWidget } from 'src/widgets/ScoreTrendWidget';
 */
export function ScoreTrendWidget({ kind, scope, from, to, title, benchmark }: ScoreTrendWidgetProps) {
  const query = useScores(kind, scope, { from_time: from, to_time: to, aggregate: true });
  const rows = useMemo(() => scoreRows((query.data ?? []) as ScorePoint[]), [query.data]);
  const lines = useMemo(() => series(kind), [kind]);
  const references = useMemo(() => (benchmark === undefined ? [] : [{ value: benchmark, label: 'Benchmark' }]), [benchmark]);
  const state = fromQuery(query, { isEmpty: (data) => scoreRows(data as ScorePoint[]).length === 0 });
  const summary = useMemo(() => {
    if (!rows.length) return '';
    const scores = rows.map(({ score }) => score);
    const latest = scores[scores.length - 1];
    const against = benchmark === undefined ? '' : `, ${latest! >= benchmark ? 'above' : 'below'} the ${benchmark}-point benchmark`;
    return `The ${scoreNames[kind].toLowerCase()} is ${latest}${against}; it ranged from ${Math.min(...scores)} to ${Math.max(...scores)} over the period.`;
  }, [rows, kind, benchmark]);

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={256} loadingLabel={`Loading the ${scoreNames[kind].toLowerCase()}`} emptyText="No scores for this period.">
        <LineChart data={rows} series={lines} unit="pts" max={100} references={references} summary={summary} />
      </AsyncContent>
    </Card>
  );
}
