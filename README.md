# Kilowatt UI

Design system and component library for Kilowatt. Open **Theme** in the header to view and edit every primitive and semantic token; derived variables are listed alongside with their resolved values.

The Storybook (components, foundations and guides, plus `llms.txt` and an MCP endpoint for agents) is deployed on Vercel, behind Deployment Protection. Only Enertiv team members can open it. See `docs/publishing.md`.

Primitives in `src/primitives.ts` mirror the Figma **Enertiv UI Foundations** primitives collection one to one. Token values follow its semantic collection: the UI gray ramps for light and dark, the brand ramp, feedback colors, spacing, radius, type styles and shadows. Text roles map to Figma `text/primary`, `icon/default` and `text/secondary` so body copy clears AA on the raised surface. The chart series palette and the utility colors are steps from the Figma color ramps, with the series order chosen by search and validated for colorblind separation in both modes.

```bash
npm install
npm run storybook  # the design system, at http://localhost:6006
```

## Docs

Markdown in `docs/` is the source for the **Guides** section of Storybook. `scripts/build-docs.ts` (`npm run docs:build`, run by the Storybook scripts) turns each file into an MDX page, and turns the token tables into the **Foundations** pages and the token downloads (`/kilowatt-tokens.css`, the DTCG files `/tokens.light.json` and `/tokens.dark.json`). `docs/design-system-rules.md` holds the rules for using the system. Drop another `.md` file in the folder and it appears under Guides; list it in `internalDocs` in the script to keep it out.

## Storybook

Every component, recipe and page has a `Name.stories.tsx` beside it, one story per state, rendered in Storybook with the shared provider stack and a light/dark switch. Storybook writes a component manifest (`/manifests/components.json`). With `npm run storybook` it also serves an MCP endpoint at `http://localhost:6006/mcp`, so coding agents can look up components, props and usage before writing UI. `npm run test:stories` renders every story in Chromium with an accessibility check. See `docs/stories.md`, and `docs/storybook-plan.md` for the migration plan.

## For coding agents

`AGENTS.md` (imported by `CLAUDE.md`) tells agents where to look and the rules that matter most. `.mcp.json` registers the Storybook MCP server (`npm run storybook`, then `http://localhost:6006/mcp`). `npm run build-storybook` also writes `llms.txt` and one Markdown page per component, guide and foundations page into `storybook-static/`, for agents that can only fetch URLs. The same build fails if a component lacks its summary, description, import line or prop docs, or if an exported component has no story. `docs/agent-evals.md` has the prompts and rubric for checking that agents build with the system. The deployed Storybook serves the same docs tools at `/mcp` (`api/mcp.ts`), for agents that don't run Storybook locally; see `docs/publishing.md`.

## Tokens

The primitives and semantic colors are built from `src/figma/variables.json`, a committed snapshot of the Figma file's variables; code adds the tints, utilities and chart slots in `src/tokens.ts`. The Figma sync tooling (the snapshot and push scripts, component links) has been removed for now, so the snapshot only changes by hand until it returns.

## Data layer and pages

`src/api` mirrors the Enertiv API: entity types copied from live responses, a cursor-paged mock adapter with a failure switch, the `AsyncState` contract and TanStack Query hooks. `src/components/data` holds the Material UI components built on it, and `src/pages` composes them into page views whose stories run against the mock. See `docs/data-layer.md`.

## Charts

Charts live in `src/charts` and are built on amCharts 5 with one rule: tokens are the only color source.

- `createChartTheme(values)` maps the design tokens onto amCharts once (fonts, grid, tooltip, 2px lines, 4px column caps, 2px surface gaps). No chart paints a label by hand.
- `useChartRoot(setup)` owns the root: theme, resize observer, reduced motion, disposal, and a rebuild when the theme changes.
- `ChartFrame` is the shared chrome: title, HTML legend with series toggles, toolbar, loading, fetching, empty and error states at a fixed height, and a Chart/Table view toggle so every value is reachable without hover or color.
- Chart kinds take the same `ChartData` shape (`series[]` with stable ids, a `unit`, and `points`): `TimeSeriesChart`, `CategoryBarChart` (grouped, stacked, horizontal), `DonutChart`, `HeatmapChart` with `HeatScale`.
- `src/charts/color.ts` assigns the seven categorical slots (`--chart-1` to `--chart-7`) to series by id, never by position, and derives sequential and diverging ramps in OKLCH. The slots are Figma ramp steps validated with the dataviz checks on both light and dark surfaces.
- Formatting goes through `src/lib/format.ts` (`formatUnit`, `formatDelta`, `formatCompact`) so charts, tables and metric cards agree.

Hiding the amCharts logo (`root._logo.dispose()`) requires a commercial amCharts license.
