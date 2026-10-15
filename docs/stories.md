# Writing Stories

Every component, recipe and page is documented in Storybook. A story file sits beside the component it documents, named `Name.stories.tsx`. Storybook builds a component manifest from these files, and agents read that manifest through the MCP server. So a story is the usage example someone copies, as well as a test fixture.

```bash
npm run storybook        # http://localhost:6006, with the MCP endpoint at /mcp
npm run build-storybook  # static site in storybook-static/
npm run test:stories     # every story rendered in Chromium, with an axe check
```

## A story file

```tsx
// src/components/data/StatCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatCard } from './StatCard';

const meta = {
  title: 'Data/StatCard',
  component: StatCard,
  args: { label: 'Consumption, last 30 days', value: 12853, unit: 'kWh' },
  argTypes: { unit: { control: 'select', options: ['kWh', 'kW', 'USD'] } },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The usual card: a value, its change, and the period. */
export const Default: Story = {};

/** First load: the card shows a skeleton. */
export const Loading: Story = { args: { state: { status: 'loading' } } };
```

- **Title.** The title is the sidebar path and the story id agents see. Use `Data/`, `Table/`, `Charts/`, `Menus/`, `Primitives/`, `Patterns/`, `Pages/` or `Internal/`. Titles are public: renaming one breaks links and agent references.
- **State lives in args.** Every prop that changes the component goes in `args`, with `argTypes` for selects and radios. Don't hold state in hooks inside a render function; the manifest and the copied snippet only see args. Callback props take `fn()` from `storybook/test`, so the Actions panel logs them.
- **One concept per story.** Name a story for the situation it shows (`Loading`, `Empty`, `LongContent`, `Failed`), never for a grab bag ("All states"). Name error stories `Failed`, so the export doesn't shadow the global `Error`.
- **A JSDoc line on every story.** Say when to use that state or variant. Agents receive it with the snippet.
- **Keep imports short.** Every import in a story file is merged into the import block agents copy. Wrap layout in a plain `<div style={...}>`, not MUI `Box`, and import sample data rather than defining helpers inline.
- **Components without a single export.** When one file exports several related components (`StatusChip` and its wrappers, the table cells), the main one is `component` and the rest go in `subcomponents`. Each sibling gets its own story with a `render`.
- **Charts.** Charts throw outside `ChartFrame`. A chart story's `render` shows the real `<ChartFrame><TimeSeriesChart /></ChartFrame>` composition at a fixed height, so the snippet is correct usage.
- **Primitives.** These are Base UI recipes with no component behind them. Their stories render the raw Base UI markup with the `ui-*` classes, and type their args locally.

## What every story gets

`.storybook/preview.tsx` wraps every story in:

- the app's provider stack: query client, theme, Material bridge, toasts, tooltips;
- a `MemoryRouter`;
- a fresh query client per story;
- the toast outlet.

The **Scheme** toolbar switches light and dark. The theme is set on `<html>`, so a docs page shows every story in the same scheme. The viewport toolbar offers Phone, Tablet and Laptop. Set `globals: { viewport: { value: 'phone' } }` on a story that is about a small screen.

## Data

- **Mock API.** Pages and anything else that queries run against the in-process mock API. Set `parameters.mockApi` on a story to change it: `{ fail: true }` rejects every request, and `{ latencyMs: 3000 }` slows every request. Every story starts from the defaults, so a failing story never leaks into the next. Page stories use the `withPageFrame` decorator and `layout: 'fullscreen'` (see `src/pages/BuildingDetail.stories.tsx`).
- **Sample sets.** `src/fixtures/data` holds API-shaped sets: `none`, `one`, `few`, `page`, `all`, `sparse`, `long` and `placeholder`. `src/fixtures/sampleData.ts` holds the chart and table sets. Make each set its own story rather than a select of arrays.

## Keeping things out of the manifest

Demos of third-party libraries, internal comparisons and playgrounds go under `Internal/` with `tags: ['!manifest']`. They stay browsable but agents don't learn them as part of the system. `tags: ['!test']` takes a story out of the test run. Only use it with a comment saying why and what would bring the story back.

## Figma

Link a component to its Figma node on the meta:

```tsx
parameters: { design: figmaDesign('https://www.figma.com/design/<key>/<file>?node-id=12-345') },
```

`figmaDesign` (in `src/stories/figma.ts`) stores the link in canonical form. If the link isn't a Figma node, it throws when the file loads, so the story tests catch it. The link shows in the **Design** panel. The whole-file link lives on the **System** page (see `docs/figma.md`).

## Tests

`npm run test:stories` renders every story in Chromium. It runs any `play` function and an axe accessibility check. The axe check reports violations without failing the run until the findings in `docs/storybook-plan.md` are fixed. `npm test` runs the unit and story projects together.

## Adding a component

1. Write the component with JSDoc on the component (with `@summary`) and on every prop.
2. Create `Name.stories.tsx` beside it, with a story for each state: default, loading, fetching, empty, error, long content and, where names appear, placeholder.
3. Run `npm run storybook`, open the component, and switch to dark. If a state can't be reached from the sidebar or the controls, it isn't covered.
4. Run `npm run test:stories`.
