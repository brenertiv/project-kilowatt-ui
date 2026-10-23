# Dashboard Widgets

Kilowatt is rebuilding the widgets on Enertiv's Portfolio Dashboard, the customizable board in `enertiv-web` (`src/pages/Portfolio/Dashboard/`), on the design system, starting with the 22 that draw a chart. This guide is the plan: what's built, how the pieces fit, what each widget maps to, and what's left. Read it before adding or changing a widget.

The source is the Dashboard Widget Inventory, read from `enertiv-web`'s `develop` branch in October 2026: 57 widgets in five modules (Energy & ESG, Maintenance, Tenant Billing, Carbon Planning, Summary), each with its props, endpoints and chart. The inventory lives outside this repository. Its corrections, from an audit against `develop`, are listed under "What the inventory gets wrong" below. Kilowatt never edits `enertiv-web`: it holds the reference, and the app rebuilds from it (Rules → Charts → Where charts live).

## How the pieces fit

A widget is four layers. Each depends only on the one below it.

| Layer | Where | What it does |
| --- | --- | --- |
| Chart | `src/charts`, `src/components` | Draws data it's handed: `LineChart`, `Sparkline`, `ColumnChart`, `DonutChart`, `Heatmap`, `SegmentedBar`, MUI's `LinearProgress`. Knows nothing about the API. |
| Mapping | `src/widgets/mappings.ts` | A pure function from an API response to a chart's props: `scoreRows`, `statusSegments`, `varianceGrid`, `emissionsForecast`, `spendAndSavings`, `emissionsPathways`. Every number a widget shows is worked out here, and unit-tested. Requests several recipes share live in `src/widgets/planning.ts`. |
| Recipe | `src/widgets/*Widget.tsx` | Fetches with a query hook, maps, and renders the chart in an outlined `Card` inside `AsyncContent`, which shows loading, empty, failure and no access. |
| Data | `src/api` | The query hooks and the mock API, which answers in the live API's shapes from the sample portfolio (Guides → Data layer). |

A recipe takes what `enertiv-web` hands every widget: where (`scope`: `'all'`, `{ client: id }` or `{ location: id }`) and when (`from` and `to`, `YYYY-MM-DD`). Nothing else comes from the page. One recipe serves several widgets that differ only in what they ask for: `ScoreTrendWidget` with `kind="action"` is Maintenance Score Trend, and with `kind="tenant_billing"` it's Tenant Billing Score Trend.

## The phases

| Phase | What | Status |
| --- | --- | --- |
| 1. Shared states and conventions | `AsyncContent` and the `forbidden` state; reference lines, projections, status bands and markers on `LineChart`; product meanings mapped to colors (`src/charts/meanings.ts`) | Done |
| 2. Abstract charts | `Sparkline`, `Heatmap` and `SegmentedBar`; horizontal bars and "Other" grouping in `ColumnChart`; slots on `DonutChart` slices; the `LinearProgress` page | Done |
| 3. Sample data and mock routes | Scores, score averages, work-order counts, monthly location data, capital and carbon planning (projects, budgets, carbon plans, their chart data, the CRREM pathway), tenant billing (submeter logs), tenant ticket counts and data coverage (ENERGY STAR meters, utility accounts, meter types), in shapes read from the live API | Done |
| 4. Widget recipes | One recipe per chart widget, mapped from the mock API, each with stories of its states | 20 of 22 |
| 5. The rest of the board | KPI tiles and label–value lists, tables, maps, the grid and Customize panel | Not started |

## Chart widgets

Inventory ids in brackets. A widget is built when its recipe and stories exist; it waits when the mock doesn't serve its data yet.

