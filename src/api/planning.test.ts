import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { portfolio } from '../fixtures/data';
import { budgets, carbonPlanSummaries } from '../fixtures/data/planning';
import { mockControls, resetMockControls } from './mock';
import { fetchBudgets, fetchCarbonPlans, fetchPathway, fetchPlanChartData, fetchProjects } from './queries';
import type { BudgetStatus, Location, ProjectType } from './types';

/** The capital and carbon planning routes, checked against the shapes the live API returned (October 2026). */

beforeAll(() => {
  mockControls.latencyMs = 0;
});

afterEach(() => {
  resetMockControls();
  mockControls.latencyMs = 0;
});

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

describe('carbon plans', () => {
  it('pages a client’s plans, with status and totals only when asked for', async () => {
    const bare = await fetchCarbonPlans(client.id);
    expect(Object.keys(bare)).toEqual(['next', 'previous', 'results']);
    expect(bare.results[0]).not.toHaveProperty('totals');
    const full = await fetchCarbonPlans(client.id, { totals: true, budget_status: true });
    expect(full.results[0]!.totals!.total_investment).toBeGreaterThan(0);
    expect(full.results.map(({ budget_status: status }) => status!.name).sort()).toEqual(['Approved', 'Approved', 'Under Review']);
    // The API sends the baseline as a decimal string.
    expect(typeof full.results[0]!.baseline_emissions_kgco2e).toBe('string');
  });

  it('serves each plan’s chart data, its cumulative reduction a running total of the annual one', async () => {
    const plan = carbonPlanSummaries[0]!;
    const data = await fetchPlanChartData(plan.id);
    expect(data.yearly_summary).toHaveLength(plan.timeline_years);
    const rows = data.yearly_summary;
    const annual = rows.map((row, i) => row.cumulative_co2_reduction - (rows[i - 1]?.cumulative_co2_reduction ?? 0));
    // Once every project is running, the annual reduction is the plan's total.
    expect(annual[annual.length - 1]).toBe(plan.totals!.total_annual_co2_reduction_kg);
    expect(data.projects.length).toBeGreaterThan(0);
  });

  it('serves the pathway, and 404s for a client or plan that does not exist', async () => {
    const pathway = await fetchPathway(client.id);
    expect(pathway.crrem_pathway[0]!.year).toBe(2026);
    expect(pathway.baseline_kgco2e).toBeGreaterThan(pathway.crrem_pathway[2]!.kgco2e);
    const missing = await fetchPlanChartData('missing').catch((error: unknown) => error);
    expect((missing as { response: { status: number } }).response.status).toBe(404);
  });
});

describe('projects and budgets', () => {
  it('leaves costs out and relations bare unless asked, as the API does', async () => {
    const bare = await fetchProjects({ client: client.id }, { page_size: 1 });
    expect(bare.results[0]).not.toHaveProperty('projectcost_set');
    expect(typeof bare.results[0]!.project_type).toBe('number');
    const full = await fetchProjects({ client: client.id }, { page_size: 1, projectcost_set: true, project_type: true, location: true });
    const project = full.results[0]!;
    expect(project.projectcost_set![0]).toEqual(expect.objectContaining({ project_date: expect.stringMatching(/^\d{4}-01-01$/), value: expect.any(Number) }));
    expect((project.project_type as ProjectType).name).toBeTruthy();
    expect((project.location as Location).name).toBeTruthy();
  });

  it('scopes projects to a building and budgets to the plans with projects there', async () => {
    const building = portfolio.buildings[0]!;
    const atBuilding = await fetchProjects({ location: building.id }, { page_size: 0 });
    expect(atBuilding.results.every((project) => project.location === building.id)).toBe(true);
    const all = await fetchBudgets({ client: client.id }, { budget_status: true });
    expect(all.results).toHaveLength(budgets.length);
    expect((all.results[0]!.budget_status as BudgetStatus).name).toBe('Approved');
  });
});
