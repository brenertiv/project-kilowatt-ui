# Figma Sync

The repository mirrors the Figma file **Enertiv UI Foundations 0.0**. This document is the contract for keeping the two in step: who owns what, which direction each category moves, and the three artifacts that carry the sync.

## Ownership

Direction is decided once per layer and recorded here, never per sync run.

| Layer                                                                                                    | Owner   | Moves        | Where it lands                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------- | ------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitives: color ramps, spacing, radius, type sizes, weights, leading, tracking, control sizes, opacity | Figma   | Figma → code | `src/primitives.ts` reads the snapshot. Nothing is typed by hand.                                                                                                      |
| Semantic roles and modes: surfaces, dividers, text emphasis, action overlays, the six palettes           | Figma   | Figma → code | `src/tokens.ts` reads both modes from the snapshot. Token ids and CSS variables use Figma's vocabulary (`--background-level1`, `--text-tertiary`, `--secondary-main`). |
| Code-computed tokens: tints, utilities, chart slots, track, subtle and strong dividers                   | Code    | code → Figma | Declared in `src/tokens.ts` as a primitive step per mode and pushed into a `code` collection in Figma as aliases.                                                      |
| Derived variables: type scale clamps, the space scale, shadows, scrollbar colors                         | Code    | not synced   | Computed in `src/tokens.ts`. Designers read them on the System page.                                                                                                   |
| Fonts                                                                                                    | Figma   | Figma → code | The font stacks take their first family from `primitives/typography/fontFamily/*`. The sans family is Roboto on both sides.                                            |
| Components                                                                                               | Neither | linked       | Each component's stories set `parameters.design` to its node, shown in Storybook's Design panel. Review is the story beside the Figma frame.                           |
| Theme editor overrides                                                                                   | Local   | not synced   | Experiments. Promote one by changing a default in code, then push.                                                                                                     |

Anything Figma owns that code wants to change goes through Figma first. Anything code owns shows up in Figma as read-only output.

## The three artifacts

- **Snapshot**, `src/figma/variables.json`. A full dump of every local variable collection in the file, with modes, values and alias chains kept by name. Committed. It is the only thing that crosses the boundary from Figma, and the primitives and tokens are built from it at import time, so code cannot drift from the snapshot. Drift can only exist between the snapshot and the live file, which is why the snapshot date is shown on the System page.
- **Links**. `src/figma/links.json` holds the whole-file link, entered on the System page. Each component's node link is `parameters.design: figmaDesign(url)` on its story meta (`docs/stories.md`).
- **Push plan**, computed from `src/tokens.ts`. Every code-owned token with the primitive step it names per mode, compared with the `code` collection in the snapshot. The System page shows what is missing or points elsewhere and hands over the script.

## Reading from Figma

The account is on Figma Pro, so the Variables REST API is unavailable and every read runs inside Figma through the Plugin API. The plugin sandbox has no network access and a 20 KB return limit, so a dump runs once per collection.

1. In the file, run `figma/snapshot.figma.js` through the Figma connector (`use_figma`), setting `COLLECTIONS` to one or more collection names. It returns a chunk of JSON.
2. Save each chunk to a file and assemble:

```bash
npm run figma:snapshot -- chunk-primitives.json chunk-color.json chunk-rest.json
```

The assembler sorts collections and variables by name and keeps any collection you did not re-dump, so one changed collection is a small diff. Commit the result; the app rebuilds the primitives and tokens from it.

## Writing to Figma

1. Open the **System** tab. The Figma row says how many code-owned tokens are not in the file yet.
2. **Copy push script** and run it in the file through the connector.
3. Re-dump the `code` collection and assemble, so the snapshot records what was pushed and the panel reads clean.

The script is idempotent. It creates the `code` collection with Light and Dark modes when missing, creates or updates one variable per entry as an alias to the primitive it names, and reports variables in the collection that code no longer declares without deleting them.

## What the tests enforce

- `src/figma/snapshot.test.ts`: the reader follows aliases per mode, multiplies alias opacity into alpha, and fails loudly on missing paths and loops.
- `src/primitives.test.ts`: the ramps keep exactly the steps Figma gives them, and every opaque semantic color resolves to a ramp step in both modes.
- `src/figma/push.test.ts`: every code-owned token is declared as a primitive step per mode, and the plan tells missing from changed.
- `src/figma/links.test.ts`: `links.json` is canonical, and `figmaDesign` accepts only a Figma node link. A bad link in a story throws when the file loads, so the story tests catch it.

## Decisions recorded on 2026-10-14

- Sans font is Roboto. Figma was updated to match; the text styles bound to the variable follow.
- Spacing uses Figma's scale, 8px base with half steps, under Figma's names (`spacing/0_5`, `spacing/1`, `spacing/1_5`).
- Semantic tokens use Figma's vocabulary. The page is `background/default`, toolbars and inputs `background/level1`, nested wells `background/level2`, cards and popovers `background/paper`.
- Text emphasis uses Figma's solid navy steps, not opacity.
- The red ramp and the ramp step names are Figma's. Ramps are no longer padded to eleven steps.

Known contrast failures reported on the System page after adopting Figma's dark values: error and warning text on dark paper, and tertiary text on dark paper. They are Figma's to fix.
