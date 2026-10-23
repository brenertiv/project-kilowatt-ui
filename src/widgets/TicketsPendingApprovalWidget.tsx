import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useLookup, useTicketCount, type Scope } from '../api/queries';
import { combineStates, fromQuery } from '../api/state';
import { actionRequestStatusIds, type GroupedCount } from '../api/types';
import { DonutChart } from '../charts/DonutChart';
import { AsyncContent } from '../components/AsyncContent';
import { TruncatedText } from '../components/TruncatedText';
import { pendingCategorySlices } from './mappings';

export type TicketsPendingApprovalWidgetProps = {
  /** Where to look: `'all'`, `{ client: id }` or `{ location: id }`. Pending tickets are counted as they stand today, so there's no window. */
  scope: Scope;
  /** The card's title, in title case. Default `'Tickets Pending Approval by Category'`. */
  title?: string;
};

const share = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });

/**
 * Tenant tickets waiting for approval, by category: the recipe for Tickets Pending Approval by Category.
 * It asks `/action_request/count/?group_by=action_category_id` for the tickets pending approval and
 * `/action_category/` for the names, maps them with `pendingCategorySlices` (uncategorized tickets and
 * anything past the five largest into one neutral Other), and draws a `DonutChart`.
 *
 * @summary Tenant tickets pending approval by category as a donut, fetched and mapped from the API.
 * @import import { TicketsPendingApprovalWidget } from 'src/widgets/TicketsPendingApprovalWidget';
 */
export function TicketsPendingApprovalWidget({ scope, title = 'Tickets Pending Approval by Category' }: TicketsPendingApprovalWidgetProps) {
  const counts = useTicketCount(scope, { group_by: 'action_category_id', action_request_status_id__in: String(actionRequestStatusIds.pendingApproval) });
  const categories = useLookup('action_category');
  const slices = useMemo(
    () => (counts.data && categories.data ? pendingCategorySlices(counts.data as GroupedCount[], categories.data) : []),
    [counts.data, categories.data],
  );
  const state = combineStates(fromQuery(counts), fromQuery(categories));
  const total = slices.reduce((sum, { value }) => sum + value, 0);
  const largest = slices.find(({ category }) => category !== 'Other');
  const summary = largest ? `${total} tickets are waiting for approval; ${largest.category} has the most, ${largest.value} (${share.format(largest.value / total)}).` : '';

  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} />
      <AsyncContent state={state} height={296} loadingLabel="Loading tenant tickets" emptyText="No tickets are waiting for approval.">
        <DonutChart data={slices} unit="tickets" summary={summary} />
      </AsyncContent>
    </Card>
  );
}
