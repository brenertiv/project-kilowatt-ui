# Figma Links

The repository mirrors the Figma file **Enertiv UI Foundations 0.0**: primitives and tokens in `src/primitives.ts` and `src/tokens.ts`, components in `src/components`. The Figma link registry records where each of those lives in Figma, so a reader of either side can jump to the other, and a rename on one side shows up as a dangling link on the other.

## The registry

`src/figma/links.json` is the source of truth and is committed with the code.

```json
{
  "file": "https://www.figma.com/design/<key>/Enertiv-UI-Foundations-0.0",
  "components": {
    "button": "https://www.figma.com/design/<key>/Enertiv-UI-Foundations-0.0?node-id=12-345",
    "data-table": "https://www.figma.com/design/<key>/Enertiv-UI-Foundations-0.0?node-id=12-400"
  }
}
```

- `file` is a whole-file link to the design file the system is mirrored from.
- `components` maps a workbench slug (the `DataTable.fixture.tsx` file is `data-table`) to a link to that component's node. Pages under `src/pages` are keyed the same way.
- Links are stored in canonical form: `www.figma.com`, `design` in place of the legacy `file` path, and only the `node-id` parameter kept. Tracking parameters are dropped.
- `src/figma/links.test.ts` fails when an entry is not canonical, is not a Figma link, or names a slug that has no fixture. Renaming a component means updating its key in the same change.

## Entering a link

In Figma, select the component (or nothing, for the whole file) and use **Copy link to selection** or **Copy link**. Then paste it in one of two places:

- **Components tab**, in the right-hand drawer under **Figma**: the link for the component on stage. A component without its own link offers the file link instead.
- **System tab**, under the page title: the whole-file link, with a count of how many fixtures are mapped.

Pasting and pressing **Link** writes the registry through the dev server, so the change lands in the working tree as an edit to `src/figma/links.json` for you to commit. The production build is read-only and says so; edit the file by hand there, or run the dev server.

Editing the file directly also works. The app watches it and updates in place.

## How it stays in sync

- The link is the contract. Code and Figma each keep their own structure; the registry says which node a fixture corresponds to.
- A link opens the exact node, so reviewing a component means opening the fixture and its Figma frame side by side.
- The test keeps every key honest against the fixture list, and the file's sorted keys keep diffs to one line per change.
- Token values still travel the other way, from Figma into `src/primitives.ts` and `src/tokens.ts`, as `docs/design-system-rules.md` describes. The registry does not copy values; it records where they come from.
