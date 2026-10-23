import type { DonutSlice } from '../charts/DonutChart';
import type { HeatmapCell } from '../charts/Heatmap';
import { meaningColor, utilitySlots, workOrderStatusIntents, workOrderTypeSlots } from '../charts/meanings';
import type { Segment } from '../components/SegmentedBar';
import {
  budgetStatusIds,
  isExpanded,
  type ActionCategory,
  type ActionStatus,
  type ActionType,
  type Budget,
  type ChartDataResponse,
  type GroupedCount,
  type IsoDate,
  type LocationDataPoint,
  type LocationDataResponse,
  type PmMeterCoverage,
  type PmTypeOfMeter,
  type PortfolioPathwayResponse,
  type Project,
  type ScoreAverage,
  type ScorePoint,
  type SubmeterLog,
  type UtilityAccountCoverage,
} from '../api/types';

/**
 * Pure functions from the API's responses to chart props: the one place a widget's numbers are worked
 * out, so each is unit-tested without React or a chart (`mappings.test.ts`). A widget recipe fetches,
 * calls one of these, and hands the result to a chart. None of them invents a value: what the API
 * doesn't have stays missing, and the chart shows it as missing.
 */

/** A 0–1 score as people read it: 0 to 100, whole. */
export function toPoints(score: number | null): number | null {
  return score === null ? null : Math.round(score * 100);
}

/** An API name in sentence case for display: `Requires Attention` → `Requires attention`. Look meanings up by the API name, never by this. */
export function sentenceCase(name: string): string {
  return name.charAt(0) + name.slice(1).toLowerCase();
}

/** A `YYYY-MM-DD` day as a UTC timestamp. */
const dayTime = (day: string) => Date.parse(`${day}T00:00:00Z`);

/** Rows for a score line or sparkline: `{ date, score }`, 0 to 100. Days without a score are left out, so the line skips them rather than dropping to 0. */
export function scoreRows(points: ScorePoint[]): { date: number; score: number }[] {
  return points.flatMap(({ timestamp, score }) => (score === null ? [] : [{ date: dayTime(timestamp), score: toPoints(score)! }]));
}

/** A score's headline: the window's average in points, and its change from the window before, in points. Either is `null` when the API has none. */
export function scoreHeadline(average: ScoreAverage): { score: number | null; change: number | null } {
  const score = toPoints(average.score);
  const previous = toPoints(average.previous_score);
  return { score, change: score === null || previous === null ? null : score - previous };
}

/** Statuses in lifecycle order: by `sort_order`, with the ones the API puts at -1 (expired, cancelled) last. */
const lifecycle = (a: ActionStatus, b: ActionStatus) => ((a.sort_order ?? 0) < 0 ? 99 : a.sort_order ?? 0) - ((b.sort_order ?? 0) < 0 ? 99 : b.sort_order ?? 0);

/** Work orders by status as segments, in lifecycle order, each status in its intent. Statuses with no work orders stay, at 0. */
export function statusSegments(counts: GroupedCount[], statuses: ActionStatus[]): Segment[] {
  const byId = new Map(counts.map((row) => [Number(row.action_status_id), row.count]));
  return [...statuses].sort(lifecycle).map((status) => ({
    label: sentenceCase(status.name),
    value: byId.get(status.id) ?? 0,
    status: workOrderStatusIntents[status.name] ?? 'neutral',
  }));
}

/** Work orders by type as donut slices, each type in its slot. Types with no work orders are left out; a donut has nothing to draw for them. */
export function typeSlices(counts: GroupedCount[], types: ActionType[]): DonutSlice[] {
  const byId = new Map(types.map((type) => [type.id, type.name]));
  return counts.flatMap((row) => {
    const name = byId.get(Number(row.action_type_id));
    return row.count > 0 && name ? [{ category: sentenceCase(name), value: row.count, ...meaningColor(workOrderTypeSlots, name) }] : [];
  });
}

const monthKey = (ts: string) => ts.slice(0, 7);
const monthName = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

/** A point's value scaled to a whole month, so a partial month compares fairly with a full one. */
const fullMonth = (point: LocationDataPoint) => (point.coverage > 0 ? point.value / point.coverage : point.value);

