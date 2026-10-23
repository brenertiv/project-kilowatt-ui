import { useMemo } from 'react';
import { useBudgets, useCarbonPlans, usePlansChartData, useProjects, type Scope } from '../api/queries';
import { combineStates, fromQuery, type AsyncState } from '../api/state';
import { budgetStatusIds, type Uuid } from '../api/types';
import { approvedProjects } from './mappings';

/**
 * The requests the planning recipes share. Pages are asked for whole (`page_size: 500`), as the app drains
 * them; the sample portfolio fits in one.
 */
const page = { page_size: 500 };

/** The projects in a scope's approved budgets, with their costs, types and properties, and one state for both requests. */
export function useCommittedProjects(scope: Scope) {
  const projects = useProjects(scope, { ...page, projectcost_set: true, budgetproject_set: true, project_type: true, location: true });
  const budgets = useBudgets(scope, { ...page, budget_status: true });
  const committed = useMemo(
    () => (projects.data && budgets.data ? approvedProjects(projects.data.results, budgets.data.results) : []),
    [projects.data, budgets.data],
  );
  return { committed, state: combineStates(fromQuery(projects), fromQuery(budgets)) };
}

/** A client's approved carbon plans and each one's chart data, and one state for both: empty when no plan is approved. */
export function useApprovedPlans(client: Uuid) {
  const plans = useCarbonPlans(client, { ...page, totals: true, budget_status: true });
  const approved = useMemo(
    () => (plans.data?.results ?? []).filter(({ budget_status_id: status }) => status === budgetStatusIds.approved).map(({ id }) => id),
    [plans.data],
  );
  const charts = usePlansChartData(approved);
  return {
    plans: plans.data?.results ?? [],
    charts: charts.data,
    state: combineStates(
      fromQuery(plans, { isEmpty: (data) => !data.results.some(({ budget_status_id: status }) => status === budgetStatusIds.approved) }),
      fromQuery(charts, { isEmpty: () => false }),
    ),
  };
}

/** A ready state with nothing to draw is empty: approved budgets with no costed projects, say. */
export function emptyWhenNone(state: AsyncState, count: number): AsyncState {
  return (state.status === 'ready' || state.status === 'fetching') && count === 0 ? { status: 'empty' } : state;
}
