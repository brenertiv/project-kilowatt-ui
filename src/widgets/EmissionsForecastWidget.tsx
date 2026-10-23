import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { useLocationData, type Scope } from '../api/queries';
import { fromQuery } from '../api/state';
import type { IsoDate } from '../api/types';
import { LineChart } from '../charts/LineChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { emissionsForecast } from './mappings';

export type EmissionsForecastWidgetProps = {
  /** The portfolio or building: `{ client: id }` or `{ location: id }`. */
  scope: Exclude<Scope, 'all'>;
  /** The first measured month, `YYYY-MM-DD`; at least two years before `to` for a projection. */
  from: IsoDate;
  /** The last day measured, `YYYY-MM-DD`. The current, partial month is projected rather than measured. */
  to: IsoDate;
  /** The card's title, in title case. Default `'Emissions Forecast'`. */
  title?: string;
};

const tonnes = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const series = (projectedFrom: number | undefined) => [{ field: 'emissions', name: 'Emissions', projectedFrom }];

/**
 * A portfolio's monthly emissions, measured and then projected a year ahead: the recipe for Emissions
 * Forecast. It asks `/location_data/?series=ghg`, maps it with `emissionsForecast` (like-for-like buildings,
 * full months only, each projected month the same month last year times the year's trend), and draws a
 * `LineChart` dashed from the first projected month. Buildings left out for gaps are named under the chart.
 *
 * @summary Monthly emissions measured and projected a year ahead, fetched and mapped from the API.
 * @import import { EmissionsForecastWidget } from 'src/widgets/EmissionsForecastWidget';
 */
export function EmissionsForecastWidget({ scope, from, to, title = 'Emissions Forecast' }: EmissionsForecastWidgetProps) {
  const query = useLocationData(scope, { series: 'ghg', interval: 'month', fromTime: from, toTime: to });
  const forecast = useMemo(() => (query.data ? emissionsForecast(query.data) : undefined), [query.data]);
  const lines = useMemo(() => series(forecast?.projectedFrom), [forecast?.projectedFrom]);
  const state = fromQuery(query, { isEmpty: (data) => emissionsForecast(data).rows.length === 0 });
  const last = forecast?.rows[forecast.rows.length - 1];
  const summary =
    forecast && last
      ? forecast.projectedFrom
        ? `Emissions are projected to reach ${tonnes.format(last.emissions)} tCO₂e a month by ${month.format(last.date)}.`
        : `Monthly emissions through ${month.format(last.date)}; there isn't enough history to project.`
      : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={256} loadingLabel="Loading emissions" emptyText="No emissions recorded for this period.">
        <LineChart data={forecast?.rows ?? []} series={lines} unit="tCO₂e" interval="month" summary={summary} />
        {forecast && forecast.excluded.length > 0 && (
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '75ch' }}>
              Left out for gaps in their records, so every month compares the same buildings: {forecast.excluded.join(', ')}.
            </Typography>
          </CardContent>
        )}
      </AsyncContent>
    </Card>
  );
}