/**
 * Each building's use against the same month a year before, as heatmap cells: the change in percent,
 * one decimal. A month with no data this year or last is `noData`, never 0; a partial month is scaled
 * to a whole month by its coverage before it's compared.
 *
 * @param current - `/location_data/` for the year shown, one location per building.
 * @param previous - The same request a year earlier.
 */
export function varianceGrid(current: LocationDataResponse, previous: LocationDataResponse): { rows: string[]; columns: string[]; cells: HeatmapCell[] } {
  const keys = [...new Set(current.locations.flatMap(({ points }) => points.map(({ ts }) => monthKey(ts))))].sort();
  const before = new Map(previous.locations.map((location) => [location.location_id, new Map(location.points.map((point) => [monthKey(point.ts), point]))]));
  const lastYear = (key: string) => `${Number(key.slice(0, 4)) - 1}${key.slice(4)}`;
  const column = (key: string) => monthName.format(new Date(`${key}-01T00:00:00Z`));
  const cells = current.locations.flatMap((location) => {
    const now = new Map(location.points.map((point) => [monthKey(point.ts), point]));
    return keys.map((key): HeatmapCell => {
      const point = now.get(key);
      const earlier = before.get(location.location_id)?.get(lastYear(key));
      if (!point || !earlier || fullMonth(earlier) === 0) return { row: location.location_name, column: column(key), state: 'noData' };
      return { row: location.location_name, column: column(key), value: Math.round((fullMonth(point) / fullMonth(earlier) - 1) * 1000) / 10 };
    });
  });
  return { rows: current.locations.map(({ location_name }) => location_name), columns: keys.map(column), cells };
}

/**
 * A portfolio's monthly emissions, measured and then projected: the measured months are summed over
 * the buildings with data for every one of them (like for like, so a building metered mid-window doesn't
 * look like a jump), through the last full month. Each projected month is the same month a year before,
 * times the last twelve months' change on the twelve before. With less than two years measured, there's
 * no projection.
 *
 * @param data - `/location_data/?series=ghg` for at least the last two years.
 * @param ahead - How many months to project. Default `12`.
 * @returns The rows (`{ date, emissions }`, tCO₂e), the first projected month, and the buildings left out.
 */
export function emissionsForecast(data: LocationDataResponse, ahead = 12) {
  const full = data.locations.map((location) => ({
    ...location,
    points: location.points.filter(({ data_status: status }) => status === 'OK'),
  }));
  const keys = [...new Set(full.flatMap(({ points }) => points.map(({ ts }) => monthKey(ts))))].sort();
  const included = full.filter(({ points }) => points.length === keys.length);
  const total = (key: string) => included.reduce((sum, { points }) => sum + (points.find(({ ts }) => monthKey(ts) === key)?.value ?? 0), 0);
  const time = (key: string) => Date.parse(`${key}-01T00:00:00Z`);
  const measured = keys.map((key) => ({ date: time(key), emissions: Math.round(total(key)) }));
  const excluded = data.locations.filter((location) => !included.some(({ location_id: id }) => id === location.location_id)).map(({ location_name }) => location_name);
  if (measured.length < 24 || !keys.length) return { rows: measured, projectedFrom: undefined, excluded };
  const sum = (rows: { emissions: number }[]) => rows.reduce((s, row) => s + row.emissions, 0);
  const trend = sum(measured.slice(-12)) / sum(measured.slice(-24, -12));
  const last = new Date(measured[measured.length - 1]!.date);
  const projected = Array.from({ length: ahead }, (_, i) => {
    const date = Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1 + i, 1);
    const yearBefore = measured[measured.length - 12 + (i % 12)]!;
    return { date, emissions: Math.round(yearBefore.emissions * trend ** (1 + Math.floor(i / 12))) };
  });
  return { rows: [...measured, ...projected], projectedFrom: projected[0]!.date, excluded };
}

/** kg to metric tonnes, whole. */
const tonnes = (kg: number) => Math.round(kg / 1000);

/** A year's start as a UTC timestamp, for a date axis. */
const yearTime = (year: number) => Date.UTC(year, 0, 1);

