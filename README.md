# Kilowatt UI

Enertiv's design system. It starts from stock Material UI, with light and dark color schemes, and lists every place it departs from MUI in `src/mui/departures.ts`: the palette (surfaces, borders, a navy primary, intent colors), the corner radius, the button style and the icon set. Anything not listed there is MUI's default.

The Storybook (foundations and guides, plus `llms.txt` and an MCP endpoint for agents) is deployed publicly on Vercel. See `docs/publishing.md`.

```bash
npm install
npm run storybook  # the design system, at http://localhost:6006
```

## Theme

`src/mui/theme.ts` builds the theme from MUI's defaults plus the entries in `src/mui/departures.ts`, and sets nothing itself. `departures.test.ts` fails when the theme differs from stock MUI anywhere a departure doesn't claim, and Foundations → MUI departures in Storybook is generated from the same list. The other Foundations pages (color, typography, spacing, shape, elevation, layout, z-index, motion) are generated from the running theme by `src/mui/foundations.ts`, with each value marked as MUI's default or a departure. To add a convention, add a departure with its reason.

## Icons

One component, `<Icon name="…" />` in `src/icons.tsx`: Material Symbols Outlined, Google's variable icon font, through MUI's `Icon`, at weight 300. Selected controls fill their icons through the theme. Both are departures in `src/mui/departures.ts`.

## Docs

Markdown in `docs/` is the source for the **Guides** section of Storybook. `scripts/build-docs.ts` (`npm run docs:build`, run by the Storybook scripts) turns each file into an MDX page and writes the Foundations pages. `docs/design-system-rules.md` holds the rules for using the system. Drop another `.md` file in the folder and it appears under Guides; list it in `internalDocs` in the script to keep it out.

## For coding agents

`AGENTS.md` (imported by `CLAUDE.md`) tells agents where to look and the rules that matter most. `.mcp.json` registers the Storybook MCP server (`npm run storybook`, then `http://localhost:6006/mcp`). `npm run build-storybook` also writes `llms.txt` and one Markdown page per component, guide and foundations page into `storybook-static/`, for agents that can only fetch URLs. The deployed Storybook serves the same docs tools at `/mcp` (`api/mcp.ts`); see `docs/publishing.md`.

## Data layer

`src/api` mirrors the Enertiv API: entity types copied from live responses, a cursor-paged mock adapter with a failure switch, the `AsyncState` contract and TanStack Query hooks. `src/fixtures/data` builds the sample portfolio the mock serves. See `docs/data-layer.md`.
