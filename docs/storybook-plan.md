# Storybook Migration Plan

Status: accepted 2026-10-15 with the recommended decisions D1–D6. Phases 0 to 3 are done. D4 assumes a public site, like the current GitHub Pages one.

This plan removes React Cosmos and the in-app workbench. It moves every component, fixture and doc into one standalone Storybook, published from this repo. The published Storybook is the place we point coding agents to learn how to build with Kilowatt, so the plan treats agents as primary readers alongside people.

## 1. What others are doing

As of October 2026, design systems take one of three approaches to agents. The strongest systems combine all three.

| Approach | Who | What it is |
|---|---|---|
| **MCP server** (on-demand, queryable) | GitHub Primer (`@primer/mcp`), Atlassian (`@atlaskit/ads-mcp`), IBM Carbon (remote MCP), MUI (`@mui/mcp`), Chakra, shadcn, Shopify, zeroheight | The agent asks for one component's docs, props, examples or guidelines when it needs them. Primer exposes about 19 tools covering components, examples, usage, a11y, patterns, tokens and a CSS linter. |
| **Static machine-readable files** | Storybook, MUI, Chakra, Atlassian, Carbon, Cloudscape, Nord | These systems publish `llms.txt` (a small index), sometimes `llms-full.txt`, and per-page Markdown, for example by appending `.md` to a docs URL. Component APIs and tokens are published as JSON. |
| **Rules plus lint** | Atlassian `DESIGN.md`, Primer `lint_css`, Figma `create_design_system_rules` | Short binding rules in the repo, enforced by lint rules that cost no tokens. |

What Storybook ships for this, at `storybook` 10.6.2 (published 2026-10-12). The whole AI surface is marked **preview**.

- **Component manifests.** `features.componentsManifest` emits two files, in the dev server and in the static build:
  - `/manifests/components.json` holds, per component: id, import path, description, JSDoc tags, stories with code snippets, and props (type, required, default, description).
  - `/manifests/docs.json` is built from MDX.
  - You curate both with the `!manifest` tag.
- **`@storybook/addon-mcp`** puts an MCP endpoint at `localhost:6006/mcp`. It has three toolsets:
  - `docs`: `docs-list`, `docs-show`, `docs-show-story`.
  - `dev`: story instructions, story previews, find stories by component, changed stories.
  - `test`: `test-run`, which goes through `@storybook/addon-vitest`.
- **`@storybook/mcp`** provides `createStorybookMcpHandler`, a Fetch-style handler that serves the docs toolset from a *published* build's manifests. A static host alone cannot serve MCP, so this handler is how a self-hosted Storybook gets a remote MCP endpoint.
- **Chromatic** hosts the MCP endpoint automatically for each build, with OAuth for private projects. This is the hosted alternative to self-hosting.

What the evidence says:

- Storybook's benchmark (Storybook MCP for React, 2026) reports better component usage and fewer tokens when agents query the manifest instead of reading source.
- Atlassian tested a single large `DESIGN.md` against MCP. The `DESIGN.md` run used almost twice the tokens. It also caused agents to rebuild components instead of importing them.

The conclusion: use small, retrievable units over one big file, and enforce rules with lint rather than prose.

Sources: storybook.js.org/docs/ai, storybook.js.org/docs/ai/manifests, storybook.js.org/blog/storybook-mcp-for-react, storybook.js.org/blog/storybook-10-6, chromatic.com/docs/mcp, primer.style/product/getting-started/foundations/mcp, the Atlassian DESIGN.md write-up, carbondesignsystem.com/developing/carbon-mcp, mui.com/material-ui/getting-started/mcp, designtokens.org/tr/2025.10.

## 2. Best practices for an agent-facing, self-published Storybook

**Content**

