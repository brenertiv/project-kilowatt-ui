# Agent Evals

These prompts check whether a coding agent pointed at the Storybook builds with Kilowatt rather than around it. Re-run them after any substantial change to the docs, the manifest or `AGENTS.md`. Then compare the scores between runs and between the access modes.

## Access modes

Run every prompt once per mode, each in a fresh agent session with a clean checkout:

| Mode | Setup |
| --- | --- |
| **MCP** | `npm run storybook` is running, and `.mcp.json` points the agent at `http://localhost:6006/mcp`. |
| **Static** | No MCP server. The agent may read `storybook-static/llms.txt` and the pages it links (`npm run build-storybook` first), and the repository. |
| **Repository only** | No MCP server and no built Storybook. The agent has the repository and `AGENTS.md`. This is the baseline. |

Ask each agent to write its result to `src/evals/<prompt-id>.tsx` and nothing else. Discard those files afterwards; they are not part of the system.

## Prompts

1. **`work-orders`.** Build a work orders list page. It needs a page header titled "Work orders", a search box and a sort control, a list of work orders showing each one's name, building and status, and previous and next paging. Handle loading, empty and failed requests. Use the mock API.
2. **`building-kpis`.** Build the top of a building dashboard for a building id passed as a prop. Show its name as the page title with a breadcrumb back to the portfolio, then four headline numbers: consumption last 30 days (kWh, lower is better), peak demand (kW, lower is better), utility spend this quarter (USD) and open work orders. Show each number's change against the previous period. Handle loading and failure.
3. **`meter-table`.** Build a table of meters with columns for name, source, status, last reading (a number in kWh), change versus last month and last read date. It should sort and filter, export to CSV, and page through 25 rows at a time. Use the sample meters.
4. **`demand-chart`.** Build a card that charts a building's hourly demand in kW over the last 7 days, with a comparison series for the same week last year. Include a title, a legend, and a way to read the values without hovering. Handle loading, empty and failed data.
5. **`alert-settings`.** Build a dialog for alert settings, opened from a button labelled "Alert settings". Inside: an email address field with validation, a switch for "Notify on critical alerts", a select for digest frequency (Off, Daily, Weekly), and Cancel and Save buttons.

## Rubric

Score each result out of 10 points. `npx tsx scripts/grade-eval.ts src/evals` checks the mechanical items; a person checks the rest.

| Points | Check | Checked by |
| --- | --- | --- |
| 2 | Imports the documented components (`src/components/...`, `src/charts/...`) rather than rebuilding them from MUI or HTML. | Grader, then a person |
| 2 | No hard-coded colors, font families or pixel sizes. Styles use tokens or the MUI theme. | Grader |
| 2 | Covers the async states the prompt asks for, through `fromQuery` with `DataState` or the component's `state` prop. No hand-rolled spinner. | Grader, then a person |
| 1 | User-facing copy goes through `t()` from i18n. | Grader (heuristic) |
| 1 | Uses only props that exist. `npx tsc --noEmit -p .storybook` passes with the file in place. | `tsc` |
| 1 | Accessibility: icon-only controls have labels, fields have labels, the chart has an `ariaLabel`. | Person |
| 1 | Runs: rendered in a scratch story, it shows the right thing in both color schemes. | Person |

Record each run in the table below, one row per prompt and mode. Note the date, the agent and model, and the commit.

| Date | Agent and model | Commit | Prompt | Mode | Score | Notes |
| --- | --- | --- | --- | --- | --- | --- |