/** The projects in approved budgets, with costs: what a portfolio has committed to. Plans under review or declined don't count. */
export function approvedProjects(projects: Project[], budgets: Budget[]): Project[] {
  const approved = new Set(
    budgets.filter((budget) => (isExpanded(budget.budget_status) ? budget.budget_status.id : budget.budget_status) === budgetStatusIds.approved).map(({ id }) => id),
  );
  return projects.filter((project) => project.projectcost_set?.length && project.budgetproject_set?.some(({ budget }) => approved.has(budget)));
}

/**
 * Committed spend by year and property, for a stacked column chart: one row per year, one field per
 * property (its id), and the series largest first, named for the property. The chart groups past six
 * into Other.
 *
 * @param projects - Projects with `projectcost_set` and an expanded `location`, already narrowed with `approvedProjects`.
 */
export function annualExpenditures(projects: Project[]) {
  const names = new Map<string, string>();
  const byYear = new Map<string, Record<string, number>>();
  const totals = new Map<string, number>();
  for (const project of projects) {
    const location = project.location;
    const id = isExpanded(location) ? location.id : location;
    if (isExpanded(location)) names.set(id, location.name);
    for (const { project_date: date, value } of project.projectcost_set ?? []) {
      const year = date.slice(0, 4);
      const row = byYear.get(year) ?? {};
      row[id] = (row[id] ?? 0) + value;
      byYear.set(year, row);
      totals.set(id, (totals.get(id) ?? 0) + value);
    }
  }
  const order = [...totals.entries()].filter(([, total]) => total > 0).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const rows = [...byYear.keys()].sort().map((year) => ({ year, ...Object.fromEntries(order.map((id) => [id, byYear.get(year)![id] ?? 0])) }));
  return { rows, series: order.map((id) => ({ field: id, name: names.get(id) ?? 'Unnamed property' })) };
}

/** Committed spend by project type, largest first, for a horizontal ranking. Types with no spend are left out. */
export function expendituresByType(projects: Project[]): { type: string; spend: number }[] {
  const byType = new Map<string, number>();
  for (const project of projects) {
    const name = isExpanded(project.project_type) ? project.project_type.name : `Type ${project.project_type}`;
    byType.set(name, (byType.get(name) ?? 0) + (project.projectcost_set ?? []).reduce((sum, { value }) => sum + value, 0));
  }
  return [...byType.entries()].filter(([, spend]) => spend > 0).sort((a, b) => b[1] - a[1]).map(([type, spend]) => ({ type, spend }));
}

/** Each year's change in a cumulative series: the year's own amount. */
const yearly = (rows: { year: number; value: number }[]) => rows.map(({ year, value }, i) => ({ year, value: value - (rows[i - 1]?.value ?? 0) }));

/**
 * What approved carbon plans spend and save each year, summed across plans, for a side-by-side column
 * chart. A plan's savings arrive as a running total (`cumulative_cost_savings`), so each year's savings
 * are its difference from the year before, never below 0.
 */
export function spendAndSavings(responses: ChartDataResponse[]): { year: string; spend: number; savings: number }[] {
  const byYear = new Map<number, { spend: number; savings: number }>();
  for (const { yearly_summary: rows } of responses) {
    const sorted = [...rows].sort((a, b) => a.year - b.year);
    const savings = yearly(sorted.map(({ year, cumulative_cost_savings: value }) => ({ year, value })));
    sorted.forEach(({ year, spend }, i) => {
      const entry = byYear.get(year) ?? { spend: 0, savings: 0 };
      entry.spend += spend;
      entry.savings += Math.max(0, savings[i]!.value);
      byYear.set(year, entry);
    });
  }
  return [...byYear.entries()].sort(([a], [b]) => a - b).map(([year, { spend, savings }]) => ({ year: String(year), spend: Math.round(spend), savings: Math.round(savings) }));
}

/**
 * The portfolio's emissions against the CRREM pathway, year by year, in tCO₂e: the pathway, the baseline
 * without plans (level), and the baseline less what the approved plans avoid that year. A plan reports its
 * avoided CO₂ as a running total (`cumulative_co2_reduction`); what it avoids in a year is that total's
 * change from the year before, and it keeps avoiding its last year's amount after it ends (retrofits stay
 * installed). Also the first year each line rises above the pathway, or `null` if it never does.
 * With no baseline there's nothing to draw.
 */
