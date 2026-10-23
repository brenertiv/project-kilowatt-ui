// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { actionCategories, actionStatuses, actionTypes, portfolio } from '../fixtures/data';
import {
  scopedBuildings,
  selectAccountCoverage,
  selectActionCount,
  selectBudgets,
  selectLocationData,
  selectMeterCoverage,
  selectProjects,
  selectScoreAverage,
  selectScores,
  selectSubmeterLogs,
  selectTicketCount,
} from '../api/mock';
import { carbonPlanSummaries, chartDataByPlan, planningClient, portfolioPathway } from '../fixtures/data/planning';
import type { Budget, GroupedCount, PmMeterCoverage, Project, ScorePoint, SubmeterLog, UtilityAccountCoverage } from '../api/types';
import { pmTypesOfMeter } from '../fixtures/data/coverage';
import {
  annualExpenditures,
  coverageByMonth,
  approvedProjects,
  burnRate,
  emissionsForecast,
  emissionsPathways,
  expendituresByType,
  pendingCategorySlices,
  recoveryByMonth,
  utilityCostBreakdown,
  scoreHeadline,
  scoreRows,
  sentenceCase,
  spendAndSavings,
  statusSegments,
  typeSlices,
  varianceGrid,
} from './mappings';

/** The mappings, run on the mock API's responses: what each widget would draw from the sample portfolio. */

const all = scopedBuildings(undefined, undefined)!;
const park = all.filter(({ name }) => name === '350 Park Avenue');

describe('scores', () => {
  it('turns 0–1 scores into whole points and leaves days without a score out', () => {
    expect(scoreRows([{ timestamp: '2026-10-12', score: 0.734 }, { timestamp: '2026-10-13', score: null }])).toEqual([
      { date: Date.UTC(2026, 9, 12), score: 73 },
    ]);
    const days = selectScores('action', park, { from_time: '2026-08-15', to_time: '2026-10-13', aggregate: true }) as ScorePoint[];
    expect(Math.min(...scoreRows(days).map(({ score }) => score))).toBeLessThan(50);
  });

  it('gives a headline and its change in points, or null where the API has none', () => {
    const average = selectScoreAverage('action', park, { from_time: '2026-09-14', to_time: '2026-10-13' });
    const { score, change } = scoreHeadline(average);
    expect(score).toBeGreaterThan(0);
    expect(change).not.toBeNull();
    const retail = all.filter(({ location_type: type }) => type === 31);
    expect(scoreHeadline(selectScoreAverage('tenant_billing', retail, { from_time: '2026-09-14', to_time: '2026-10-13' }))).toEqual({ score: null, change: null });
  });
});

describe('work orders', () => {
  it('lists every status in lifecycle order, with its intent, counts adding up', () => {
    const counts = selectActionCount(all, { group_by: 'action_status_id' }) as GroupedCount[];
    const segments = statusSegments(counts, actionStatuses);
    expect(segments.map(({ label }) => label)).toEqual(['Open', 'In progress', 'On hold', 'Requires attention', 'Completed', 'Expired', 'Cancelled']);
    expect(segments.find(({ label }) => label === 'Completed')?.status).toBe('success');
    expect(segments.reduce((sum, { value }) => sum + value, 0)).toBe(portfolio.actions.length);
  });

  it('keeps a status with no work orders at 0, and leaves an empty type out of the donut', () => {
    expect(statusSegments([], actionStatuses).every(({ value }) => value === 0)).toBe(true);
    const slices = typeSlices([{ action_type_id: 6, count: 3 }, { action_type_id: 3, count: 0 }], actionTypes);
    expect(slices).toEqual([{ category: 'Meter reading', value: 3, slot: 5 }]);
    expect(sentenceCase('Requires Attention')).toBe('Requires attention');
  });
});

describe('energy', () => {
  const year = (from: string, to: string, series: 'energy' | 'ghg' = 'energy') => selectLocationData(all, { series, interval: 'month', fromTime: from, toTime: to });

  it('compares each month with the same month a year before, with no data where either is missing', () => {
    const grid = varianceGrid(year('2026-01-01', '2026-12-31'), year('2025-01-01', '2025-12-31'));
    expect(grid.columns).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']);
    expect(grid.rows).toHaveLength(all.length);
    const cell = (row: string, column: string) => grid.cells.find((candidate) => candidate.row === row && candidate.column === column)!;
    // Metered from April 2026, so nothing a year earlier to compare with.
    expect(cell('55 Water Street', 'May').state).toBe('noData');
    expect(cell('4 Times Square', 'Feb').state).toBe('noData');
    expect(cell('599 Lexington Avenue', 'Jul').value).toBeGreaterThan(30);
    // The partial month is scaled to a whole month, so it isn't a 58% drop.
    expect(Math.abs(cell('120 Broadway', 'Oct').value!)).toBeLessThan(15);
  });

  it('projects emissions from like-for-like buildings, through full months only', () => {
    const forecast = emissionsForecast(year('2024-01-01', '2026-10-31', 'ghg'));
    expect(forecast.excluded.sort()).toEqual(['4 Times Square', '55 Water Street']);
    expect(forecast.projectedFrom).toBe(Date.UTC(2026, 9, 1));
    expect(forecast.rows).toHaveLength(33 + 12);
    expect(forecast.rows.every(({ emissions }) => emissions > 0)).toBe(true);
  });

  it('has no projection with less than two years measured', () => {
    expect(emissionsForecast(year('2026-01-01', '2026-10-31', 'ghg')).projectedFrom).toBeUndefined();
  });
});

