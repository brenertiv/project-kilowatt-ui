# Kilowatt UI: instructions for coding agents

Kilowatt is Enertiv's design system. It is Material UI with light and dark color schemes, changed only where a departure says so: the palette (surfaces, borders, a navy primary (light neutral in dark), a brand-blue secondary, a purple info, intent colors), the corner radius, the button style, the icon set, type rendering (tabular numerals, text wrapping, no synthesized styles) and reduced motion. Read the Storybook before you write UI.

## Look things up before writing UI

- **Storybook MCP** (`kilowatt-storybook` in `.mcp.json`) is live while `npm run storybook` runs, at `http://localhost:6006/mcp`.
  - `docs-list` lists every component and guide.
  - `docs-show` gives one component's description, import line, props, guidance and story snippets.
  - `docs-show-story` gives one story's snippet.
  - `test-run` runs the story tests.
- **Deployed Storybook:** https://kilowatt-ui.vercel.app, public with no login. Its MCP endpoint is `https://kilowatt-ui.vercel.app/mcp`, and `llms.txt` is at its root. `docs/publishing.md` covers the setup.
- **Without MCP**, read the static files from the published site, or from a local build (`npm run build-storybook`, then `storybook-static/`): `llms.txt` (the index), `guides/<slug>.md`, `foundations/<slug>.md` and `manifests/components.json`.
- **Rules** are in `docs/design-system-rules.md`. They are binding.

## Rules that matter most