export function emissionsPathways(pathway: PortfolioPathwayResponse, approved: ChartDataResponse[]) {
  const baseline = pathway.baseline_kgco2e;
  if (baseline === null) return { rows: [], leavesWithout: null, leavesWith: null };
  const plans = approved
    .filter(({ yearly_summary: rows }) => rows.length)
    .map(({ yearly_summary: rows }) => {
      const sorted = [...rows].sort((a, b) => a.year - b.year);
      const annual = yearly(sorted.map(({ year, cumulative_co2_reduction: value }) => ({ year, value })));
      return { byYear: new Map(annual.map(({ year, value }) => [year, value])), first: sorted[0]!.year, last: sorted[sorted.length - 1]!.year };
    });
  const avoided = (year: number) =>
    plans.reduce((sum, plan) => sum + (year < plan.first ? 0 : (plan.byYear.get(Math.min(year, plan.last)) ?? 0)), 0);
  const rows = pathway.crrem_pathway.map(({ year, kgco2e }) => ({
    date: yearTime(year),
    crrem: tonnes(kgco2e),
    without: tonnes(baseline),
    with: tonnes(Math.max(0, baseline - avoided(year))),
  }));
  const leaves = (field: 'without' | 'with') => {
    const row = rows.find((candidate) => candidate[field] > candidate.crrem);
    return row ? new Date(row.date).getUTCFullYear() : null;
  };
  return { rows, leavesWithout: leaves('without'), leavesWith: leaves('with') };
}

/**
 * How much of the committed capital is spent: the total of every cost, the costs dated on or before
 * `asOf`, what's left, and the CO₂ the projects with spend so far avoid each year (kg; `undefined` when
 * none of them carries an estimate, rather than 0).
 */
export function burnRate(projects: Project[], asOf: string) {
  let total = 0;
  let spent = 0;
  const started = new Set<string>();
  for (const project of projects) {
    for (const { project_date: date, value } of project.projectcost_set ?? []) {
      total += value;
      if (date <= asOf) {
        spent += value;
        started.add(project.id);
      }
    }
  }
  const estimates = projects.filter((project) => started.has(project.id) && project.co2_avoided !== null);
  return {
    total,
    spent,
    remaining: total - spent,
    share: total > 0 ? spent / total : 0,
    co2AvoidedKg: estimates.length ? estimates.reduce((sum, project) => sum + project.co2_avoided!, 0) : undefined,
  };
}

/** A submeter log's billing month, `YYYY-MM`, from the end of its billing period. */
const billingMonth = (log: SubmeterLog) => log.properties!['Billing Period End'].slice(0, 7);

/** The number of buildings billed in each month. */
function buildingsByMonth(logs: SubmeterLog[]) {
  const buildings = new Map<string, Set<string>>();
  for (const log of logs) {
    const month = billingMonth(log);
    buildings.set(month, (buildings.get(month) ?? new Set()).add(log.properties!['Building Name']));
  }
  return buildings;
}

/**
 * The latest billing month's utility cost by utility type, and what was billed against it: donut slices
 * (each utility in its slot from `utilitySlots`, keyed on the API's name), the month, what tenants were
 * billed, what the utilities charged, the net and the margin on the utility cost. A month still being
 * billed says how many buildings are in it so far, against the month before.
 *
 * @param logs - Submeter logs with `properties` and an expanded `utility_type`.
 */
export function utilityCostBreakdown(logs: SubmeterLog[]) {
  const months = [...new Set(logs.map(billingMonth))].sort();
  const month = months[months.length - 1];
  if (!month) return undefined;
  const latest = logs.filter((log) => billingMonth(log) === month);
  const byType = new Map<string, number>();
  for (const log of latest) {
    const name = isExpanded(log.utility_type) ? log.utility_type.name : `Utility ${log.utility_type}`;
    byType.set(name, (byType.get(name) ?? 0) + log.properties!['Utility Total Cost']);
  }
  const sum = (key: 'Total Cost' | 'Utility Total Cost') => Math.round(latest.reduce((total, log) => total + log.properties![key], 0));
  const billables = sum('Total Cost');
  const utilities = sum('Utility Total Cost');
  const counts = buildingsByMonth(logs);
  return {
    month,
    slices: [...byType.entries()].map(([name, value]): DonutSlice => ({ category: name, value: Math.round(value), ...meaningColor(utilitySlots, name) })),
    billables,
    utilities,
    net: billables - utilities,
    margin: utilities > 0 ? (billables - utilities) / utilities : null,
    buildings: counts.get(month)!.size,
    buildingsBefore: months.length > 1 ? counts.get(months[months.length - 2]!)!.size : null,
  };
}

