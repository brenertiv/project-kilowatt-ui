# Stack Overview

Kilowatt UI is Enertiv's design system and component library: a React single-page app that documents the tokens, hosts a gallery of every component, and provides a workbench for exercising components in isolation. It deploys as a static site.

## Runtime

| Layer                | Choice                                                       | Notes                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language             | TypeScript 5.9, strict                                       | `tsc` runs as part of every build                                                                                                                                                                                                                                          |
| UI                   | React 19                                                     | Function components and hooks throughout                                                                                                                                                                                                                                   |
| Components           | Material UI (`@mui/material`) and Base UI (`@base-ui/react`) | Material UI for data display and page composition, themed from the tokens through `src/mui/theme.ts`. Base UI for the unstyled primitives already built on it: menu, dialog, select, combobox, tabs, switch, slider, toast, tooltip. Styling outside Material is plain CSS |
| Routing              | React Router 8                                               | Pages: Components, System, Docs, Workbench                                                                                                                                                                                                                                 |
| Data fetching        | TanStack Query 5 with Axios                                  | Demos run against an in-process mock adapter, including a paged `/meters` endpoint with latency                                                                                                                                                                            |
| Tables               | TanStack Table 9 with TanStack Virtual 3                     | Sorting, filtering, pagination, column visibility, pinning, resizing, selection, expansion, server mode and virtualization behind one `DataTable`                                                                                                                          |
| Charts               | amCharts 5                                                   | Wrapped by a token-driven theme, a root hook and a shared frame; chart code never sets colors or fonts directly                                                                                                                                                            |
| Maps                 | Leaflet with react-leaflet                                   | Portfolio map demo                                                                                                                                                                                                                                                         |
| Dashboard layout     | react-grid-layout 2                                          | Draggable widget grid                                                                                                                                                                                                                                                      |
| Drag and drop        | @hello-pangea/dnd                                            | Queue reordering                                                                                                                                                                                                                                                           |
| Product tours        | driver.js                                                    | Guided walkthrough demo                                                                                                                                                                                                                                                    |
| Internationalization | i18next with react-i18next                                   | All UI copy lives in `src/i18n/en.json`                                                                                                                                                                                                                                    |
| Dates and numbers    | date-fns, date-fns-tz, `Intl`                                | One formatting module shared by charts, tables and metric cards                                                                                                                                                                                                            |
| Markdown             | react-markdown with remark-gfm                               | Renders the `docs/` folder inside the app                                                                                                                                                                                                                                  |

## Design system

- **Tokens** live in `src/tokens.ts`, mirrored from the Figma file _Enertiv UI Foundations_. Two editable layers, primitive and semantic, plus derived variables. Every token has light and dark values and is editable in the in-app Theme editor, which persists to local storage and can export CSS, JSON and Markdown.
- **Styling** is plain CSS with custom properties and no utility framework. One stylesheet for the system plus a co-located stylesheet for the data table. Material UI is the one CSS-in-JS surface, and it only ever reads the tokens through the theme bridge.
- **Typography** uses Roboto, Roboto Serif and Roboto Mono from Google Fonts with an eight-step scale and fluid variants for page hierarchy.
- **Icons** are Material Symbols Outlined, Google's variable icon font, wrapped once in `src/icons.tsx`. The only SVG asset is the brand mark.
- **Chart colors** are an eight-slot categorical palette validated for colorblind-safe separation on both surfaces, with sequential and diverging ramps derived in OKLCH.
- **Motion** is CSS transitions at 150ms on one curve, with reduced-motion guards.

## Developer workbench

`/workbench` renders one component at a time with a control panel, following React Cosmos conventions: `Name.fixture.tsx` files beside components, `useFixtureInput` and `useFixtureSelect` hooks for state, directory-scoped decorators, a viewport wrapper, and URLs that capture the fixture and its inputs. Sample data in `src/workbench/sampleData.ts` reaches every component state.

## Tooling

| Concern              | Tool                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build and dev server | Vite 7 with `@vitejs/plugin-react`, `vite-plugin-checker` for in-editor type errors, `vite-plugin-svgr` for the brand mark                                                         |
| Tests                | Vitest 5 with jsdom and Testing Library. Unit tests cover tokens, theme persistence, color math, chart data adapters, CSV export, table URL state, docs registry and the workbench |
| Lint and format      | ESLint 10 with typescript-eslint and the React Hooks plugin, Prettier 3                                                                                                            |
| Bundle analysis      | rollup-plugin-visualizer                                                                                                                                                           |
| Node                 | 24 or newer                                                                                                                                                                        |

Scripts: `npm run dev`, `npm run build`, `npm test`, `npm run lint`, `npm run format`.

## Deployment

A GitHub Actions workflow builds on every push to `main` and publishes `dist/` to GitHub Pages, with a single-page-app fallback so deep links resolve.

## Documentation

- `README.md` for setup and the layer map.
- `docs/design-system-rules.md` for the rules of using the system.
- `docs/workbench.md` for fixture conventions.
- The **System** page in the app renders the live token values, contrast measurements, type roles, spacing, shape and the icon catalog, and the **Docs** page renders everything in `docs/`.