1. **Write one concept per story.** Name each story for the situation it covers ("Empty", "Loading", "With pagination"), never for a grab bag ("All variants"). Give each story a JSDoc line saying *when* to use it. Agents see a story's `@summary`, or only the first 60 characters of its description.
2. **Put JSDoc on every component and every prop.** Each component needs a description with an `@summary` line. Each prop says what it does, gives the default, and says when to use it. This is the main input to `components.json`.
3. **Make stories real usage.** A story's snippet is what the agent copies. Stories must import from the public path and pass args. They must not call internal helpers or fixture-only hooks.
4. **Write each story's state in its args, not in hooks.** Cosmos-style `useFixtureInput` hooks inside a render function are invisible to the manifest and to snippets. Args show up in both.
5. **Separate guidance from the API.** For each component, give usage (when to use it and when not to), do and don't, accessibility, and composition, each as its own MDX section or page. Agents fetch these separately.
6. **Write foundations as literal values.** The docs manifest comes from static analysis of MDX, so a token table rendered from a JS array at runtime is invisible to agents. Generate the token pages as literal MDX or Markdown at build time from `buildSystemSnapshot`.
7. **Curate.** Tag playgrounds, anti-pattern demos, third-party demos (leaflet, dnd, driver.js) and internal showcases `!manifest`. Too much context hurts agents as much as too little.
8. **Keep names stable.** Story ids become the public API that agents and the Figma map reference. Set explicit `title`s and treat renames as breaking changes.

**Delivery**

9. **Publish in three layers.** Each layer works when the one above it is unavailable.
   - The static site with `index.json` and `manifests/*.json`.
   - A generated `llms.txt` with per-component `.md` files, for agents that can only fetch URLs.
   - An MCP endpoint, for agents that support MCP.
10. **Give the agent its instructions in the repo** in `AGENTS.md` and `CLAUDE.md`. Tell it where the Storybook and MCP live, to check documented props before using them, to import rather than rebuild, and to use tokens only. Point it to `docs/design-system-rules.md`.
11. **Enforce rules with lint and tests, not prose.** We already have the token and Figma tests. Add three CI gates:
    - Every exported component has a story file.
    - Every story-backed component has a description and prop docs, checked against `components.json`.
    - Every story passes axe.
12. **Make the build deterministic.** Use fixed data and fixed chart sizes, and disable animations, so visual tests and agent previews are stable.

## 3. Where we are today

The full survey of the repo found these facts:

- **Stack:** React 19.1, Vite 7.1, TS 5.9 strict, MUI 9.5 plus Base UI 1.8, amCharts 5, TanStack Query/Table/Virtual, react-router 8, i18next, Vitest 5. Node ≥24. The project is not an npm library (`private`, no exports).
- **Cosmos usage:**
  - Config and dependencies: `react-cosmos` and `react-cosmos-plugin-vite`, `cosmos.config.json`, `src/cosmos.globals.ts`, `src/cosmos.decorator.tsx` and `src/pages/cosmos.decorator.tsx`.
  - The `react-cosmos/client` alias in `vite.config.ts` and `tsconfig.json`.
  - The workbench: `src/workbench/*` and `src/fixtures/client.tsx`.
  - The `.cosmos-*` styles in `src/styles.css`.
  - `.claude/launch.json` and the docs (`cosmos.md`, `workbench.md`, `stack-overview.md`, README).
- **25 fixture files:**
  - Real components: DataTable, CardMenu, cells, DataState, DateText, EntityCard, EntityList, ListControls, PageHeader, RelationLink, StatCard, StatusChip, ChartFrame (all chart kinds) and MaterialBridge.
  - Pages: PortfolioOverview, BuildingDetail and WorkOrders.
  - Showcases with no component behind them: Button, Field, Controls, Forms, Overlays, Structure, Treemap and Widgets.
- **No fixture:** EmptyState, ErrorState, EntityName, Skeletons, TableStates, CursorPagination and FilterBar (the last two are covered only through the ListControls composite).
- **Props:** local `type XProps` aliases, mostly not exported. JSDoc is good on DataTable, StatCard and the charts, and thin elsewhere. No component has an `@summary`.
- **Docs today:**
  - The `/design-system` page renders foundations from `tokens.ts` at runtime, with a CSS/JSON/Markdown export in `export.ts`.
  - The `/docs/:slug` page renders `docs/*.md`.
  - The Figma registry `src/figma/links.json` is keyed by workbench slug and edited through a dev-server `PUT /__figma/links`.
  - The new token sync uses `variables.json`, `snapshot.ts`, `push.ts` and `SyncPanel`.
- **Agent files:** none committed. There is no `AGENTS.md`, `CLAUDE.md` or `llms.txt`, and `.cursor/` is gitignored.
- **Deploy:** `.github/workflows/pages.yml` publishes the SPA to GitHub Pages at `/project-kilowatt-ui/`.

## 4. Decisions to make before starting