| Widget | Chart | Recipe | Data | Status |
| --- | --- | --- | --- | --- |
| Maintenance Score Trend [12] | `LineChart`, score bands | `ScoreTrendWidget` `kind="action"` | `/action/score/` | Built |
| Tenant Billing Score Trend [20] | `LineChart`, score bands | `ScoreTrendWidget` `kind="tenant_billing"` | `/tenant_billing/score/` | Built |
| Summary: Maintenance [36] | `Sparkline` | `ScoreSummaryWidget` `kind="action"` | `/action/score/average/`, `/action/score/` | Built |
| Summary: Tenant Billing [37] | `Sparkline` | `ScoreSummaryWidget` `kind="tenant_billing"` | as above | Built |
| Summary: Alerts [31] | `Sparkline` | `ScoreSummaryWidget` `kind="notification"` | as above | Built |
| Summary: Insights [32] | `Sparkline` | `ScoreSummaryWidget` `kind="insight"` | as above | Built |
| Summary: Energy & ESG [30] | `Sparkline`, two references | `ScoreSummaryWidget` `kind="energy_star"` | as above | Built; the app reads monthly `pm_metric` instead |
| Work Order Status Breakdown [15] | `SegmentedBar` | `WorkOrderStatusWidget` | `/action/count/?group_by=action_status_id` | Built |
| Work Order Type Breakdown [16] | `DonutChart` | `WorkOrderTypeWidget` | `/action/count/?group_by=action_type_id` | Built |
| Variance Tracking [38] | `Heatmap`, diverging | `VarianceWidget` | `/location_data/` | Built; no click-through yet |
| Emissions Forecast [46] | `LineChart`, projected | `EmissionsForecastWidget` | `/location_data/?series=ghg` | Built |
| Data Coverage Trend [3] | `LineChart`, one line per utility, 0–100% | `DataCoverageTrendWidget` | `/pm_meter/data_coverage/`, `/location_utility_account/data_coverage/`, `/pm_type_of_meter/` | Built; a building's meters and accounts count as separate units (below) |
| Energy Intensity Trend [47] | `LineChart` | — | `/location_data/` and floor area | Waits for floor area in the sample |
| GRESB Score Projection [49] | `LineChart`, projected | — | none: the app's data is hard-coded | Waits for a real source |
| Carbon Budget Burn Rate [48] | `LinearProgress` | `BurnRateWidget` | `/project/`, `/budget/` | Built |
| Tickets Pending Approval by Category [14] | `DonutChart`, grouped into Other | `TicketsPendingApprovalWidget` | `/action_request/count/?group_by=action_category_id`, `/action_category/` | Built |
| Utility Cost Breakdown [21] | `DonutChart` and the balance | `UtilityCostBreakdownWidget` | `/submeter_log/` | Built |
| Portfolio Recovery [22] | `LineChart`, incomplete month dashed, and a table | `PortfolioRecoveryWidget` | `/submeter_log/` | Built; the table shows the last complete month rather than following the pointer |
| Total Expenditures Breakdown [27] | `ColumnChart` `horizontal` | `ExpendituresBreakdownWidget` | `/project/`, `/budget/` | Built; no details popup yet |
| Total Annual Expenditures [28] | `ColumnChart` stacked, grouped into Other | `AnnualExpendituresWidget` | `/project/`, `/budget/` | Built |
| Spend and Savings [55] | `ColumnChart` side by side | `SpendSavingsWidget` | `/client/{id}/carbon_planner/`, `/budget/{id}/carbon_planner/chart-data/` | Built |
| Emissions Pathways [56] | `LineChart` `interval="year"` | `EmissionsPathwaysWidget` | `/client/{id}/carbon_planner/pathway/`, plans' chart data | Built; corrects the app's "with plans" line (below) |

The other 35 widgets are KPI tiles, label–value lists, tables and maps: phase 5.

## Building a recipe

1. Check the widget's row above and its inventory entry: its endpoints, its states, what it does with missing data.
2. If the mock doesn't serve the route, add it first, in the shape the live API returns (Guides → Data layer). Confirm the shape with a read-only request; never copy customer values.
3. Write the mapping in `src/widgets/mappings.ts` and test it in `mappings.test.ts` against the mock's own response.
4. Write the recipe: query hooks, `fromQuery` (or `combineStates` for several requests), `AsyncContent` with the content's `height`, and the chart. Give it JSDoc with `@summary` and `@import`, and a line for every prop.
5. Write `Name.stories.tsx` beside it, titled `Widgets/<Name>`: the main case, then the states the data can reach (another scope, empty, loading, failed), each with a JSDoc line and a `play` check. Recipes have no guidance page, so the meta's JSDoc carries the recipe's `@summary` for the manifest; `npm run build-storybook` fails without it.
6. Update the table above.

## Rules for recipes

