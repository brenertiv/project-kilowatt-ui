import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { useScoreAverage, useScores, type Scope } from '../api/queries';
import { combineStates, fromQuery } from '../api/state';
import type { IsoDate, ScoreKind, ScorePoint } from '../api/types';
import { Sparkline } from '../charts/Sparkline';
import type { ReferenceLine } from '../charts/theme';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { scoreHeadline, scoreRows } from './mappings';
import { scoreNames } from './ScoreTrendWidget';

export type ScoreSummaryWidgetProps = {
  /** Which score: `action` (maintenance), `tenant_billing`, `notification` (alerts), `insight` or `energy_star`. */
  kind: ScoreKind;
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The first day of the window, `YYYY-MM-DD`; the change is against the same-length window before it. */
  from: IsoDate;
  /** The last day of the window, `YYYY-MM-DD`, inclusive. */
  to: IsoDate;
  /** The card's title, in title case: `Maintenance`. */
  title: string;
  /** Up to two references for the sparkline, 0 to 100: a benchmark, or ENERGY STAR's median and certification. Keep it stable (a constant or `useMemo`). Default none. */
  references?: ReferenceLine[];
};

const points = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const change = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0, signDisplay: 'exceptZero' });
const noReferences: ReferenceLine[] = [];

/**
 * A score's headline with its trend: the recipe for the Summary board's Maintenance, Tenant Billing,
 * Alerts, Insights and Energy & ESG cards. It asks `/{kind}/score/average/` for the headline and its change
 * from the window before, and `/{kind}/score/?aggregate=true` for the sparkline, maps them with
 * `scoreHeadline` and `scoreRows`, and shows the score in points with a `Sparkline` on 0–100 under it.
 * One state covers both requests (`combineStates`).
 *
 * @summary A score's headline, its change and a sparkline, fetched and mapped from the API.
 * @import import { ScoreSummaryWidget } from 'src/widgets/ScoreSummaryWidget';
 */
export function ScoreSummaryWidget({ kind, scope, from, to, title, references = noReferences }: ScoreSummaryWidgetProps) {
  const params = { from_time: from, to_time: to };
  const average = useScoreAverage(kind, scope, params);
  const trend = useScores(kind, scope, { ...params, aggregate: true });
  const headline = average.data ? scoreHeadline(average.data) : { score: null, change: null };
  const rows = useMemo(() => scoreRows((trend.data ?? []) as ScorePoint[]), [trend.data]);
  const state = combineStates(
    fromQuery(average, { isEmpty: (data) => data.score === null }),
    fromQuery(trend, { isEmpty: (data) => scoreRows(data as ScorePoint[]).length === 0 }),
  );
  const name = scoreNames[kind].toLowerCase();
  // Intl writes a hyphen for minus in en-US; the real minus sign reads as one (Rules → Content and layout).
  const changeText = headline.change === null ? null : `${change.format(headline.change).replace('-', '\u2212')} points from the period before`;

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={160} loadingLabel={`Loading the ${name}`} emptyText={`No ${name} for this period.`}>
        <CardContent sx={{ pt: 0, pb: 1 }}>
          <Typography variant="h2" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {headline.score === null ? '—' : points.format(headline.score)}
            <Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>
              {' '}pts
            </Typography>
          </Typography>
          {changeText && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {changeText}
            </Typography>
          )}
        </CardContent>
        <Sparkline
          data={rows}
          field="score"
          name={scoreNames[kind]}
          unit="pts"
          min={0}
          max={100}
          references={references}
          summary={`The ${name} averaged ${headline.score ?? 'no'} points over the period${changeText ? `, ${changeText}` : ''}.`}
        />
      </AsyncContent>
    </Card>
  );
}