/**
 * Recovery by billing month: what tenants were billed over what the utilities charged, in percent with one
 * decimal, across every building billed that month. When the latest month has fewer buildings billed than
 * the month before, it's incomplete: `incompleteFrom` marks it, so the line can dash it rather than show a
 * partial month as a real change. Also each building's recovery in the latest complete month, lowest first.
 *
 * @param logs - Submeter logs with `properties`.
 */
export function recoveryByMonth(logs: SubmeterLog[]) {
  const months = [...new Set(logs.map(billingMonth))].sort();
  const recovery = (list: SubmeterLog[]) => {
    const utility = list.reduce((sum, log) => sum + log.properties!['Utility Total Cost'], 0);
    return utility > 0 ? Math.round((list.reduce((sum, log) => sum + log.properties!['Total Cost'], 0) / utility) * 1000) / 10 : null;
  };
  const rows = months.flatMap((month) => {
    const value = recovery(logs.filter((log) => billingMonth(log) === month));
    return value === null ? [] : [{ date: Date.parse(`${month}-01T00:00:00Z`), recovery: value }];
  });
  const counts = buildingsByMonth(logs);
  const last = months[months.length - 1];
  const before = months[months.length - 2];
  const incomplete = Boolean(last && before && counts.get(last)!.size < counts.get(before)!.size);
  const complete = incomplete ? before : last;
  const byProperty = complete
    ? [...counts.get(complete)!]
        .map((building) => ({ building, recovery: recovery(logs.filter((log) => billingMonth(log) === complete && log.properties!['Building Name'] === building))! }))
        .sort((a, b) => a.recovery - b.recovery)
    : [];
  return { rows, incompleteFrom: incomplete ? rows[rows.length - 1]!.date : undefined, completeMonth: complete, byProperty };
}

/** The most slices a donut shows (Rules → Charts). */
const maxSlices = 6;

/**
 * Tickets pending approval by category, as donut slices: tickets with no category, or one the lookup
 * doesn't know, count as Other, merged with the category the API calls Other. Past six slices, the five
 * largest keep theirs and the rest join Other, so there's only ever one Other, drawn `neutral`.
 */
export function pendingCategorySlices(counts: GroupedCount[], categories: ActionCategory[]): DonutSlice[] {
  const names = new Map(categories.map(({ id, name }) => [id, name]));
  const byName = new Map<string, number>();
  for (const row of counts) {
    const name = names.get(Number(row.action_category_id)) ?? 'Other';
    if (row.count > 0) byName.set(name, (byName.get(name) ?? 0) + row.count);
  }
  const named = [...byName.entries()].filter(([name]) => name !== 'Other').sort((a, b) => b[1] - a[1]);
  const keep = byName.size > maxSlices ? named.slice(0, maxSlices - 1) : named;
  const other = (byName.get('Other') ?? 0) + named.slice(keep.length).reduce((sum, [, count]) => sum + count, 0);
  return [...keep.map(([category, value]) => ({ category, value })), ...(other > 0 ? [{ category: 'Other', value: other, neutral: true }] : [])];
}

/** The days of a segment, `YYYY-MM-DD`, inclusive. */
function segmentDays({ start_date: start, end_date: end }: { start_date: IsoDate; end_date: IsoDate }): IsoDate[] {
  const days: IsoDate[] = [];
  for (let time = Date.parse(`${start}T00:00:00Z`); time <= Date.parse(`${end}T00:00:00Z`); time += 86_400_000) days.push(new Date(time).toISOString().slice(0, 10));
  return days;
}

