import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { useActionCount, useLookup, type Scope } from '../api/queries';
import { combineStates, fromQuery } from '../api/state';
import type { GroupedCount, IsoDate } from '../api/types';
import { AsyncContent } from '../components/AsyncContent';
import { SegmentedBar } from '../components/SegmentedBar';
import { TruncatedText } from '../components/TruncatedText';
import { statusSegments } from './mappings';

export type WorkOrderStatusWidgetProps = {
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. */
  scope: Scope;
  /** The first due date counted, `YYYY-MM-DD`. */
  from: IsoDate;
  /** The last due date counted, `YYYY-MM-DD`, inclusive. */
  to: IsoDate;
  /** The card's title, in title case. Default `'Work Orders by Status'`. */
  title?: string;
};

/**
 * Work orders by status through their lifecycle: the recipe for Work Order Status Breakdown. It asks
 * `/action/count/?group_by=action_status_id` for the work orders due in the window, and `/action_status/`
 * for the statuses, maps them with `statusSegments` (lifecycle order, each status in its intent, empty
 * statuses kept at 0), and draws a `SegmentedBar` with its legend of counts and shares.
 *
 * @summary Work orders by status as a segmented bar, fetched and mapped from the API.
 * @import import { WorkOrderStatusWidget } from 'src/widgets/WorkOrderStatusWidget';
 */
export function WorkOrderStatusWidget({ scope, from, to, title = 'Work Orders by Status' }: WorkOrderStatusWidgetProps) {
  const counts = useActionCount(scope, { group_by: 'action_status_id', due_date__gte: from, due_date__lte: to });
  const statuses = useLookup('action_status');
  const segments = useMemo(
    () => (counts.data && statuses.data ? statusSegments(counts.data as GroupedCount[], statuses.data) : []),
    [counts.data, statuses.data],
  );
  const state = combineStates(fromQuery(counts), fromQuery(statuses));

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <CardContent sx={{ pt: 0 }}>
        <AsyncContent state={state} height={96} inset={0} loadingLabel="Loading work orders" emptyText="No work orders due in this period.">
          <SegmentedBar segments={segments} unit="work orders" label="Work orders by status" />
        </AsyncContent>
      </CardContent>
    </Card>
  );
}
