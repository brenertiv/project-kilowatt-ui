import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import type { Scope } from '../api/queries';
import type { IsoDate } from '../api/types';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { burnRate } from './mappings';
import { emptyWhenNone, useCommittedProjects } from './planning';

export type BurnRateWidgetProps = {
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The day spend is counted to, `YYYY-MM-DD`: costs dated on or before it are spent. Default today. */
  asOf?: IsoDate;
  /** The card's title, in title case. Default `'Carbon Budget Burn Rate'`. */
  title?: string;
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const tonnes = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });

/**
 * How much of a portfolio's committed capital is spent: the recipe for Carbon Budget Burn Rate. It asks
 * `/project/` (with costs) and `/budget/` at the scope, keeps the projects in approved budgets, maps them
 * with `burnRate`, and shows the spend against the total as a determinate `LinearProgress`, with the
 * amounts written out beside it and under it. The CO₂ row appears only when a project with spend so far
 * carries an estimate.
 *
 * @summary Committed capital spent so far, as a progress bar with the amounts, fetched and mapped from the API.
 * @import import { BurnRateWidget } from 'src/widgets/BurnRateWidget';
 */
export function BurnRateWidget({ scope, asOf = new Date().toISOString().slice(0, 10), title = 'Carbon Budget Burn Rate' }: BurnRateWidgetProps) {
  const { committed, state } = useCommittedProjects(scope);
  const rate = useMemo(() => burnRate(committed, asOf), [committed, asOf]);
  const rows: [string, string][] = [
    ['Spent to date', usd.format(rate.spent)],
    ['Remaining', usd.format(rate.remaining)],
    ['Plan total', usd.format(rate.total)],
    ...(rate.co2AvoidedKg === undefined ? [] : [['CO₂ avoided a year', `${tonnes.format(rate.co2AvoidedKg / 1000)} tCO₂e`] as [string, string]]),
  ];

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <CardContent sx={{ pt: 0 }}>
        <AsyncContent state={emptyWhenNone(state, rate.total)} height={168} inset={0} loadingLabel="Loading capital plans" emptyText="No committed capital to spend.">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 2, mb: 1 }}>
            <Typography id="burn-rate-label" variant="body2">
              Committed capital spent
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
              {usd.format(rate.spent)} of {usd.format(rate.total)}
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={Math.round(rate.share * 100)} aria-labelledby="burn-rate-label" aria-valuetext={`${percent.format(rate.share)} spent`} />
          <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 1, columnGap: 2, m: 0, mt: 2 }}>
            {rows.map(([label, value]) => (
              <Box key={label} sx={{ display: 'contents' }}>
                <Typography component="dt" variant="body2" sx={{ color: 'text.secondary' }}>
                  {label}
                </Typography>
                <Typography component="dd" variant="body2" sx={{ m: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </AsyncContent>
      </CardContent>
    </Card>
  );
}
