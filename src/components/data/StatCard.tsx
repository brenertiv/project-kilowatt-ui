import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { AsyncState } from '../../api/state';
import { TrendDownIcon, TrendUpIcon } from '../../icons';
import { formatDelta, formatUnit, type Unit } from '../../lib/format';
import { DataState } from './DataState';
import { StatSkeleton } from './Skeletons';
import { noValue } from './dateFormat';

export type StatCardProps = {
  /** What the number measures, e.g. "Consumption, last 30 days". Rendered as an overline. */
  label: ReactNode;
  /** The number. `null` or `undefined` shows the no-value dash, for a metric with no reading yet. */
  value: number | null | undefined;
  /** How `value` is formatted: energy, demand, money, a percentage, a count or a score. */
  unit: Unit;
  /** Abbreviates large values (88.2K instead of 88,200.87). Use for money and big totals in tight grids. */
  compact?: boolean;
  /** Change against the comparison period, in `deltaUnit` (a fraction for percent). */
  delta?: number | null;
  deltaUnit?: Unit;
  /** Which way is good. Energy use going down is good; revenue going up is good. */
  goodDirection?: 'up' | 'down' | 'none';
  /** The comparison period, e.g. "vs last 30 days". */
  period?: ReactNode;
  /** A leading icon from `src/icons.tsx` that names the subject, e.g. `<BuildingIcon />`. */
  icon?: ReactNode;
  /** The async state of the data behind the card. Rendered through `DataState`: loading shows a `StatSkeleton`, fetching dims the card, error shows a retry. Empty and idle show the card with its value (or the dash). Defaults to ready. */
  state?: AsyncState;
};

function deltaTone(
  delta: number,
  goodDirection: StatCardProps['goodDirection'],
): 'success.main' | 'error.main' | 'text.secondary' {
  if (delta === 0 || goodDirection === 'none') return 'text.secondary';
  const up = delta > 0;
  return (up && goodDirection === 'up') || (!up && goodDirection === 'down') ? 'success.main' : 'error.main';
}

/**
 * One number that matters, with its unit, its change, and the period the change is measured against.
 * Use it for the headline metrics at the top of a page or dashboard, in a grid of three to six. For a
 * number inside a table, use `NumericCell` or `DeltaCell` instead.
 *
 * @summary A headline metric card: label, formatted value, colored delta and comparison period.
 * @import import { StatCard } from 'src/components/data';
 */
export function StatCard({
  label,
  value,
  unit,
  compact,
  delta,
  deltaUnit = 'percent',
  goodDirection = 'none',
  period,
  icon,
  state,
}: StatCardProps) {
  const { t } = useTranslation();
  const hasValue = typeof value === 'number' && Number.isFinite(value);
  // A metric with nothing behind it still shows its label and the no-value dash, so empty and idle draw as ready.
  const cardState: AsyncState =
    !state || state.status === 'empty' || state.status === 'idle' ? { ...state, status: 'ready' } : state;

  return (
    <Card>
      <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', '&:last-child': { pb: 2 } }}>
        {icon ? <Box sx={{ color: 'text.secondary', display: 'flex', pt: 0.25 }}>{icon}</Box> : null}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <DataState state={cardState} skeleton={<StatSkeleton />}>
            <Stack spacing={0.5}>
              <Typography variant="overline" component="p" color="text.secondary">
                {label}
              </Typography>
              <Typography
                variant="h3"
                component="p"
                sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                {hasValue ? (
                  formatUnit(value, unit, { compact })
                ) : (
                  // A paragraph may not carry aria-label, so the spoken "No value" is hidden text beside the dash.
                  <>
                    <span aria-hidden="true">{noValue}</span>
                    <Box component="span" sx={visuallyHidden}>{t('data.noValue')}</Box>
                  </>
                )}
              </Typography>
              {typeof delta === 'number' || period ? (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                  {typeof delta === 'number' && hasValue ? (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.25,
                        color: deltaTone(delta, goodDirection),
                      }}
                    >
                      {delta > 0 ? <TrendUpIcon /> : delta < 0 ? <TrendDownIcon /> : null}
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ fontVariantNumeric: 'tabular-nums', color: 'inherit' }}
                      >
                        {formatDelta(delta, deltaUnit)}
                      </Typography>
                      <Box
                        component="span"
                        sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
                      >
                        {delta > 0 ? t('data.delta.up') : delta < 0 ? t('data.delta.down') : t('data.delta.flat')}
                      </Box>
                    </Box>
                  ) : null}
                  {period ? (
                    <Typography variant="body2" component="span">
                      {period}
                    </Typography>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </DataState>
        </Box>
      </CardContent>
    </Card>
  );
}
