import type {
  Budget,
  BudgetProject,
  CarbonPlanSummary,
  ChartDataResponse,
  CrremPathwayPoint,
  Location,
  PortfolioPathwayResponse,
  Project,
  ProjectCost,
  YearlySummaryRow,
} from '../../api/types';
import { budgetStatusIds } from '../../api/types';
import { budgetStatuses, projectTypes } from './lookups';
import { portfolio } from './portfolio';
import { at, int, pick, rng, uuid, type Rng } from './seed';
import { locationSeries } from './series';

/**
 * The sample portfolio's capital and carbon plans: one capital plan someone wrote, two approved carbon
 * plans and one under review, the projects in each with their yearly costs, the chart data the Carbon
 * Planner serves for each carbon plan, and the portfolio's CRREM pathway. Built from its own seed, so it
 * doesn't shift the rest of the sample. States the widgets need:
 *
 * - **Spend in the past and the future.** The capital plan runs 2025 to 2031, so part of it is spent.
 * - **More than six properties** in the capital plan, so a stacked chart groups the smallest.
 * - **Projects without a CO₂ estimate** (`co2_avoided: null`), as most capital projects have.
 * - **A plan under review**, which no portfolio total counts.
 * - **A pathway that overtakes the baseline.** Without its plans the portfolio leaves the CRREM pathway in 2028;
 *   with the approved plans, in 2029.
 */

const random = rng(20261022);
const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;
const typeId = (name: string) => projectTypes.find((type) => type.name === name)!.id;

type PlanSeed = { name: string; status: number; auto: boolean; start: number; years: number; types: string[]; perBuilding: [number, number] };

const planSeeds: PlanSeed[] = [
  {
    name: '10-Year Capital Plan (2025–2034)',
    status: budgetStatusIds.approved,
    auto: false,
    start: 2025,
    years: 7,
    types: ['HVAC', 'Elevators', 'Building Envelope', 'Plumbing', 'Site Features/Parking', 'Fire and Life Safety', 'Electrical', 'Structural'],
    perBuilding: [2, 4],
  },
  {
    name: 'Electrification and Controls Plan',
    status: budgetStatusIds.approved,
    auto: true,
    start: 2027,
    years: 10,
    types: ['BMS', 'Systems Commissioning', 'HVAC', 'Electrical', 'Metering'],
    perBuilding: [1, 2],
  },
  {
    name: 'Envelope and Lighting Plan',
    status: budgetStatusIds.approved,
    auto: true,
    start: 2027,
    years: 8,
    types: ['Lighting', 'Building Envelope', 'Renewable Energy'],
    perBuilding: [0, 2],
  },
  {
    name: 'Rooftop Solar Plan',
    status: budgetStatusIds.underReview,
    auto: true,
    start: 2028,
    years: 10,
    types: ['Renewable Energy'],
    perBuilding: [0, 1],
  },
];

/** What a project of each type costs and saves, roughly, before the building's size: cost in US dollars, savings in US dollars a year, CO₂ in kg a year. */
const typeEconomics: Record<string, { cost: number; savings: number; co2: number }> = {
  HVAC: { cost: 420_000, savings: 46_000, co2: 140_000 },
  BMS: { cost: 160_000, savings: 27_000, co2: 60_000 },
  'Systems Commissioning': { cost: 90_000, savings: 60_000, co2: 150_000 },
  Electrical: { cost: 210_000, savings: 12_000, co2: 35_000 },
  Metering: { cost: 25_000, savings: 4_000, co2: 8_000 },
  Lighting: { cost: 140_000, savings: 38_000, co2: 90_000 },
  'Building Envelope': { cost: 380_000, savings: 22_000, co2: 70_000 },
  'Renewable Energy': { cost: 520_000, savings: 64_000, co2: 180_000 },
  Elevators: { cost: 640_000, savings: 0, co2: 0 },
  Plumbing: { cost: 120_000, savings: 0, co2: 0 },
  'Site Features/Parking': { cost: 60_000, savings: 0, co2: 0 },
  'Fire and Life Safety': { cost: 95_000, savings: 0, co2: 0 },
  Structural: { cost: 260_000, savings: 0, co2: 0 },
};

