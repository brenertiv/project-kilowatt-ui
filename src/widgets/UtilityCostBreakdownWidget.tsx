import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import type { Scope } from '../api/queries';
import type { IsoDate } from '../api/types';
import { DonutChart } from '../charts/DonutChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { billingMonthName, useBilledLogs } from './billing';
import { utilityCostBreakdown } from './mappings';

export type UtilityCostBreakdownWidgetProps = {
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The first day of the window, `YYYY-MM-DD`. The card shows the latest billing month in it. */
  from: IsoDate;
  /** The last day of the window, `YYYY-MM-DD`. */
  to: IsoDate;
  /** The card's title, in title case. Default `'Utility Cost Breakdown'`. */
  title?: string;
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' });
/** Intl writes a hyphen for minus in en-US; the real minus sign reads as one. */
const minus = (text: string) => text.replace('-', '−');

/**
 * The latest billing month's utility cost by utility, and the balance billed against it: the recipe for
 * Utility Cost Breakdown. It asks `/submeter_log/` for the window, maps it with `utilityCostBreakdown`,
 * and draws a `DonutChart` (each utility in its slot), then the month, how many buildings are billed in it
 * so far, and what tenants were billed against what the utilities charged, with the net and the margin.
 *
 * @summary The latest billing month's utility cost by utility, with the balance billed against it, fetched and mapped from the API.
 * @import import { UtilityCostBreakdownWidget } from 'src/widgets/UtilityCostBreakdownWidget';
 */
export function UtilityCostBreakdownWidget({ scope, from, to, title = 'Utility Cost Breakdown' }: UtilityCostBreakdownWidgetProps) {
  const { logs, state } = useBilledLogs(scope, from, to);
  const breakdown = useMemo(() => (logs ? utilityCostBreakdown(logs) : undefined), [logs]);
  const slices = useMemo(() => breakdown?.slices ?? [], [breakdown]);
  const month = breakdown ? billingMonthName(breakdown.month) : '';
  const partial = breakdown && breakdown.buildingsBefore !== null && breakdown.buildings < breakdown.buildingsBefore;
  const rows: [string, string, boolean?][] = breakdown
    ? [
        ['Billed to tenants', usd.format(breakdown.billables)],
        ['Utility cost', usd.format(breakdown.utilities)],
        ['Net', minus(usd.format(breakdown.net)), breakdown.net < 0],
        ['Margin on utility cost', breakdown.margin === null ? '—' : minus(percent.format(breakdown.margin)), (breakdown.margin ?? 0) < 0],
      ]
    : [];
  const largest = [...slices].sort((a, b) => b.value - a.value)[0];
  const summary = breakdown && largest ? `${month}: ${usd.format(breakdown.utilities)} of utility cost, ${largest.category.toLowerCase()} the largest at ${usd.format(largest.value)}; tenants were billed ${usd.format(breakdown.billables)}.` : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={420} loadingLabel="Loading tenant billing" emptyText="No billing in this period.">
        <DonutChart data={slices} unit="USD" height={220} summary={summary} />
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {month}
            {partial ? `: ${breakdown.buildings} of ${breakdown.buildingsBefore} buildings billed so far` : ''}
          </Typography>
          <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 1, columnGap: 2, m: 0, mt: 1.5 }}>
            {rows.map(([label, value, loss]) => (
              <Box key={label} sx={{ display: 'contents' }}>
                <Typography component="dt" variant="body2" sx={{ color: 'text.secondary' }}>
                  {label}
                </Typography>
                {/* A loss is in error.main and signed, so the color isn't the only signal. */}
                <Typography component="dd" variant="body2" sx={{ m: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: loss ? 'error.main' : 'text.primary' }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </AsyncContent>
    </Card>
  );
}
