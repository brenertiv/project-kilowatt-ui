# Stack Overview

Kilowatt UI is Enertiv's design system: a Storybook that documents stock Material UI, the short list of places Kilowatt departs from it, and the guides. Storybook is the only thing it builds and ships.

## Runtime

| Layer                | Choice                        | Notes                                                                                                                                                        |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Language             | TypeScript 5.9, strict        | `tsc` runs as part of every build                                                                                                                            |
| UI                   | React 19                      | Function components and hooks throughout                                                                                                                     |
| Components           | Material UI (`@mui/material`) | Stock MUI with light and dark color schemes, plus the departures in `src/mui/departures.ts`                                                                  |
| Icons                | Material Symbols Outlined     | Google's variable icon font, through MUI's `Icon` and the `Icon` component in `src/icons.tsx`                                                                |
| Data fetching        | TanStack Query 5 with Axios   | Entity types and query hooks mirror the Enertiv API in `src/api`, against an in-process mock adapter until the backend is attached. See `docs/data-layer.md` |
| Internationalization | i18next with react-i18next    | Set up in `src/i18n`, with no strings yet                                                                                                                    |
| Dates                | date-fns 4                    | Parsing, formatting and date math. Use it rather than Moment.js or hand-rolled `Date` arithmetic; it's also an adapter MUI X date pickers support            |

## Storybook

Storybook 10 (`@storybook/react-vite`). `.storybook/preview.tsx` supplies the provider stack (MUI theme and CssBaseline, a fresh query client per story) and a light/dark toolbar that drives MUI's color scheme. Stories set `parameters.mockApi` to fail or slow the mock API.

The component manifest and `@storybook/addon-mcp` let coding agents query components, props and story snippets. `@storybook/addon-a11y` and `@storybook/addon-vitest` render every story in Chromium with an axe check. See `docs/stories.md`.

## Tooling

| Concern              | Tool                                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build and dev server | Vite 7 with `@vitejs/plugin-react`                                                                                                                                                                                                                                                  |
| Tests                | Vitest 5 in two projects. `unit` covers the theme departures and their contrast, the token tiers, the Foundations tables, the component page format, the icons, the mock API and the sample data. `storybook` renders every story in Chromium through Playwright, with an axe check |
| Lint and format      | ESLint 10 with typescript-eslint and the React Hooks plugin, Prettier 3                                                                                                                                                                                                             |
| Node                 | 24 or newer                                                                                                                                                                                                                                                                         |

Scripts: `npm run storybook`, `npm run build-storybook`, `npm run docs:build`, `npm test` (with `test:unit` and `test:stories`), `npm run lint`, `npm run format`.

## Deployment

- **Storybook.** Vercel builds Storybook (`npm run build-storybook`, configured in `vercel.json`) on every push and serves `storybook-static/` publicly. That build includes the generated docs, `llms.txt` and the docs coverage check.
- **Remote MCP.** `api/mcp.ts` is a Vercel Function at `/mcp` that serves the docs tools from the manifests of the same build. See `docs/publishing.md`.
- **CI.** `.github/workflows/ci.yml` runs lint, the type-check, the unit and story tests and both builds on every pull request.

## Documentation

- `README.md` for setup and the layer map.
- `docs/design-system-rules.md` for the rules of using the system.
- `docs/stories.md` for story conventions.
- `docs/data-layer.md` for the API shapes, mock adapter and async state.
- Storybook's **Guides** are built from `docs/`. The Foundations pages are generated from the running theme (`src/mui/foundations.ts`) with live specimens (`src/mui/Specimens.stories.tsx`), MUI departures from `src/mui/departures.ts`, and Icons from `src/icons.tsx`.