/**
 * Data coverage by month and utility, in percent with one decimal, for a line per utility. A unit is one
 * utility at one ENERGY STAR property (its meters) or, for a building reported only through utility bills,
 * at one building (its accounts). Within a unit, a day is expected when any of its meters or accounts is
 * active that day (the API clips each one's window to its first bill and retirement), and covered when every
 * meter active that day has a bill for it, or an account does. So a retired meter and its replacement read
 * as continuous, and a second meter that goes silent leaves those days uncovered. A unit's month is its
 * covered days over its expected days; a utility's month is the average over the units expected in it.
 * Months from `asOf`'s on are left out: their bills haven't arrived yet.
 *
 * @param meters - `/pm_meter/data_coverage/` results.
 * @param accounts - `/location_utility_account/data_coverage/` results, `utility_bill_type` expanded.
 * @param types - `/pm_type_of_meter/?utilitytypepmtypeofmeter=true`, to read each meter's utility.
 * @param asOf - Today, `YYYY-MM-DD`.
 */
export function coverageByMonth(meters: PmMeterCoverage[], accounts: UtilityAccountCoverage[], types: PmTypeOfMeter[], asOf: IsoDate) {
  const utilityOfType = new Map(types.flatMap(({ id, utilitytypepmtypeofmeter: utility }) => (utility ? [[id, utility.utility_type]] : [])));
  const utilityName = new Map([...utilityOfType.values()].map(({ id, name }) => [id, name]));
  type Unit = { utility: string; expected: Map<IsoDate, number>; billed: Map<IsoDate, number>; accountCovered: Set<IsoDate> };
  const units = new Map<string, Unit>();
  const unit = (utility: string, key: string) => {
    const id = `${utility}|${key}`;
    if (!units.has(id)) units.set(id, { utility, expected: new Map(), billed: new Map(), accountCovered: new Set() });
    return units.get(id)!;
  };
  for (const meter of meters) {
    const utility = utilityOfType.get(isExpanded(meter.type) ? meter.type.id : meter.type)?.name;
    if (!utility) continue;
    const target = unit(utility, `property:${meter.property}`);
    for (const segment of meter.data_coverage) {
      for (const day of segmentDays(segment)) {
        target.expected.set(day, (target.expected.get(day) ?? 0) + 1);
        if (segment.meter_consumption) target.billed.set(day, (target.billed.get(day) ?? 0) + 1);
      }
    }
  }
  for (const account of accounts) {
    const utility = isExpanded(account.utility_bill_type) ? utilityName.get(account.utility_bill_type.utility_type) : undefined;
    if (!utility) continue;
    const target = unit(utility, `location:${account.location}`);
    for (const segment of account.data_coverage) {
      for (const day of segmentDays(segment)) {
        // An account's day is expected once, however many accounts the building has.
        if (!target.expected.has(day)) target.expected.set(day, 0);
        if (segment.utility_bill) target.accountCovered.add(day);
      }
    }
  }
  const current = asOf.slice(0, 7);
  const byMonth = new Map<string, Map<string, number[]>>();
  for (const { utility, expected, billed, accountCovered } of units.values()) {
    const months = new Map<string, { expected: number; covered: number }>();
    for (const [day, count] of expected) {
      const month = day.slice(0, 7);
      if (month >= current) continue;
      const entry = months.get(month) ?? { expected: 0, covered: 0 };
      entry.expected += 1;
      if ((count > 0 && billed.get(day) === count) || accountCovered.has(day)) entry.covered += 1;
      months.set(month, entry);
    }
    for (const [month, { expected: days, covered }] of months) {
      const shares = byMonth.get(month) ?? new Map<string, number[]>();
      shares.set(utility, [...(shares.get(utility) ?? []), covered / days]);
      byMonth.set(month, shares);
    }
  }
  const utilities = [...new Set([...units.values()].map(({ utility }) => utility))].sort(
    (a, b) => (utilitySlots[a] ?? 9) - (utilitySlots[b] ?? 9) || a.localeCompare(b),
  );
  const rows = [...byMonth.keys()].sort().map((month) => {
    const shares = byMonth.get(month)!;
    return {
      date: Date.parse(`${month}-01T00:00:00Z`),
      ...Object.fromEntries(
        [...shares].map(([utility, values]) => [utility, Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000) / 10]),
      ),
    } as { date: number } & Record<string, number>;
  });
  return { rows, series: utilities.map((utility) => ({ field: utility, name: utility, ...meaningColor(utilitySlots, utility) })) };
}