- **Never invent a value.** What the API doesn't have stays missing: a day without a score is left out of the line, a month with nothing to compare is a no-data cell, a building without a score shows the empty state. Never draw 0 for missing data.
- **Scores are shown 0 to 100.** The API serves them 0 to 1; `toPoints` converts them. Read scores against `scoreBands`.
- **Coverage is days with bills.** A day is covered when every meter active that day has a bill for it, or a utility account does; a month is its covered days over its expected days, averaged over the units (a utility at a building). A retired meter and its replacement read as continuous, a silent second meter leaves its days uncovered, and the month still being billed isn't drawn (`coverageByMonth`).
- **Count what's committed.** Capital and carbon recipes count only projects in approved budgets (`approvedProjects`), and only approved carbon plans; plans under review or declined are proposals, not commitments.
- **Say when a month is incomplete.** A billing month with fewer buildings billed than the month before is still being billed: dash it (`projectedFrom` with `projectedNote`), and say how many buildings are in it, so a smaller month doesn't read as a drop.
- **Running totals become yearly amounts.** The Carbon Planner reports savings and avoided CO₂ as running totals (`cumulative_cost_savings`, `cumulative_co2_reduction`). A year's amount is the total's change from the year before; never subtract a running total from a yearly figure.
- **Compare like with like.** Scale a partial month by its `coverage` before comparing it, and leave out buildings with gaps from a total over time, saying under the chart which ones.
- **Meanings by API name.** Look up colors with the API's name for the thing (`Natural Gas`, `Requires Attention`), then show it in sentence case. A translated label never reaches a lookup.
- **One state per card.** Combine every request a card makes into one `AsyncContent` state, so a card doesn't show half its data.
- **Name the chart.** Every chart's `summary` states its numbers: the latest value, the change, what stands out.

## Redesigns from the app

Where a widget broke the chart rules, Kilowatt redesigns it rather than adding a color (Rules → Charts):

- **Projections** are one line dashed from the first projected point, not a second series in a status color (Emissions Forecast, GRESB Score Projection, Portfolio Recovery's incomplete month).
- **More than six series** are grouped into Other (Total Annual Expenditures drew one per property).
- **A horizontal ranking** is one series in one color, not one series per bar (Total Expenditures Breakdown).
- **Category axes of dates** become date axes (Emissions Pathways, Portfolio Recovery).
- **Portfolio Recovery's incomplete month** is one line dashed from that month, with "incomplete month" in the tooltip, not a second series. Its "Recovery by property" panel followed the pointer in the app; Kilowatt shows the last complete month's table under the chart, lowest first, so it's readable without a pointer.
- **Data coverage units.** The app treats a building's ENERGY STAR meters and its utility accounts as one unit, linking them through the location's ENERGY STAR property (`locationpmproperty_set`). The mock doesn't serve that link, so Kilowatt's recipe counts meters by ENERGY STAR property and accounts by building, as separate units. That's exact for a building reported through one or the other, as in the sample; serve the link before using the recipe where a building has both. Supply-and-delivery account pairs aren't modelled either.
- **Tickets with no category** and categories past the five largest form one Other, merged with the category the API names Other, so a donut never shows two.
- **Seven work-order statuses** take four intents and neutral, and the legend names each; seven types take six slots, with Survey neutral.
- **Emissions with plans.** The app draws "with plans" as the baseline less the plans' *running total* of avoided CO₂ (`usePortfolioEmissionsPathwaysChart`, `hooks.ts` around line 676). That total grows every year, so the line falls to 0 within a few years. Kilowatt subtracts each year's avoided CO₂, the total's change from the year before, carried forward once a plan ends, so the line levels off at the baseline less the approved plans' annual reduction. The live chart data confirms the reading: a plan's last-year change equals its `total_annual_co2_reduction_kg`. Raise this in `enertiv-web`.
- **Fair and poor scores** are warning and error, which look alike as lines; the tooltip names the band. This was accepted as is for now.

## What the inventory gets wrong

Checked against `develop` in October 2026. The registry, module gates and most endpoints hold.

- Four widgets do show 0 for missing counts: Energy Star Alerts [4], Tenant WO Responsiveness [42], Inspection Checks [43] and Work Order Status Breakdown [15].
- Variance Tracking [38] and Energy Use Summary [57] have no module gate; Carbon Budget Burn Rate [48] is gated on Carbon Planning.
- Carbon Budget Burn Rate's progress bar is MUI (`components/common/ProgressChart`), not amCharts.
- Score dates are `YYYY-MM-DD`, not `YYYYMMDD`, and score averages also return the window before.
- The ESG Home default layout, layout auto-save, data-coverage requests (which now include utility accounts) and Summary map-pin filtering have changed since the inventory was written.
- Work-order types are seven, not four: Installation, Meter Reading and Survey as well.
- Data coverage lists each meter's window in segments: a segment with a `meter_consumption` (or, for an account, a `utility_bill`) is billed, one with `null` is a gap. A meter's utility comes from `/pm_type_of_meter/?utilitytypepmtypeofmeter=true`.
- Submeter logs keep their figures in `properties` under display names (`Total Cost`, `Utility Total Cost`, `Billing Period End`), and take dates as `YYYYMMDD`. Ticket counts can group under a `null` category.
- Carbon plans and projects are cursor paged (`{ next, previous, results }`), and a plan's `baseline_emissions_kgco2e` is a decimal string, while the pathway's `baseline_kgco2e` is a number.
