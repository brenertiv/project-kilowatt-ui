# Writing Stories

A story file sits beside the component it documents, named `Name.stories.tsx`. Storybook builds a component manifest from these files, and agents read that manifest through the MCP server. So a story is the usage example someone copies, as well as a test fixture.

```bash
npm run storybook        # http://localhost:6006, with the MCP endpoint at /mcp
npm run build-storybook  # static site in storybook-static/
npm run test:stories     # every story rendered in Chromium, with an axe check
```

## A story file

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Example } from 'src/components/Example';

const meta = {
  title: 'Components/Example',
  component: Example,
  args: { label: 'Example', onClick: fn() },
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The usual case. */
export const Default: Story = {};
```

- **Title.** The title is the sidebar path and the story id agents see. Titles are public: renaming one breaks links and agent references.
- **State lives in args.** Every prop that changes the component goes in `args`, with `argTypes` for selects and radios. Callback props take `fn()` from `storybook/test`, so the Actions panel logs them.
- **One concept per story.** Name a story for the situation it shows (`Loading`, `Empty`, `Failed`), never for a grab bag ("All states"). Name error stories `Failed`, so the export doesn't shadow the global `Error`.
- **A JSDoc line on every story.** Say when to use that state or variant. Agents receive it with the snippet.
- **Import by repository path.** Story files import with `src/...` paths, never relative ones. Every import in a story file is merged into the import block agents copy, and a relative path is useless outside its folder.
- **JSDoc on the component.** Give it a description, an `@summary` line and an `@import` line naming the exact import to copy. Give every prop a line saying what it does and its default. The manifest is built from these.

## What every story gets

`.storybook/preview.tsx` wraps every story in the provider stack: the MUI theme with CssBaseline, and a fresh query client per story. The **Scheme** toolbar switches MUI's color scheme between light and dark. The viewport toolbar offers Phone, Tablet and Laptop.

Stories that query run against the in-process mock API. Set `parameters.mockApi` to change it: `{ fail: true }` rejects every request, and `{ latencyMs: 3000 }` slows every request. Every story starts from the defaults.

## Keeping things out of the manifest

Demos and playgrounds that are not part of the system get `tags: ['!manifest']`. They stay browsable but agents don't learn them. `tags: ['!test']` takes a story out of the test run. Only use it with a comment saying why and what would bring the story back.

## Tests

`npm run test:stories` renders every story in Chromium. It runs any `play` function and an axe accessibility check, and any axe violation fails the story. Icons are the one exception to axe's text-contrast rule: a Material Symbols glyph is a graphic, held to 3:1 rather than 4.5:1, so the rule skips it (`src/stories/a11y.ts`) and `departures.test.ts` checks the icon colors on every surface instead. `npm test` runs the unit and story projects together. The story project pre-bundles a fixed list of packages, `src/test/storyDeps.ts`. When `src` imports a package (or a MUI subpath) for the first time, add it there; `storyDeps.test.ts` names any that are missing.
