# Kilowatt UI: instructions for coding agents

Kilowatt is Enertiv's design system. It is Material UI with light and dark color schemes, changed only where a departure says so: the palette (surfaces, borders, a navy primary, intent colors), the corner radius, the button style and the icon set. Read the Storybook before you write UI.

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
2. **No parallel conventions.** Take color, type, spacing, radius, elevation, breakpoints and motion from the MUI theme: through component props, or `sx` with theme keys (`color: 'text.secondary'`, `p: 2`). The Foundations pages list every value. Don't add CSS variables, hex values, pixel radii or font families of your own. Tokens have three tiers (Rules → Token tiers): ramps in `src/mui/colors.ts`, the palette and type roles, then `theme.components`; each reads only the tier below. Ramps use only the standard steps (50, 100 to 900, 950), never half steps.
3. **New conventions are departures.** Anything that differs from MUI's default goes in `src/mui/departures.ts` with its reason, and nowhere else. Check it doesn't overlap an existing entry. `departures.test.ts` fails when the theme differs from MUI without a departure.
4. **Surfaces and borders.** Backgrounds are `background.level0` (page) to `level4` (highest); Paper picks its level from `elevation`. Borders are `border.level0` (faintest) to `level2` for separators and frames, with `divider` at `level1`; `border.level3` (3:1) is only for control outlines. Never use a ramp step from `src/mui/colors.ts` directly.
5. **One border per edge.** While building UI, look for double borders on the same layer (nested frames, adjacent full borders, a divider on a container's edge, border plus shadow, borders inside a scroll container) and keep one line per edge. Modals, menus, popovers and other floating layers are exempt. See Rules → One border per edge.
6. **Concentric corners.** Every rounded component uses the theme radius (8px; `sx` `borderRadius: 1`), and it changes only through the `shape-radius` departure, never per intent, variant or instance. When a rounded element sits within 16px of a rounded container's corner, the container's radius is the element's plus the gap; the element keeps the theme radius. See Rules → Concentric corners.
7. **Icons.** Use `<Icon name="…" />` from `src/icons` (Material Symbols through MUI's `Icon`), with MUI's `fontSize` and `color` for size and color. Selected controls fill their icons through the theme; don't pass `fill={selected}`. An icon-only control needs an `aria-label`.
8. **Use only documented props.** If a prop you need doesn't exist, say so rather than passing something undocumented.

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
| `src/icons.tsx` | The `Icon` component and the icon names it accepts. |
| `src/api` | API types, the mock adapter, `AsyncState` and the query hooks. |
| `src/fixtures/data` | The sample portfolio the mock API serves. |
| `docs/` | Guides, which also appear in Storybook. |
