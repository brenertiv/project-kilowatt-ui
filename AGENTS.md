# Kilowatt UI: instructions for coding agents

Kilowatt is Enertiv's design system. Its Storybook is the reference for every component, token and rule. Read it before you write UI.

## Look things up before writing UI

- **Storybook MCP** (`kilowatt-storybook` in `.mcp.json`) is live while `npm run storybook` runs, at `http://localhost:6006/mcp`.
  - `docs-list` lists every component and guide.
  - `docs-show` gives one component's description, import line, props, guidance and story snippets.
  - `docs-show-story` gives one story's snippet.
  - `test-run` runs the story tests.
- **Published Storybook:** https://brenertiv.github.io/project-kilowatt-ui/. A remote MCP server for it lives in `mcp/` (see `mcp/README.md`).
- **Without MCP**, read the static files from the published site, or from a local build (`npm run build-storybook`, then `storybook-static/`):
  - `llms.txt`, the index.
  - `components/<id>.md` and `guides/<slug>.md`, one page each.
  - `manifests/components.json`.
- **Rules** are in `docs/design-system-rules.md`. They are binding.

## Rules that matter most

1. **Import, don't rebuild.** If a documented component does the job, import it with the line its docs give, e.g. `import { StatCard } from 'src/components/data';`. Don't copy its markup or restyle it.
2. **Use only documented props.** Check the props table. If a prop you need doesn't exist, say so rather than passing something undocumented.
3. **Use tokens only.**
   - Color, type, space, radius and shadow come from the CSS variables on the Foundations pages (`var(--text-secondary)`, `var(--space-3)`) or from the Material UI theme.
   - Never use a hex value, a pixel radius or a font family of your own.
   - Never pass colors to charts: series colors come from series ids.
4. **Cover every state.**
   - Data components take an `AsyncState`: `loading`, `fetching`, `empty`, `error` or `ready`. Derive it from a query with `fromQuery`.
   - Render states through `DataState`, `EmptyState` and `ErrorState`, never a hand-rolled spinner.
5. **Copy goes through i18n.** User-facing strings live in `src/i18n/en.json`, read with `useTranslation()`.
6. **Icons.** Icons come from `src/icons`, by component name. An icon-only control needs an `aria-label`.
7. **Charts.** Chart kinds render inside `<ChartFrame>`.

## When you change the system

- **New or changed components.**
  - Give the component JSDoc: a description, `@summary`, `@import`, and a line for every prop with its default.
  - Add or update `Name.stories.tsx` beside it, with one story per state and a JSDoc line on each story.
  - See `docs/stories.md`.
- **Story files** import with `src/...` paths, never relative ones.
- **Checks before you finish:**
  - `npm run lint`
  - `npx tsc --noEmit -p .storybook`
  - `npm test` (unit tests, plus every story rendered in Chromium with an accessibility check)
  - `npm run build-storybook` (builds the site, writes `llms.txt`, and fails if a component is missing docs)
- **Tokens.** The Figma file owns primitives and semantic colors (`docs/figma.md`). Don't edit `src/figma/variables.json` by hand.

## Layout of the repository

| Path | What it holds |
| --- | --- |
| `src/components/data` | Data components on Material UI, exported from the barrel. |
| `src/components` | `DataTable`, table cells, `CardMenu`. |
| `src/charts` | `ChartFrame` and the chart kinds (amCharts 5). |
| `src/pages` | Page views composed from the above. |
| `src/tokens.ts`, `src/primitives.ts` | Tokens, built from the Figma snapshot. |
| `src/api` | API types, the mock adapter, `AsyncState` and the query hooks. |
| `src/fixtures` | Sample data for stories and tests. |
| `docs/` | Guides, which also appear in Storybook. |