Each decision has a recommendation in bold.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | What happens to the app (`App.tsx`, workbench, `/design-system`, `/docs`) | Keep the SPA and add Storybook beside it; or Storybook replaces it | **Storybook replaces it.** Move foundations, docs and the theme editor into Storybook. Keep `vite dev` only as a dev sandbox for pages, or drop it. |
| D2 | Where the Storybook is published | GitHub Pages; Chromatic; both | **GitHub Pages at `/project-kilowatt-ui/`**, replacing the SPA. Add Chromatic later for visual tests and hosted MCP if we want OAuth-gated access. |
| D3 | How agents reach it remotely | Static files only; self-hosted `@storybook/mcp` (for example a Cloudflare Worker reading the Pages manifests); Chromatic MCP | **Phase 1: static files plus `llms.txt`.** **Phase 2: self-hosted `@storybook/mcp`** on a small serverless function, which keeps it self-published. Locally, everyone gets `@storybook/addon-mcp`. |
| D4 | Public or private | The current Pages site is public | Confirm. If the system must be private, GitHub Pages won't work. Use Chromatic (OAuth), or a host with an auth gate plus a token check in the MCP handler. |
| D5 | Where Figma links live | Keep `links.json`; or move to `parameters.design` in each story's meta | **`parameters.design` in the meta** (`@storybook/addon-designs`). This keeps the link next to the component, where agents can see it. Keep the file-level URL in `links.json`, and re-point `links.test.ts` at the story files. |
| D6 | Story format | CSF3; CSF Next (factories, preview in 10.x, default in 11) | **CSF3** now. It is stable, and the codemod to CSF Next exists when 11 ships. |

## 5. Implementation plan

Before starting, commit the current uncommitted work (the token and Figma sync changes and the untracked `figma/`, `scripts/` and `src/figma/*`) on its own. That keeps the migration diff clean.

### Phase 0: Install and boot (about 1 day)

1. Install the dependencies: `npm create storybook@latest`, or add `storybook`, `@storybook/react-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-vitest`, `@storybook/addon-mcp` and `@storybook/addon-designs`, all pinned to 10.6.x. Then check that `@storybook/addon-vitest` supports Vitest 5. If it does not, run the story tests in their own Vitest project.
2. `.storybook/main.ts`:
   - `stories: ['../src/**/*.mdx', '../src/**/*.stories.tsx', '../docs/**/*.mdx']`.
   - `features: { componentsManifest: true }`.
   - `typescript.reactDocgen: 'react-docgen'`. In 10.6.2, the component's `@import` JSDoc tag only reaches the manifest's import line under this engine. Under `react-docgen-typescript` the tag is stripped before the override reads it. It also resolves our imported unions, and it skips MUI's and Base UI's inherited props.
   - `viteFinal`:
     - Remove `vite-plugin-checker`, `rollup-plugin-visualizer`, the `/__figma/links` middleware and the `react-cosmos/client` alias.
     - Keep `svgr`.
     - Set `base` from `GITHUB_PAGES`.
3. `.storybook/preview-head.html`: move the Google Fonts and Material Symbols `<link>` tags from `index.html`. Without them, icons render as ligature text.
4. `.storybook/preview.tsx`:
   - Side-effect imports: `../src/i18n`, `../src/styles.css`, and `installBreakpointStyles()`.
   - A global decorator built from `AppProviders`, `MemoryRouter` and `ToastOutlet`. This is the Cosmos branch of `src/cosmos.decorator.tsx`, lifted out.
   - A fresh `QueryClient` per story, in place of the module singleton, so query cache never leaks between stories.
   - A `scheme` toolbar global (light/dark). A decorator calls `setColorScheme` from it, which replaces `SchemeControl`. Do not use `withThemeFromJSXProvider`: our theme is CSS variables on `<html>` built by `ThemeProvider` and `MuiProvider`, not swapped MUI theme objects.
   - Clear the `kilowatt-theme` localStorage key at boot so editor overrides don't leak into docs or visual tests.
   - `parameters.viewport` presets that match the old `Viewport` presets (Phone, Tablet, Laptop).
   - A `layout` decorator that replaces `.cosmos-stage` and the workbench stage rules, with a `fullscreen` layout for pages.
