import { useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { usePathway } from '../api/queries';
import { combineStates, fromQuery } from '../api/state';
import type { Uuid } from '../api/types';
import { LineChart } from '../charts/LineChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { emissionsPathways } from './mappings';
import { useApprovedPlans } from './planning';

export type EmissionsPathwaysWidgetProps = {
  /** The portfolio, as its client id. The pathway and plans belong to a portfolio, so there is no building scope. */
  client: Uuid;
  /** The card's title, in title case. Default `'Emissions Pathways'`. */
  title?: string;
};

const tonnes = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const series = [
  { field: 'with', name: 'With approved plans' },
  { field: 'without', name: 'Without plans' },
  { field: 'crrem', name: 'CRREM 1.5 °C pathway', neutral: true },
];

/**
 * A portfolio's emissions against its CRREM decarbonization pathway, with and without its approved
 * carbon plans: the recipe for Emissions Pathways. It asks `/client/{id}/carbon_planner/pathway/` for the
 * baseline and pathway, and the approved plans' chart data, maps them with `emissionsPathways` (each year's
 * avoided CO₂ from the running total, carried forward after a plan ends), and draws a yearly `LineChart`:
 * the two scenarios in series colors, the pathway `neutral`. When either scenario rises above the pathway,
 * a warning says from which year.
 *
 * @summary Emissions with and without approved carbon plans against the CRREM pathway, fetched and mapped from the API.
 * @import import { EmissionsPathwaysWidget } from 'src/widgets/EmissionsPathwaysWidget';
 */
export function EmissionsPathwaysWidget({ client, title = 'Emissions Pathways' }: EmissionsPathwaysWidgetProps) {
  const pathway = usePathway(client);
  const { charts, state: plansState } = useApprovedPlans(client);
  const result = useMemo(() => (pathway.data && charts ? emissionsPathways(pathway.data, charts) : undefined), [pathway.data, charts]);
  // No approved plans still draws the pathway and the baseline; only the pathway's own request decides empty.
  const plans = plansState.status === 'empty' ? { status: 'ready' as const } : plansState;
  const state = combineStates(fromQuery(pathway, { isEmpty: (data) => data.baseline_kgco2e === null }), plans);
  const rows = result?.rows ?? [];
  const last = rows[rows.length - 1];
  const leaves = result && (result.leavesWithout || result.leavesWith);
  const warning = result
    ? [
        result.leavesWithout && `Without its plans, the portfolio rises above the pathway in ${result.leavesWithout}`,
        result.leavesWith ? `with its approved plans, in ${result.leavesWith}` : result.leavesWithout && 'its approved plans keep it on the pathway',
      ].filter(Boolean).join('; ')
    : '';
  const summary = last
    ? `By ${new Date(last.date).getUTCFullYear()} the approved plans bring emissions to ${tonnes.format(last.with)} tCO₂e a year, against a pathway of ${tonnes.format(last.crrem)}.${warning ? ` ${warning}.` : ''}`
    : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={392} loadingLabel="Loading emissions pathways" emptyText="No baseline emissions to compare with the pathway.">
        {leaves && (
          <CardContent sx={{ pt: 0 }}>
            <Alert severity="warning">{warning}.</Alert>
          </CardContent>
        )}
        <LineChart data={rows} series={series} unit="tCO₂e" interval="year" height={280} summary={summary} />
      </AsyncContent>
    </Card>
  );
}