type PlanBuild = { budget: Budget; seed: PlanSeed; projects: Project[] };

/** Each project's annual savings in US dollars, for the chart data: the Carbon Planner serves them, a project record doesn't carry them. */
const savingsByProject = new Map<string, number>();

function buildPlan(random: Rng, seed: PlanSeed, buildings: Location[]): PlanBuild {
  const budget: Budget = {
    id: uuid(random),
    client: client.id,
    budget_status: seed.status,
    name: seed.name,
    description: seed.auto ? `A ${seed.years}-year carbon reduction plan across the portfolio.` : 'Capital budget for the portfolio.',
    auto_generated: seed.auto,
    start_year: `${seed.start}-01-01`,
  };
  const projects = buildings.flatMap((building, b) =>
    Array.from({ length: int(random, ...seed.perBuilding) }, (): Project => {
      const type = pick(random, seed.types);
      const economics = typeEconomics[type]!;
      const size = 0.6 + random() * 0.9;
      const id = uuid(random);
      const year = seed.start + int(random, 0, Math.min(seed.years - 1, 4));
      // Big capital projects spread over two years; the rest fall in one.
      const split = economics.cost * size > 300_000 && !seed.auto ? 2 : 1;
      const total = Math.round((economics.cost * size) / 500) * 500;
      const costs: ProjectCost[] = Array.from({ length: split }, (_, i) => ({
        id: uuid(random),
        project: id,
        project_date: `${year + i}-01-01`,
        value: Math.round(total / split),
      }));
      const link: BudgetProject = { id: uuid(random), budget: budget.id, project: id };
      savingsByProject.set(id, Math.round(economics.savings * size));
      return {
        id,
        project_type: typeId(type),
        project_priority: int(random, 1, 5),
        expense_type: seed.auto ? 1 : 2,
        name: `${type} upgrade, ${building.name}`,
        description: '',
        recommendation: '',
        auto_generated: seed.auto,
        resourcetype: 'LocationProject',
        project_status: 1,
        // Capital projects mostly carry no CO₂ estimate; carbon plans always do.
        // Carbon plans bundle deep retrofits, so their projects avoid more than a like-for-like replacement.
        co2_avoided: economics.co2 === 0 || (!seed.auto && b % 3 !== 0) ? null : Math.round(economics.co2 * size * (seed.auto ? 2.5 : 1)),
        payback_period: economics.savings ? Math.round(total / (economics.savings * size)) : null,
        declined: false,
        location: building.id,
        projectcost_set: costs,
        budgetproject_set: [link],
      };
    }),
  );
  return { budget, seed, projects };
}

const plans: PlanBuild[] = planSeeds.map((seed) => buildPlan(random, seed, portfolio.buildings));

/** Every budget, capital and carbon. */
export const budgets: Budget[] = plans.map(({ budget }) => budget);

/** Every project, with its costs and budget links. */
export const projects: Project[] = plans.flatMap(({ projects: list }) => list);

const annualSavings = (project: Project) => savingsByProject.get(project.id) ?? 0;
const firstYear = (project: Project) => Math.min(...(project.projectcost_set ?? []).map(({ project_date: date }) => Number(date.slice(0, 4))));
const cost = (project: Project) => (project.projectcost_set ?? []).reduce((sum, { value }) => sum + value, 0);

/** The portfolio's baseline, in kgCO₂e a year: its buildings' 2025 emissions. */
export const baselineKg = Math.round(
  portfolio.buildings.reduce((sum, building) => sum + locationSeries(building, 'ghg', '2025-01-01', '2025-12-31').points.reduce((s, point) => s + point.value, 0), 0) * 1000,
);

/** The CRREM 1.5 °C pathway for the portfolio, 2026 to 2050, in kgCO₂e: above the baseline today, below it from 2028, then falling to a fifteenth of it. */
export const crremPathway: CrremPathwayPoint[] = Array.from({ length: 25 }, (_, i) => ({
  year: 2026 + i,
  kgco2e: Math.round(baselineKg * 1.15 * Math.exp(-0.12 * i) * 100) / 100,
}));

