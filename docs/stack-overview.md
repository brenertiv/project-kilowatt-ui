# Stack Overview

Kilowatt UI is Enertiv's design system and component library: a Storybook that documents the foundations, guides and every component and page. Storybook is the only thing it builds and ships.

## Runtime

| Layer                | Choice                                                       | Notes                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language             | TypeScript 5.9, strict                                       | `tsc` runs as part of every build                                                                                                                                                                                                                                          |
| UI                   | React 19                                                     | Function components and hooks throughout                                                                                                                                                                                                                                   |
| Components           | Material UI (`@mui/material`) and Base UI (`@base-ui/react`) | Material UI for data display and page composition, themed from the tokens through `src/mui/theme.ts`. Base UI for the unstyled primitives already built on it: menu, dialog, select, combobox, tabs, switch, slider, toast, tooltip. Styling outside Material is plain CSS |
| Routing              | React Router 8                                               | Used by components for links and URL state                                                                                                                                                                                                                                 |
| Data fetching        | TanStack Query 5 with Axios                                  | Entity types, cursor-paged envelopes and query hooks mirror the Enertiv API in `src/api`. Everything runs against an in-process mock adapter with latency and a failure switch until the backend is attached. See `docs/data-layer.md`                                     |
| Tables               | TanStack Table 9 with TanStack Virtual 3                     | Sorting, filtering, pagination, column visibility, pinning, resizing, selection, expansion, server mode and virtualization behind one `DataTable`                                                                                                                          |
| Charts               | amCharts 5                                                   | Wrapped by a token-driven theme, a root hook and a shared frame; chart code never sets colors or fonts directly                                                                                                                                                            |
| Maps                 | Leaflet with react-leaflet                                   | Portfolio map demo                                                                                                                                                                                                                                                         |
| Dashboard layout     | react-grid-layout 2                                          | Draggable widget grid                                                                                                                                                                                                                                                      |
| Drag and drop        | @hello-pangea/dnd                                            | Queue reordering                                                                                                                                                                                                                                                           |
| Internationalization | i18next with react-i18next                                   | All UI copy lives in `src/i18n/en.json`                                                                                                                                                                                                                                    |
| Dates and numbers    | date-fns, date-fns-tz, `Intl`                                | One formatting module shared by charts, tables and metric cards                                                                                                                                                                                                            |

## Design system

- **Tokens** live in `src/tokens.ts`, mirrored from the Figma file _Enertiv UI Foundations_. Two editable layers, primitive and semantic, plus derived variables. Every token has light and dark values. The build publishes them as CSS, JSON, Markdown and DTCG files.
- **Styling** is plain CSS with custom properties and no utility framework. One stylesheet for the system plus a co-located stylesheet for the data table. Material UI is the one CSS-in-JS surface, and it only ever reads the tokens through the theme bridge.
- **Typography** uses Roboto, Roboto Serif and Roboto Mono from Google Fonts with an eight-step scale and fluid variants for page hierarchy.
- **Icons** are Material Symbols Outlined, Google's variable icon font, wrapped once in `src/icons.tsx`. The only SVG asset is the brand mark.
- **Chart colors** are an eight-slot categorical palette validated for colorblind-safe separation on both surfaces, with sequential and diverging ramps derived in OKLCH.
- **Motion** is CSS transitions at 150ms on one curve, with reduced-motion guards.

## Storybook

Storybook 10 (`@storybook/react-vite`) documents every component, primitive recipe, pattern and page. `Name.stories.tsx` files sit beside components, one story per state, with args for every prop. `.storybook/preview.tsx` supplies the app's provider stack, a router, a fresh query client per story and a light/dark toolbar. Stories set `parameters.mockApi` to fail or slow the mock API.

The component manifest and `@storybook/addon-mcp` let coding agents query components, props and story snippets. `@storybook/addon-a11y` and `@storybook/addon-vitest` render every story in Chromium with an axe check. `@storybook/addon-designs` shows a component's Figma node. See `docs/stories.md`.

## Tooling

| Concern              | Tool                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build and dev server | Vite 7 with `@vitejs/plugin-react`, `vite-plugin-checker` for in-editor type errors, `vite-plugin-svgr` for the brand mark                                                                             |
| Tests                | Vitest 5 in two projects. `unit` runs in jsdom with Testing Library and covers tokens, theme persistence, color math, chart data adapters, CSV export, table URL state, the docs registry, the mock API and the sample data. `storybook` renders every story in Chromium through Playwright, with an axe check |
| Lint and format      | ESLint 10 with typescript-eslint and the React Hooks plugin, Prettier 3                                                                                                                                |
| Bundle analysis      | rollup-plugin-visualizer                                                                                                                                                                               |
| Node                 | 24 or newer                                                                                                                                                                                            |

Scripts: `npm run storybook`, `npm run build-storybook`, `npm run docs:build`, `npm test` (with `test:unit` and `test:stories`), `npm run lint`, `npm run format`.

## Deployment

- **Storybook.** Vercel builds Storybook (`npm run build-storybook`, configured in `vercel.json`) on every push and serves `storybook-static/` publicly. That build includes the generated docs, `llms.txt` and the docs coverage check.
- **Remote MCP.** `api/mcp.ts` is a Vercel Function at `/mcp` that serves the docs tools from the manifests of the same build. See `docs/publishing.md`.
- **CI.** `.github/workflows/ci.yml` runs lint, the type-check, the unit and story tests and both builds on every pull request.

## Documentation

- `README.md` for setup and the layer map.
- `docs/design-system-rules.md` for the rules of using the system.
- `docs/stories.md` for story conventions.
- `docs/storybook-plan.md` for the Storybook migration and the agent-facing setup.
- `docs/data-layer.md` for the API shapes, mock adapter and async state.
- Storybook's **Guides** are built from `docs/`, and its **Foundations** pages are built from the token tables, with the live token values embedded.