5. CSS: scope `html, body, #root { height: 100%; overflow: hidden }` to the app shell (for example a `.app-root` class). Otherwise it clips `#storybook-root` and the docs pages.
6. Add `storybook` and `build-storybook` scripts and a `.claude/launch.json` entry on port 6006. Leave Cosmos in place until Phase 2 so the two can be compared.

Done when: `npm run storybook` boots, one converted story (StatCard) renders in both schemes, and `/manifests/components.json` lists it.

### Phase 1: Convert the fixtures to stories (about 3–4 days)

The rules for converting one file:

- A file `X.fixture.tsx` becomes `X.stories.tsx` next to the component. The meta has `title`, `component` and `tags: ['autodocs']`, and each named fixture becomes a named story.
- `useFixtureInput(name, v)` becomes an `args` entry. `useFixtureSelect(name, {options})` becomes `argTypes` with `control: 'select'`. Remove all fixture hooks from render functions.
- Sample data comes from `src/fixtures/data`, which stays as-is. Rename it to `src/stories/data` later if wanted.
- The page decorator's `fail requests` and `latency ms` inputs become globals or args on the pages' meta. A decorator applies them to `mockControls` and `setMockFailure` and resets the story's query client.

Titles. These are the sidebar structure and the ids agents will see.

| Title | Files |
|---|---|
| `Foundations/*` | MDX pages, see Phase 3 |
| `Primitives/Button`, `Primitives/Field`, `Primitives/Controls`, `Primitives/Forms`, `Primitives/Overlays`, `Primitives/Structure` | the Base UI showcases. These have no component file, so they become MDX docs pages with stories that show the class recipes. |
| `Data/DataState`, `Data/StatCard`, `Data/StatusChip`, `Data/EntityCard`, `Data/EntityList`, `Data/PageHeader`, `Data/RelationLink`, `Data/DateText`, `Data/FilterBar`, `Data/CursorPagination`, `Data/EmptyState`, `Data/ErrorState`, `Data/EntityName`, `Data/Skeletons` | `src/components/data/*`. Split `ListControls` into its parts, then add one composite "List page" story under `Patterns`. Add the components that have no fixture. |
| `Table/DataTable`, `Table/Cells`, `Table/States` | DataTable, cells, TableStates |
| `Charts/ChartFrame`, `Charts/TimeSeries`, `Charts/CategoryBar`, `Charts/Donut`, `Charts/Heatmap`, `Charts/Legend` | Split `ChartFrame.fixture.tsx` into one story file per chart kind. Each meta has a `ChartFrame` decorator (charts throw outside it) and a fixed-height container. |
| `Menus/CardMenu` | CardMenu |
| `Patterns/*` | composite recipes such as list page, filtered table and dashboard card grid |
| `Pages/PortfolioOverview`, `Pages/BuildingDetail`, `Pages/WorkOrders` | the pages, at `layout: 'fullscreen'` |
| `Internal/MaterialBridge`, `Internal/Treemap`, `Internal/Widgets` | tagged `!manifest`. Drop the driver.js tour story, because its targets (`data-tour`) don't exist in Storybook. |

Each component's stories cover its states (default, loading, empty, error, long or overflowing content, dense data) as separate stories, with a JSDoc line on each.

Done when: every fixture has a story counterpart, `vitest --project storybook` passes (smoke render plus a11y), and `components.json` lists every exported component.

### Phase 2: Remove Cosmos and the workbench (about half a day)

- Delete:
  - `cosmos.config.json`, `src/cosmos.globals.ts` and both `cosmos.decorator.tsx` files.
  - `src/fixtures/client.tsx`, all `*.fixture.tsx` files and `src/workbench/*`.
  - The `.cosmos-*` and `.workbench-*` CSS.
  - The `react-cosmos*` dependencies and the `cosmos` and `cosmos:export` scripts.
  - The `react-cosmos/client` alias in `vite.config.ts` and `tsconfig.json`.
  - The cosmos entry in `.claude/launch.json` and `docs/cosmos.md`.
- Remove the `/components` route from `App.tsx`. Done: the app now opens on `/design-system`, and its nav links to Storybook (`VITE_STORYBOOK_URL`, or the local one in dev). `/design-system` and `/docs` stay until Phase 3 recreates them in Storybook. Removing them sooner would leave the foundations and guides with no home.
- Figma: move each `links.json` component entry into its story meta as `parameters.design`. Done. The registry had no component entries, so nothing moved. `links.json` holds only the file link and refuses component entries. `figmaDesign(url)` in `src/stories/figma.ts` validates a node link when the story file loads. `links.test.ts` covers both. The product-tour demo and driver.js are also gone, because their targets were the workbench drawer.
- `grep -ri cosmos` and `grep -ri workbench` both return nothing outside the changelog.