/** `/client/{id}/carbon_planner/pathway/` for the sample client. */
export const portfolioPathway: PortfolioPathwayResponse = { baseline_kgco2e: baselineKg, crrem_pathway: crremPathway, crrem_pathway_version: 'V2.05' };

/** One carbon plan's chart data, as the Carbon Planner serves it: its projects, then year by year what it spends and has saved and avoided by then. */
function chartData({ seed, projects: list }: PlanBuild): ChartDataResponse {
  const years = Array.from({ length: seed.years }, (_, i) => seed.start + i);
  // A project saves from the year after it starts; the cumulative totals add each year's savings to the last.
  let co2 = 0;
  let savings = 0;
  const yearly_summary = years.map((year): YearlySummaryRow => {
    const running = list.filter((project) => firstYear(project) < year);
    co2 += running.reduce((sum, project) => sum + (project.co2_avoided ?? 0), 0);
    savings += running.reduce((sum, project) => sum + annualSavings(project), 0);
    return {
      year,
      spend: list.reduce((sum, project) => sum + (project.projectcost_set ?? []).filter(({ project_date: date }) => Number(date.slice(0, 4)) === year).reduce((s, { value }) => s + value, 0), 0),
      cumulative_co2_reduction: co2,
      cumulative_cost_savings: savings,
      projects_starting: list.filter((project) => firstYear(project) === year).length,
      budget_utilization: 0,
    };
  });
  const names = new Map(portfolio.buildings.map((building) => [building.id, building.name]));
  return {
    projects: list.map((project) => ({
      id: project.id,
      name: project.name,
      project_type_name: projectTypes.find((type) => type.id === project.project_type)!.name,
      location_name: names.get(project.location as string) ?? '',
      project_status: 'Open',
      start_year: firstYear(project),
      cost: cost(project),
      annual_savings: annualSavings(project) || null,
      co2_avoided: project.co2_avoided,
      duration_years: project.projectcost_set?.length ?? 1,
    })),
    yearly_summary,
    crrem_pathway: crremPathway.filter(({ year }) => years.includes(year)),
    crrem_pathway_version: 'V2',
    npv: null,
    discount_rate: 0.07,
  };
}

const carbonPlans = plans.filter(({ seed }) => seed.auto);

/** `/budget/{id}/carbon_planner/chart-data/`, by plan id. */
export const chartDataByPlan: Map<string, ChartDataResponse> = new Map(carbonPlans.map((plan) => [plan.budget.id, chartData(plan)]));

/** `/client/{id}/carbon_planner/`: the carbon plans, with their status and totals expanded. */
export const carbonPlanSummaries: CarbonPlanSummary[] = carbonPlans.map((plan) => {
  const total = plan.projects.reduce((sum, project) => sum + cost(project), 0);
  const savings = plan.projects.reduce((sum, project) => sum + annualSavings(project), 0);
  return {
    id: plan.budget.id,
    name: plan.budget.name,
    description: plan.budget.description,
    created: at(-60),
    start_year: plan.budget.start_year,
    client_id: client.id,
    budget_status_id: plan.seed.status,
    created_by_id: null,
    auto_generated: true,
    carbon_planner_preset_id: null,
    carbon_planner_preset_config: null,
    timeline_years: plan.seed.years,
    crrem_pathway_version: 'V2',
    total_budget_constraint: null,
    baseline_emissions_kgco2e: baselineKg.toFixed(2),
    portfolio_strengths: [],
    portfolio_gaps: [],
    portfolio_reasoning: '',
    budget_status: budgetStatuses.find((status) => status.id === plan.seed.status),
    totals: {
      total_investment: total,
      total_annual_co2_reduction_kg: plan.projects.reduce((sum, project) => sum + (project.co2_avoided ?? 0), 0),
      total_annual_savings: savings,
      avg_roi: total ? Math.round((savings / total) * 10_000) / 10_000 : null,
      avg_payback_years: savings ? Math.round((total / savings) * 10) / 10 : null,
      npv: null,
      discount_rate: 0.07,
      total_actual_cost: null,
    },
  };
});

/** The client the plans belong to. */
export const planningClient = client;
