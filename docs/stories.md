# Writing Stories

Every component is documented the same way: a story file, `Name.stories.tsx`, and a guidance page, `Name.mdx`, side by side in `src/components`. Storybook builds a component manifest from both, and agents read that manifest through the MCP server. Agents see the manifest, not the rendered Docs tab, so anything they should know has to be written as text in these two files.

```bash
npm run storybook        # http://localhost:6006, with the MCP endpoint at /mcp
npm run build-storybook  # static site in storybook-static/
npm run test:stories     # every story rendered in Chromium, with an axe check
```

`src/components/Button.stories.tsx` and `Button.mdx` are the reference; copy their shape for a new component.

## The story file

```tsx
import Button from '@mui/material/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks the page against them.
  parameters: { muiComponents: ['Button', 'IconButton'] },
  args: { children: 'Dispatch Ticket' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The main action in a view or dialog: `variant="contained"`, high emphasis. One per view. */
export const Contained: Story = {
  args: { variant: 'contained', onClick: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Dispatch Ticket' }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
```

- **Title.** `Components/<Name>`. The title is the sidebar path and the story id agents see. Titles are public: renaming one breaks links and agent references.
- **`parameters.muiComponents`.** The MUI components the page documents, by import name. The page's MUI departures section is checked against them.
- **`tags: ['!autodocs']`.** The `.mdx` page is the docs page.
- **Args hold only what differs from the default.** Every arg shows up in the snippet agents copy, so `size="medium"` or `disabled={false}` teaches them to write noise. Put a value in `meta.args` only if every story needs it, and give callbacks (`fn()`) only to stories whose `play` function uses them.
- **One concept per story.** Name a story for the situation it shows (`Contained`, `Loading`, `Icon only`), never for a grab bag ("All states"). Name error stories `Failed`, so the export doesn't shadow the global `Error`.
- **A JSDoc line on every story, key point first.** Say when and why to use that variant or state. Agents may see only the first 60 characters.
- **Interactions get a `play` function.** Click, type or toggle, and assert the visible result or the callback.
- **No anti-patterns in stories.** A story is code an agent will copy. What not to do goes in the page's Do and don't section, as text.
- **Import by repository path.** Story files import with `src/...` paths, never relative ones. Every import in a story file is merged into the import block agents copy.
- **A component of our own** (not an MUI one) also needs JSDoc on the component: a description, an `@summary` line, an `@import` line naming the exact import to copy, and a line for every prop with its default.

## The guidance page

`Name.mdx` beside the stories, attached with `<Meta of={NameStories} summary="…" />`. The `summary` says what the component is for in one sentence; agents get it in the component list.

The page opens with an `# Name` heading, a paragraph saying what the component does, which Material UI major it's written for ("Material UI v9") and where MUI documents its props, and a `<Canvas>` of the main story. Then these `##` sections, in this order. The ones marked required must be there; the others only when they have something to say.

| Section        | Required | What it holds                                                                                                                                                                                           |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When to use    | Yes      | What the component is for, and what to use instead for the cases it isn't: "For navigation, use `Link`."                                                                                                |
| Usage          | Yes      | The import and a minimal example, as code.                                                                                                                                                              |
| Variants       | No       | The variants, colors and sizes, and when to choose each.                                                                                                                                                |
| States         | No       | Disabled, loading, empty, error and the like, and what each means.                                                                                                                                      |
| Do and don't   | Yes      | Bullets starting `- Do ` or `- Don't `. Pair them: each Don't says what to do instead. Text only, no code.                                                                                              |
| MUI departures | Yes      | One bullet per departure that changes this component, starting with its id in backticks, then a line on what it means here. Then one line pointing to the theme-wide departures. If none apply, say so. |
| Accessibility  | Yes      | What MUI already handles, and what the person using the component must add (labels, announcements).                                                                                                     |
| Related        | No       | Neighbouring components and pages.                                                                                                                                                                      |

End the page with `<Stories includePrimary={false} />`.

Write everything as literal text. Storybook builds the manifest by reading the MDX source, so a value imported from a file or rendered by a component never reaches agents.

`src/components/docs.test.ts` checks every component page: the sections exist and are in order, the intro names the installed Material UI major, Do and don't has at least one of each, and the MUI departures section lists exactly the departures whose `components` include the page's `muiComponents`. Adding a departure that affects a documented component fails that test until the page lists it.

## What every story gets

`.storybook/preview.tsx` wraps every story in the provider stack: the MUI theme with CssBaseline, and a fresh query client per story. The **Scheme** toolbar switches MUI's color scheme between light and dark. The viewport toolbar offers Phone, Tablet and Laptop.

Stories that query run against the in-process mock API. Set `parameters.mockApi` to change it: `{ fail: true }` rejects every request, and `{ latencyMs: 3000 }` slows every request. Every story starts from the defaults.

## Keeping things out of the manifest

Demos and playgrounds that are not part of the system get `tags: ['!manifest']`. They stay browsable but agents don't learn them. `tags: ['!test']` takes a story out of the test run. Only use it with a comment saying why and what would bring the story back.

## Tests

`npm run test:stories` renders every story in Chromium. It runs any `play` function and an axe accessibility check, and any axe violation fails the story. Icons are the one exception to axe's text-contrast rule: a Material Symbols glyph is a graphic, held to 3:1 rather than 4.5:1, so the rule skips it (`src/stories/a11y.ts`) and `departures.test.ts` checks the icon colors on every surface instead. `npm test` runs the unit and story projects together. The story project pre-bundles a fixed list of packages, `src/test/storyDeps.ts`. When `src` imports a package (or a MUI subpath) for the first time, add it there; `storyDeps.test.ts` names any that are missing.