### Phase 3: Docs and foundations in Storybook (about 2–3 days)

- **Foundations.** Add a build step, `scripts/build-foundations.mjs`, that calls `buildSystemSnapshot` and writes literal MDX:
  - `Foundations/Color`: roles, light and dark values, and the contrast table.
  - `Foundations/Typography`, `Foundations/Space`, `Foundations/Shape`, `Foundations/Layout` and `Foundations/Icons`.

  Literal values are required because the docs manifest is static. The live, interactive versions of the current `sections.tsx` (swatches, click-to-copy icons) can be embedded as stories on the same pages.
- **Token downloads.** Publish the existing `kilowatt-tokens.css`, `kilowatt-design-system.json` and `.md` as static files in the build. Add a DTCG 2025.10 JSON export (`tokens.json`) so token tools and agents can consume the tokens in a standard format.
- **Guides.** Convert `docs/*.md` to MDX under `Guides/`:
  - `design-system-rules` becomes "Rules", pinned first.
  - Also convert `data-layer`, `typography`, `figma` and `stack-overview`.
  - Rewrite `workbench.md` as "Writing stories".

  Give each page a `<Meta title summary>`.
- **Per-component guidance.** Each component gets a short MDX docs page, attached to its stories, in this order:
  1. What it is (one sentence).
  2. When to use it and when not to.
  3. Do and don't.
  4. Accessibility.
  5. Composition, which links the related components.
  6. Props (`<ArgTypes>`).

  Start with the ten most-used: DataTable, StatCard, StatusChip, DataState, EntityCard, EntityList, PageHeader, FilterBar, ChartFrame and TimeSeriesChart.
- **JSDoc pass.**
  - Give every component an `@summary` plus a description, and an `@import` tag giving the line agents should copy, e.g. `@import import { StatCard } from 'src/components/data';`. Without the tag, the manifest invents an import from the package name `project-kilowatt-ui`, which does not resolve.
  - The manifest's import line also merges in whatever the story file imports (decorator helpers, icons through relative paths). Keep story files' imports minimal and public.
  - Give every prop a doc and its default.
  - Export the prop types (`export type StatCardProps`) so docgen and agents can name them.
  - The generics `DataTable<TData>` and `RelationLink<T>` need explicit prop docs, because docgen output for them is thin.
- **Theme editor.** Rebuild it as a Storybook toolbar addon or panel, or drop it from the published site. Recommendation: drop it for v1, keep ThemeEditor in the dev app, and revisit later.

### Phase 4: The agent layer (about 2 days)

- **`AGENTS.md`** (with `CLAUDE.md` importing it) at the repo root, about 40 lines:
  - Where the Storybook and MCP live, and the import paths.
  - "Look up a component with `docs-list` / `docs-show` before writing UI; never re-implement a documented component."
  - "Use tokens only; see Guides/Rules."
  - "After a UI change, run the story tests."
- **`.mcp.json`**: add the local addon MCP (`http://localhost:6006/mcp`) and, after Phase 5, the remote one.
- **`scripts/build-llms.mjs`** runs after `build-storybook`. It reads `storybook-static/manifests/components.json`, `docs.json` and `index.json`, and writes:
  - `llms.txt`: an index of components and guides with one-line summaries and links.
  - `components/<id>.md`: description, import, props table, story snippets, guidance and the Figma link.
  - `guides/<slug>.md` and `tokens.json`.
- **CI gates (Vitest plus a Node script):**
  - Every component exported from `src/components/**`, `src/charts/**` and `src/components/data/index.ts` has a stories file.
  - Every manifest component has a description and a summary, and ≥90% of its props have descriptions.
  - Every story passes a11y (`parameters.a11y.test: 'error'`).
  - `build-storybook` succeeds.
- **Eval.** Write five or so realistic prompts, for example "build a work-orders list page with a filter bar and pagination". Run them against the published Storybook with and without MCP, then check that the generated code imports our components and uses tokens. Re-run the eval whenever the docs change substantially.

