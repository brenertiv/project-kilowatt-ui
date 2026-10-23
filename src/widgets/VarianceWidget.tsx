import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useLocationData, type Scope } from '../api/queries';
import { combineStates, fromQuery } from '../api/state';
import type { LocationDataSeries } from '../api/types';
import { Heatmap } from '../charts/Heatmap';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { varianceGrid } from './mappings';

export type VarianceWidgetProps = {
  /** The portfolio or building: `{ client: id }` for one row per building, `{ location: id }` for one. */
  scope: Exclude<Scope, 'all'>;
  /** The year shown, compared month by month with the year before. */
  year: number;
  /** Which use: `energy` (kBtu), `electricity`, `natural_gas`, `water` or `ghg`. Default `'energy'`. */
  series?: LocationDataSeries;
  /** The card's title, in title case. Default `'Usage Tracking'`. */
  title?: string;
};

const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, signDisplay: 'exceptZero' });

/**
 * Each building's use against the same month a year before: the recipe for Variance Tracking. It asks
 * `/location_data/` for the year and the year before, maps them with `varianceGrid` (the change in percent,
 * partial months scaled by their coverage, months with nothing to compare marked no data), and draws a
 * diverging `Heatmap`, capped at ±15%.
 *
 * @summary Each building's monthly use against last year as a diverging heatmap, fetched and mapped from the API.
 * @import import { VarianceWidget } from 'src/widgets/VarianceWidget';
 */
export function VarianceWidget({ scope, year, series = 'energy', title = 'Usage Tracking' }: VarianceWidgetProps) {
  const window = (y: number) => ({ series, interval: 'month' as const, fromTime: `${y}-01-01`, toTime: `${y}-12-31` });
  const current = useLocationData(scope, window(year));
  const previous = useLocationData(scope, window(year - 1));
  const grid = useMemo(() => (current.data && previous.data ? varianceGrid(current.data, previous.data) : undefined), [current.data, previous.data]);
  const state = combineStates(
    fromQuery(current, { isEmpty: (data) => data.locations.every(({ points }) => points.length === 0) }),
    fromQuery(previous, { isEmpty: () => false }),
  );
  const summary = useMemo(() => {
    const valued = grid?.cells.filter((cell) => cell.value !== undefined) ?? [];
    if (!valued.length) return '';
    const worst = valued.reduce((max, cell) => (cell.value! > max.value! ? cell : max));
    const lower = valued.filter((cell) => cell.value! < 0).length;
    return `${lower} of ${valued.length} building-months used less than in ${year - 1}; ${worst.row} changed most, ${percent.format(worst.value!)}% in ${worst.column}.`;
  }, [grid, year]);

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={320} loadingLabel="Loading usage" emptyText={`No usage recorded in ${year}.`}>
        {grid && (
          <Heatmap
            rows={grid.rows}
            columns={grid.columns}
            cells={grid.cells}
            unit="%"
            cap={15}
            sides={[`Less than ${year - 1}`, `More than ${year - 1}`]}
            summary={summary}
          />
        )}
      </AsyncContent>
    </Card>
  );
}