1. **MUI is the default.** Build with Material UI components, props and variants as MUI documents them. Kilowatt differs from stock MUI only where Foundations → MUI departures says so.
2. **Figma is an approximation; the Storybook is the source of truth.** Take a Figma design's layout, structure and states, and build every value from what the Storybook already has. Ignore Figma's variables and semantics (color variables, text styles, token names, ramp step numbers): map each to the closest existing role. Where they differ, the Storybook wins; say where the build differs from the design. Before building anything the Storybook doesn't already have (a token, role, CSS variable, departure or component pattern), stop and confirm with the person who asked, saying what you'd add and which existing conventions you tried first. Never cite Figma as the reason for a decision. See Rules → Figma is an approximation.
3. **No parallel conventions.** Take color, type, spacing, radius, elevation, breakpoints and motion from the MUI theme: through component props, or `sx` with theme keys (`color: 'text.secondary'`, `p: 2`). The Foundations pages list every value. Don't add CSS variables, hex values, pixel radii or font families of your own. Tokens have three tiers (Rules → Token tiers): ramps in `src/mui/colors.ts`, the palette and type roles, then `theme.components`; each reads only the tier below. Ramps use only the standard steps (50, 100 to 900, 950), never half steps.
4. **New conventions are departures.** Anything that differs from MUI's default goes in `src/mui/departures.ts` with its reason, and nowhere else. Check it doesn't overlap an existing entry. `departures.test.ts` fails when the theme differs from MUI without a departure. Charts' departures from stock amCharts go in `src/charts/departures.ts` the same way (the chart theme is built from it), and each chart page lists its own under amCharts departures; maps' departures from stock CARTO go in `src/maps/departures.ts` (Rules → Adding a convention).
5. **Surfaces and borders.** Backgrounds are `background.level0` (page) to `level4` (highest); Paper picks its level from `elevation`. Surface borders are `border.level0` (faintest) to `level3` (strongest) for separators and frames, with `divider` at `level1`. Control outlines are separate: `palette.control` (`border`, `hover`, `focus`, `pressed`), set through the `control-outlines` departure; don't outline a control with a border level or a surface with a control color. Never use a ramp step from `src/mui/colors.ts` directly.
6. **One border per edge.** While building UI, look for double borders on the same layer (nested frames, adjacent full borders, a divider on a container's edge, border plus shadow, borders inside a scroll container) and keep one line per edge. Modals, menus, popovers and other floating layers are exempt. See Rules → One border per edge.
7. **Concentric corners.** Every rounded component uses the theme radius (8px; `sx` `borderRadius: 1`), and it changes only through the `shape-radius` departure, never per intent, variant or instance. Cards round at twice it (16px) through `card-radius`, because their controls sit 8px from the corners. When a rounded element sits within 16px of a rounded container's corner, the container's radius is the element's plus the gap; the element keeps the theme radius. See Rules → Concentric corners.
8. **Medium size.** Components with a `size` prop stay at `medium`, the default (Fab included, through the `medium-size` departure); leave `size` off. Use `small` or `large` only for a one-off instance, and keep controls that sit together at one size. See Rules → Component size.
9. **Icons.** Use `<Icon name="…" />` from `src/icons` (Material Symbols through MUI's `Icon`), with MUI's `fontSize` and `color` for size and color. Selected controls fill their icons through the theme; don't pass `fill={selected}`. An icon-only control needs an `aria-label`.
10. **Type and content.** Text renders antialiased through CssBaseline; don't override it. Numbers that are data (tables, KPIs, readings) use tabular figures: the theme sets them on numeric components, and `sx={{ fontVariantNumeric: 'tabular-nums' }}` covers the rest. Format numbers, units, currency and dates with `Intl`, use real punctuation (“ ” ’ – — …), cap long-form text at 60–75ch, and give truncated text a way to see the full value. See Rules → Typography and Content and layout.
11. **Motion and feedback.** CssBaseline stills transitions under `prefers-reduced-motion`; JavaScript animations check it too. Hit areas are 24px at minimum. Color is never the only signal, and results that appear on their own are announced (Snackbar, Alert or `aria-live`). See Rules → Motion and Accessibility.
12. **Charts.** amCharts 5 inside MUI's outlined `Card` (`variant="outlined"`, under a `CardHeader`, the chart straight in the card with its own padding (`inset`, 16px by default) rather than `CardContent`), themed by one Kilowatt theme function, never by colors in chart code. The header is a title only: the page sets the period, and units sit with the numbers (above the value axis with `axisUnit`, and in tooltips); one value axis sits on the right, two units take left and right; axis numbers are compact (1.5K, 60K, set by `useChart`), so every hoverable chart item has a tooltip with the exact value (`tooltipNumberFormat`); two units at most per chart. Color does four jobs: `chart.series` (six hues) tells categories apart, `chart.sequential` shows magnitude, `success`/`error` show deviation, and the intents show status; `chart.neutral` is for what isn't the focus. Product meanings (utility types and the like) map to series slots in product code; variants differ by line style, not color; past six series, group or use a table. Chrome uses existing roles (`text.secondary`, `border.level*`, `action.hover`). Kilowatt holds the reference charts; Enertiv's app rebuilds its charts from them rather than importing them. Run every chart through `useChart` (`src/charts/useChart`), never set a color in chart code, don't mix series and status colors in one chart, and redesign a chart that doesn't fit rather than adding a color. See Rules → Charts and Card → Chart.
13. **Maps.** MapLibre GL with CARTO's basemaps (Positron in light, Dark Matter in dark) and deck.gl for data, themed by one Kilowatt theme function, never by colors in map code. Load the basemap with `basemapStyle(scheme)` and take data colors from `mapColors(scheme)` (`src/maps/theme`): the land is the card surface, water is `map.water`, and data takes the chart roles and rules. Maps sit edge to edge in an outlined `Card`, use MUI buttons for controls, keep CARTO's compact attribution and have a text alternative. Departures from CARTO go in `src/maps/departures.ts` (the basemap theme is built from it). See Rules → Maps.
14. **Use only documented props.** If a prop you need doesn't exist, say so rather than passing something undocumented.

## Dashboard widgets

Kilowatt is rebuilding the widgets of Enertiv's Portfolio Dashboard. `docs/dashboard-widgets.md` (Guides → Dashboard widgets) is the plan: the phases, which chart and recipe each widget maps to, what's built and what waits, and how to build a recipe. A recipe in `src/widgets` fetches with a query hook from `src/api`, maps the response with a tested function in `src/widgets/mappings.ts`, and draws a chart inside `AsyncContent`. Read the guide before adding or changing a widget, and update its table when you do.

## When you change the system

- **New or changed components.** Every component gets `Name.stories.tsx` and `Name.mdx` in `src/components`, in the one format in `docs/stories.md` (Button is the reference): `parameters.muiComponents`, args only for non-default values, one story per variant and state with a JSDoc line, and a page with When to use, Usage, Do and don't, MUI departures and Accessibility sections. `src/components/docs.test.ts` enforces it. A component of our own also needs JSDoc (a description, `@summary`, `@import`, and a line for every prop with its default).
- **Story files** import with `src/...` paths, never relative ones.
- **Checks before you finish:**
  - `npm run lint`
  - `npx tsc --noEmit -p .storybook`
  - `npm test` (unit tests, plus every story rendered in Chromium with an accessibility check)
  - `npm run build-storybook` (builds the site, writes `llms.txt`, and fails if a component is missing docs)

## Layout of the repository

| Path | What it holds |
| --- | --- |
| `src/mui` | The theme (`theme.ts`), the departures from stock MUI (`departures.ts`), the color ramps (`colors.ts`), the Foundations tables (`foundations.ts`) and specimens, and their tests. |
| `src/charts` | The amCharts reference charts, `useChart`, the chart theme (`theme.ts`) and the departures from stock amCharts it's built from (`departures.ts`), and their tests. |
| `src/maps` | The reference maps (`SiteMap`), the CARTO basemap theme and `mapColors` (`theme.ts`), the departures from stock CARTO it's built from (`departures.ts`), the CARTO access token (`carto.ts`), and their tests. |
| `src/icons.tsx` | The `Icon` component and the icon names it accepts. |
| `src/api` | API types, the mock adapter, `AsyncState` and the query hooks. |
| `src/widgets` | Dashboard widget recipes, their mappings from API responses to chart props (`mappings.ts`), and their stories. |
| `src/fixtures/data` | The sample portfolio the mock API serves, and the time series drawn from it (`series.ts`). |
| `docs/` | Guides, which also appear in Storybook. |