### Phase 5: Publish (about 1 day)

- In `pages.yml`, replace `npm run build` with `npm run build-storybook && node scripts/build-llms.mjs`, deploy `storybook-static/`, and keep `.nojekyll`. Drop the SPA `404.html` trick, which Storybook doesn't need.
- Add CI on PRs: lint, unit tests, Storybook tests and the docs gates. Optionally add Chromatic for visual review.
- Remote MCP (D3, phase 2): a small Worker or Function using `createStorybookMcpHandler`, whose `manifestProvider` fetches `https://brenertiv.github.io/project-kilowatt-ui/manifests/*.json`. It goes behind a token if D4 says private. Add it to `.mcp.json` and AGENTS.md.
- Update the README live-preview link and `docs/stack-overview.md`.

## 6. Risks

- **The Storybook AI surface is preview.** Manifest fields and MCP tool names changed between 10.3 and 10.6. To limit the damage: pin 10.6.x, have the `llms.txt` generator read only the documented fields, and treat upgrades as deliberate tasks.
- **The theme is DOM-global.** A docs page showing several stories at once can't show light and dark side by side. That is acceptable; the scheme toolbar covers it.
- **amCharts** needs a sized container, shows its logo without a license, and animates. Use a fixed height, set animation duration to 0 in the story decorator, and decide on the license separately.
- **Vitest 5 and `@storybook/addon-vitest` compatibility** is unverified. Check it in Phase 0.
- **Figma link editing** moves from a UI field to editing a story file. That is fine for engineers. Designers who used the field would need another path.

## 7. Phase 1 findings

These came out of converting the fixtures. The code-side ones are fixed (2026-10-15); the token contrast pairs stay open until Figma changes.

**Accessibility.** `parameters.a11y.test` is now `'error'` in `.storybook/preview.tsx`: any axe violation fails the story test. `label-content-name-mismatch` stays off globally (`src/stories/a11y.ts`). It is a false positive: axe reads a Material Symbols ligature ("more_horiz") as the button's visible text.

- **`color-contrast` between Figma-owned tokens: open, needs a Figma change.** Each fix is a Figma change followed by a re-snapshot (docs/figma.md). Until then the stories below set `parameters: { a11y: tokenContrast }`, which turns off only `color-contrast`, with a comment naming the pair. When a pair passes, delete the parameter from its stories.

  | Foreground | Background | Ratio | Tokens | Stories |
  |---|---|---|---|---|
  | white | `#0a8864` | 4.45 | text on `successMain` (chips) | StatusChip, EntityList, PageHeader, DataState Ready |
  | `#0a8864` | white or `#edf1f5` | 3.9–4.45 | `successMain` as text | StatCard, cells Delta, MaterialBridge Chips, Widgets Metric Card |
  | `#2ea6e1` | white, `#edf1f5` or `#dcf0fa` | 2.3–2.7 | `secondaryMain` as text, incl. on `secondaryTint` | cells Row Link, Structure Avatar and Scroll area, Foundations Layout, Widgets Queue Reorder |
  | `#fb9c3a` | white or `#edf1f5` | 1.9–2.1 | `warningMain` as text | Widgets Dashboard Grid, MaterialBridge Chips, Foundations Color |
  | `#6598c2` | `#edf1f5` | 2.71 (3:1 needed at 32px) | `textDisabled` on `backgroundDefault`, the EmptyState icon | EmptyState |
  | `#72abdb`, `#8faad8`, `#fb594c`, `#ffb44c` | `#365670` | 2.4–4.4 | dark-mode text and status colors on dark `backgroundPaper`, as drawn by the contrast table | Foundations Color |

  The table first listed here had three more pairs (`#869aa9`, white on `#89a0c7`, white on `#6cb8a2`). They are not tokens: they are `textSecondary`, a chip fill and `successMain` under the refresh dim below.