describe('carbon and capital planning', () => {
  const scope = ['client', planningClient.id] as const;
  const projects = selectProjects(...scope, { page_size: 0, projectcost_set: true, budgetproject_set: true, project_type: true, location: true }, '/project/')!.results as unknown as Project[];
  const budgets = selectBudgets(...scope, { page_size: 0, budget_status: true }, '/budget/')!.results as unknown as Budget[];
  const committed = approvedProjects(projects, budgets);
  const approvedPlans = carbonPlanSummaries.filter(({ budget_status_id: status }) => status === 3).map(({ id }) => chartDataByPlan.get(id)!);

  it('counts only projects in approved budgets', () => {
    const underReview = carbonPlanSummaries.find(({ budget_status_id: status }) => status === 1)!;
    expect(committed.length).toBeGreaterThan(0);
    expect(committed.some((project) => project.budgetproject_set!.some(({ budget }) => budget === underReview.id))).toBe(false);
  });

  it('stacks spend by year and property, largest property first, the totals adding up', () => {
    const { rows, series } = annualExpenditures(committed);
    expect(series).toHaveLength(portfolio.buildings.length);
    const total = (field: string) => rows.reduce((sum, row) => sum + Number((row as Record<string, unknown>)[field] ?? 0), 0);
    expect(total(series[0]!.field)).toBeGreaterThanOrEqual(total(series[1]!.field));
    const all = committed.reduce((sum, project) => sum + project.projectcost_set!.reduce((s, { value }) => s + value, 0), 0);
    expect(series.reduce((sum, { field }) => sum + total(field), 0)).toBe(all);
  });

  it('ranks spend by project type', () => {
    const ranking = expendituresByType(committed);
    expect(ranking[0]!.spend).toBeGreaterThanOrEqual(ranking[ranking.length - 1]!.spend);
    expect(ranking.every(({ type }) => !type.startsWith('Type '))).toBe(true);
  });

  it('turns running savings totals into each year’s savings', () => {
    const rows = spendAndSavings(approvedPlans);
    expect(rows[0]!.year).toBe('2027');
    // Nothing is saved in a plan's first year: its projects save from the year after they start.
    expect(rows[0]!.savings).toBe(0);
    expect(rows.every(({ savings }) => savings >= 0)).toBe(true);
    expect(rows.reduce((sum, row) => sum + row.spend, 0)).toBe(approvedPlans.reduce((sum, plan) => sum + plan.yearly_summary.reduce((s, row) => s + row.spend, 0), 0));
  });

  it('subtracts each year’s avoided CO₂ from the baseline, not the running total', () => {
    const { rows, leavesWithout, leavesWith } = emissionsPathways(portfolioPathway, approvedPlans);
    expect(leavesWithout).toBe(2028);
    expect(leavesWith).toBe(2029);
    const last = rows[rows.length - 1]!;
    // The approved plans' annual reductions, carried forward: the "with plans" line levels off rather than reaching 0.
    const annual = carbonPlanSummaries.filter(({ budget_status_id: status }) => status === 3).reduce((sum, plan) => sum + plan.totals!.total_annual_co2_reduction_kg, 0);
    expect(last.with).toBe(Math.round((portfolioPathway.baseline_kgco2e! - annual) / 1000));
    expect(emissionsPathways({ ...portfolioPathway, baseline_kgco2e: null }, approvedPlans).rows).toEqual([]);
  });

  it('splits committed capital into spent and remaining at a date', () => {
    const rate = burnRate(committed, '2026-10-13');
    expect(rate.spent).toBeGreaterThan(0);
    expect(rate.remaining).toBeGreaterThan(0);
    expect(rate.spent + rate.remaining).toBe(rate.total);
    expect(burnRate(committed, '2024-12-31')).toEqual(expect.objectContaining({ spent: 0, co2AvoidedKg: undefined }));
  });
});

