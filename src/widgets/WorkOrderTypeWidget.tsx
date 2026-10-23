import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useActionCount, useLookup, type Scope } from '../api/queries';
import { combineStates, fromQuery } from '../api/state';
import type { GroupedCount, IsoDate } from '../api/types';
import { DonutChart } from '../charts/DonutChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { typeSlices } from './mappings';

export type WorkOrderTypeWidgetProps = {
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The first due date counted, `YYYY-MM-DD`. */
  from: IsoDate;
  /** The last due date counted, `YYYY-MM-DD`, inclusive. */
  to: IsoDate;
  /** The card's title, in title case. Default `'Work Orders by Type'`. */
  title?: string;
};

const share = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });

/**
 * Work orders by type as parts of the whole: the recipe for Work Order Type Breakdown. It asks
 * `/action/count/?group_by=action_type_id` for the work orders due in the window, and `/action_type/` for
 * the types, maps them with `typeSlices` (each type in its series slot from `workOrderTypeSlots`, empty
 * types left out), and draws a `DonutChart` labeled with each type's share.
 *
 * @summary Work orders by type as a donut, each type in its own color, fetched and mapped from the API.
 * @import import { WorkOrderTypeWidget } from 'src/widgets/WorkOrderTypeWidget';
 */
export function WorkOrderTypeWidget({ scope, from, to, title = 'Work Orders by Type' }: WorkOrderTypeWidgetProps) {
  const counts = useActionCount(scope, { group_by: 'action_type_id', due_date__gte: from, due_date__lte: to });
  const types = useLookup('action_type');
  const slices = useMemo(() => (counts.data && types.data ? typeSlices(counts.data as GroupedCount[], types.data) : []), [counts.data, types.data]);
  const state = combineStates(fromQuery(counts), fromQuery(types));
  const total = slices.reduce((sum, { value }) => sum + value, 0);
  const largest = [...slices].sort((a, b) => b.value - a.value)[0];
  const summary = largest ? `${total} work orders are due in the period; ${largest.category.toLowerCase()} is the largest share, ${share.format(largest.value / total)}.` : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={296} loadingLabel="Loading work orders" emptyText="No work orders due in this period.">
        <DonutChart data={slices} unit="work orders" summary={summary} />
      </AsyncContent>
    </Card>
  );
}
