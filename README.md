# Kilowatt UI

Design system and component library for Kilowatt. Open **Theme** in the header to view and edit every primitive and semantic token; derived variables are listed alongside with their resolved values.

Live preview: https://brenertiv.github.io/project-kilowatt-ui/

Token values follow the Figma file **Enertiv UI Foundations 0.0** (Foundations page): the UI gray ramps for light and dark, the brand ramp, feedback colors, spacing, radius, type styles and shadows. Text roles map to Figma `text/primary`, `icon/default` and `text/secondary` so body copy clears AA on the raised surface. The chart series palette stays the validated eight-slot set because Figma's chart and utility colors fail the colorblind separation checks as a categorical palette; utility colors are exposed as entity tokens instead.

```bash
npm install
npm run dev
```

## Docs

Markdown in `docs/` is rendered in the app under **Docs** (`/docs/<file-name>`), with a section index built from the level-two headings. `docs/design-system-rules.md` holds the rules for using the system and lives apart from component code on purpose. Drop another `.md` file in the folder and it appears in the Docs list automatically.

## Workbench

`/workbench` renders one component at a time in isolation, after React Cosmos: `Name.fixture.tsx` files beside components are discovered automatically, `useFixtureInput` and `useFixtureSelect` expose state in a control panel, `cosmos.decorator.tsx` files wrap fixtures by directory, and `<Viewport>` opens a fixture at a device size. The URL carries the fixture and any input values, so a specific state can be linked. Sample data that reaches every state lives in `src/workbench/sampleData.ts`. See `docs/workbench.md`.

## Charts

Charts live in `src/charts` and are built on amCharts 5 with one rule: tokens are the only color source.

- `createChartTheme(values)` maps the design tokens onto amCharts once (fonts, grid, tooltip, 2px lines, 4px column caps, 2px surface gaps). No chart paints a label by hand.
- `useChartRoot(setup)` owns the root: theme, resize observer, reduced motion, disposal, and a rebuild when the theme changes.
- `ChartFrame` is the shared chrome: title, HTML legend with series toggles, toolbar, loading, fetching, empty and error states at a fixed height, and a Chart/Table view toggle so every value is reachable without hover or color.
- Chart kinds take the same `ChartData` shape (`series[]` with stable ids, a `unit`, and `points`): `TimeSeriesChart`, `CategoryBarChart` (grouped, stacked, horizontal), `DonutChart`, `HeatmapChart` with `HeatScale`.
- `src/charts/color.ts` assigns the eight categorical slots (`--chart-1` to `--chart-8`) to series by id, never by position, and derives sequential and diverging ramps in OKLCH. The palette was validated with the dataviz checks on both light and dark surfaces.
- Formatting goes through `src/lib/format.ts` (`formatUnit`, `formatDelta`, `formatCompact`) so charts, tables and metric cards agree.

Hiding the amCharts logo (`root._logo.dispose()`) requires a commercial amCharts license.