describe('tenant billing and tickets', () => {
  const logs = selectSubmeterLogs(undefined, { client_hierarchy_id: planningClient.id, page_size: 0, properties: true, utility_type: true, fromTime: '20251101', toTime: '20261031' }, '/submeter_log/')!
    .results as unknown as SubmeterLog[];

  it('breaks the latest month down by utility, and says how many buildings it holds so far', () => {
    const breakdown = utilityCostBreakdown(logs)!;
    expect(breakdown.month).toBe('2026-10');
    expect(breakdown.slices.map(({ category }) => category).sort()).toEqual(['Electricity', 'Water']);
    expect(breakdown.slices.find(({ category }) => category === 'Electricity')).toEqual(expect.objectContaining({ slot: 0 }));
    expect(breakdown.buildings).toBeLessThan(breakdown.buildingsBefore!);
    expect(breakdown.net).toBe(breakdown.billables - breakdown.utilities);
    expect(utilityCostBreakdown([])).toBeUndefined();
  });

  it('marks a month with fewer buildings billed as incomplete, and ranks the last complete month by property', () => {
    const recovery = recoveryByMonth(logs);
    expect(recovery.rows).toHaveLength(12);
    expect(recovery.incompleteFrom).toBe(Date.UTC(2026, 9, 1));
    expect(recovery.completeMonth).toBe('2026-09');
    expect(recovery.byProperty[0]).toEqual(expect.objectContaining({ building: '200 Vesey Street' }));
    expect(recovery.byProperty[0]!.recovery).toBeLessThan(70);
    expect(recoveryByMonth(logs.filter((log) => log.properties!['Billing Period End'] < '2026-10-01')).incompleteFrom).toBeUndefined();
  });

  it('folds uncategorized tickets into one Other, and keeps to six slices', () => {
    const counts = selectTicketCount(scopedBuildings('client', planningClient.id)!, { group_by: 'action_category_id', action_request_status_id__in: '1' }) as GroupedCount[];
    const slices = pendingCategorySlices(counts, actionCategories);
    expect(slices.length).toBeLessThanOrEqual(6);
    expect(slices.filter(({ category }) => category === 'Other')).toEqual([expect.objectContaining({ neutral: true })]);
    expect(slices.reduce((sum, { value }) => sum + value, 0)).toBe(counts.reduce((sum, { count }) => sum + count, 0));
    expect(pendingCategorySlices([{ action_category_id: null, count: 2 }, { action_category_id: 1, count: 1 }], actionCategories)).toEqual([{ category: 'Other', value: 3, neutral: true }]);
  });
});

describe('data coverage', () => {
  const window = { data_coverage_start_date: '2025-10-01', data_coverage_end_date: '2026-10-13', page_size: 0, type: true, utility_bill_type: true };
  const coverage = (buildings = all) => coverageByMonth(
    selectMeterCoverage(buildings, window, '/pm_meter/data_coverage/').results as unknown as PmMeterCoverage[],
    selectAccountCoverage(buildings, window, '/location_utility_account/data_coverage/').results as unknown as UtilityAccountCoverage[],
    pmTypesOfMeter,
    '2026-10-13',
  );
  const at = (name: string) => all.filter((building) => building.name === name);
  const month = (rows: ReturnType<typeof coverage>['rows'], key: string) => rows.find(({ date }) => date === Date.parse(`${key}-01T00:00:00Z`))!;

  it('draws one line per utility, in its slot, and leaves out the month still being billed', () => {
    const { rows, series } = coverage();
    expect(series.map(({ name }) => name)).toEqual(['Electricity', 'Steam', 'Water', 'Natural Gas']);
    expect(series[0]).toEqual(expect.objectContaining({ slot: 0 }));
    expect(rows).toHaveLength(12);
    expect(rows[rows.length - 1]!.date).toBe(Date.UTC(2026, 8, 1));
  });

  it('reads a missing bill as a gap, and a replaced meter as continuous', () => {
    // Electricity bills run from the 4th to the 3rd, so January's bill covers 1–3 February before the gap: 3 of 28 days.
    expect(month(coverage(at('1 World Trade Center')).rows, '2026-02').Electricity).toBe(10.7);
    expect(month(coverage(at('1 World Trade Center')).rows, '2026-05').Electricity).toBe(100);
    expect(month(coverage(at('4 Times Square')).rows, '2026-04')['Natural Gas']).toBe(100);
  });

  it('leaves the days a second meter is silent uncovered, though the first is billed', () => {
    // May's bill covers 1–3 June; from the 4th the second meter is silent: 3 of 30 days.
    expect(month(coverage(at('120 Broadway')).rows, '2026-06').Electricity).toBe(10);
  });

  it('counts a building reported through bills alone as its own unit, from its first bill', () => {
    const { rows } = coverage(at('55 Water Street'));
    expect(month(rows, '2026-03')).toBeUndefined();
    expect(month(rows, '2026-05').Electricity).toBe(100);
  });

  it('shows water a month behind, its last billed month complete and the next uncovered', () => {
    const { rows } = coverage();
    expect(month(rows, '2026-08').Water).toBe(100);
    expect(month(rows, '2026-09').Water).toBe(0);
  });
});