- **Refresh dim: open, needs a design decision.** `DataState` and `StatCard` keep stale content on screen at 60% opacity while a refetch runs. That takes passing tokens below 4.5:1 (`textSecondary` `#365670` becomes `#869aa9`, 2.91 on white). It is code, not a token, so it is not covered by `tokenContrast`; the four Refreshing stories (DataState, EntityCard, EntityList, StatCard) set `refreshDimContrast` instead until it is decided. WCAG exempts inactive content, but stale numbers are still read. Options: keep the dim and the exemption; dim to 0.9, which barely reads as a cue; or stop dimming text and mark the refresh with a progress bar or the existing `aria-busy` and a small "Updating" label.
- **Markup: fixed.**
  - `EntityName` (and `EntityCard`, which had the same code) put `aria-label` on a plain `span` (`aria-prohibited-attr`). The hint is now a `PlaceholderHint` button named by the hint. It also used `textDisabled` for an active control; it is `textSecondary` now. The same pattern was fixed in `DataState`'s refresh wrapper (a `div`), `StatCard`'s "No value" (a `p`), `EmptyCell` and DataTable's empty value (a `span`), and `HeatScale` (now `role="img"`).
  - `PageHeader`'s loading state rendered an `h1` holding only a skeleton (`empty-heading`). The `h1` now holds hidden "Loading" text and the skeleton is `aria-hidden`.
  - The chart table view's scroll wrapper is a focusable region named "{title} as a table" (`scrollable-region-focusable`).
  - The DataTable search box had no label. It now has hidden label text, "Search {noun}" or `searchLabel`. FilterBar's search field has a visible "Search" label (or `searchLabel`), like Sort and Rows; in both, the placeholder is only a hint.
  - The Widgets demos: leaflet markers get a `title` (`aria-command-name`), the attribution link is underlined (`link-in-text-block`), and the Dashboard Grid panel heads are `div`s rather than repeated `header` landmarks. The Overview Panel kicker's `color-mix` went from 72% to 78%, like the description beside it, to clear 4.5:1.

**Fixed while converting:**
- `chartDemos.tsx` and `stackDemos.tsx` still read the `accent`, `onAccent` and `text` tokens, which the Figma token sync renamed. The treemap and two widget demos threw on render, in the app too. They now read `secondaryMain`, `secondaryContrastText` and `textPrimary`. `ThemeValues` is a string record, so TypeScript can't catch a stale token name. A typed token-id union would.
- The Structure Meter passed a 0–1 value against a 0–100 scale.

**Prop docs are thin on:**
- `ChartFrame`, `ChartLegend` and `HeatScale`.
- The charts' `unit`, `ariaLabel`, `annotations`, `steps` and `centerLabel`.
- `ChipCell`, `LinkCell`, `EmptyCell`, `TableError`, `TableEmptyRow` and `TableSkeleton`.
- The sibling components in `DateText`, `StatusChip`, `Skeletons` and `EntityName`.

The Phase 3 JSDoc pass covers them.

**Hard-coded English:** the `aria-label`s "Breadcrumb" in `PageHeader` and "Pagination" in `CursorPagination`. Fixed in Phase 3. The 2026-10-15 pass moved ChartFrame, DataTable, the cells, the table states and the WorkOrders status filter to i18n too (section 8).

**Test flake:** a fresh Vitest browser run can fail once while Vite re-optimizes dependencies. The error is "Failed to fetch dynamically imported module", "failed to find the current suite", or a null `useState`. The second run passes. Pin `optimizeDeps.include` before the story tests gate CI.

## 8. Phase 3 notes

**How the docs ended up:**
- `docs/*.md` stays the source. `scripts/build-docs.ts` writes it out as MDX under **Guides**, and writes the token tables from `systemToMarkdown` as literal MDX under **Foundations**, with the live System section embedded below each table.
- The same script writes the token downloads: `kilowatt-tokens.css`, the system JSON and Markdown, and the DTCG 2025.10 files `tokens.light.json` and `tokens.dark.json`. DTCG dimensions allow only px and rem, so letter spacing in em travels as a number.
- Output goes to `src/docs/generated/`, which is not committed. The Storybook scripts regenerate it.
- The app's `/docs` page and react-markdown are gone. `/design-system` stays in the app because it holds the Figma sync tools and the Theme editor, which are dev tools rather than documentation.

**Agent-facing manifest:**
- Every component has a description, an `@summary` and an `@import`, and documents every prop.
- Guidance MDX pages cover DataTable, StatCard, StatusChip, DataState, EntityCard, EntityList, PageHeader, FilterBar, ChartFrame, TimeSeriesChart, the six Primitives recipes and Patterns/ListPage.

