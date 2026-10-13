import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { AsyncState } from '../../api/state';
import { TrendDownIcon, TrendUpIcon } from '../../icons';
import { formatDelta, formatUnit, type Unit } from '../../lib/format';
import { ErrorState } from './ErrorState';
import { StatSkeleton } from './Skeletons';
import { noValue } from './dateFormat';

export type StatCardProps = {
  label: ReactNode;
  value: number | null | undefined;
  unit: Unit;
  compact?: boolean;
  /** Change against the comparison period, in `deltaUnit` (a fraction for percent). */
  delta?: number | null;
  deltaUnit?: Unit;
  /** Which way is good. Energy use going down is good; revenue going up is good. */
  goodDirection?: 'up' | 'down' | 'none';
  /** The comparison period, e.g. "vs last 30 days". */
  period?: ReactNode;
  icon?: ReactNode;
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

/** One number that matters, with its unit, its change, and the period the change is measured against. */
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
  const status = state?.status ?? 'ready';
  const hasValue = typeof value === 'number' && Number.isFinite(value);

  let body: ReactNode;
  if (status === 'loading') body = <StatSkeleton />;
  else if (status === 'error') body = <ErrorState message={state?.error} onRetry={state?.onRetry} compact />;
  else {
    body = (
      <Stack
        spacing={1}
        aria-busy={status === 'fetching' || undefined}
        sx={{ opacity: status === 'fetching' ? 0.6 : 1, transition: 'opacity 150ms' }}
      >
        <Typography variant="overline" component="p" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="h3"
          component="p"
          sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1.1 }}
          aria-label={hasValue ? undefined : t('data.noValue')}
        >
          {hasValue ? formatUnit(value, unit, { compact }) : noValue}
        </Typography>
        {typeof delta === 'number' || period ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            {typeof delta === 'number' && hasValue ? (
              <Box
                component="span"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: deltaTone(delta, goodDirection) }}
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
    );
  }

  return (
    <Card>
      <CardContent sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', '&:last-child': { pb: 4 } }}>
        {icon ? <Box sx={{ color: 'text.secondary', display: 'flex', pt: 0.5 }}>{icon}</Box> : null}
        <Box sx={{ minWidth: 0, flex: 1 }}>{body}</Box>
      </CardContent>
    </Card>
  );
}