**Manifest import lines:**
- Story files now import by `src/...` path, through an alias in `vite.config.ts` and `tsconfig.json`, so their imports reach the manifest unchanged.
- Storybook 10.6 still adds a line naming the package `project-kilowatt-ui` for any element passed in `args`, such as `icon: <BuildingIcon />`. That line sits beside the correct `src/icons` line.
- The Primitives have no `meta.component`, so the manifest guesses a component from the title and files their icon imports under the wrong package.
- The Phase 4 `llms.txt` generator should drop `'project-kilowatt-ui'` lines, and take the Primitives' import from their MDX page.

**Bugs the JSDoc pass found.** Fixed 2026-10-15 unless marked open.
- **Charts:**
  - Fixed: HeatmapChart now calls `useChartFrame()`, so it throws outside `ChartFrame` like the others.
  - Fixed: reduced motion. `useChartRoot` builds the chart theme with `reduceMotion`, which zeroes state, interpolation and tooltip durations, and each chart passes `motionDuration(reduceMotion)` to its legend `show`/`hide` calls.
  - Fixed: `TimeSeriesChart`'s `annotations` default is a shared module constant, so re-renders no longer rebuild the root.
  - Fixed: the donut's total, center figure and tooltip percentages count only visible slices and follow the legend.
  - Fixed: the heatmap's min and max are 0 when every value is null, not ±Infinity.
  - Fixed: `CategoryBarChart` value labels, and the horizontal chart's tooltips, format in the series' `unit` (or the chart's).
  - Fixed: `ChartFrame`'s strings, and HeatScale's label, come from `src/i18n/en.json` under `chart.*`.
- **Table:**
  - Open: in server mode, CSV export covers only the current page, though the rules say "every page". Needs an export callback that fetches every page; out of scope for the a11y pass.
  - Fixed: the search input's name no longer comes from `searchPlaceholder`, in DataTable or FilterBar (see section 7).
  - Fixed: the empty row says "No {noun} match these filters." only while a search or filter is set, otherwise "No {noun} to show."
  - Fixed: DataTable's, the cells' and the table states' labels come from `src/i18n/en.json` under `table.*`.
  - Fixed: `ActionsCell` keys menu items by position, so repeated labels don't collide.
  - Fixed: destructive menu items use one hook, `data-destructive` on `ui-item`, in `ActionsCell` and `CardMenu`. The `.is-destructive` rule is gone.
  - Open: server mode needs a row count, which the cursor-paged API never gives.
- **Data:**
  - Fixed: StatCard renders its `state` through `DataState` with `StatSkeleton`. Empty and idle still draw the card with its value or the dash.
  - Fixed: EmptyState shows `data.empty.description` when neither `title` nor `description` is set. A custom title still gets no generic sentence.
  - Fixed: `BuildingDetail` with an unknown id shows a "Building not found" empty state. `isNotFound` in `src/api/state.ts` tells a 404 from other failures.
  - Fixed: the WorkOrders status filter ("Status", "Active", "All statuses") goes through i18n. The page's title and sort labels are still English literals.
- **Primitives:**
  - Fixed: `ui-field-error` sets the error color, and `ui-input` takes an error border and focus ring when `data-invalid` or `aria-invalid`.
  - Fixed: the icon button, input, stepper, toggle and tab mute their text when disabled and stop responding to hover; the switch, checkbox, radio and slider fade to 50%; a disabled field's label dims too. All key off Base UI's `data-disabled` (and `:disabled` for native inputs).
  - Fixed: `ui-btn-ghost` has a transparent border at rest and shows it on hover.
  - Fixed: the demo layout classes are gone. Dialogs end in a `ui-dialog-actions` row, radio groups take `ui-radio-group`, and the Avatar, Separator and cells stories lay out inline.
  - Open: the rules don't say whether a new button outside both Base UI and Material UI surfaces should be `ui-btn` or MUI `Button`.
  - Fixed: the Avatar recipe's photo is a local asset, `src/assets/avatar-photo.svg`.
- **Where guidance pages land:** attached guidance pages are in `/manifests/components.json` under each component's `docs`, not in `/manifests/docs.json`. MCP `docs-show` includes them.
- **Figma:** Fixed: `FigmaLink` no longer puts `aria-label` on a `<p>`; "Linked Figma file" is hidden text before the file name.
- **Fixed during the pass:** the `aria-label`s "Breadcrumb" and "Pagination" now go through i18n.
