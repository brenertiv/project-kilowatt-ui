# Design System Rules

Rules for building Kilowatt UI. These are decisions, not suggestions: when code and this document disagree, fix one of them in the same change. Component code lives in `src/`; this file lives beside it on purpose so rules can change without touching components.

The token source of truth is `src/tokens.ts`, mirrored from the Figma file **Enertiv UI Foundations 0.0**. The Design System page in the app renders the live values; this document explains how to use them.

## Tokens

- Tokens are the only source of color, type, space, radius and shadow. No component declares a hex value, a pixel radius or a font family of its own.
- Styling is plain CSS with custom properties. The one exception is Material UI, which is styled through the theme bridge in `src/mui/theme.ts` and nowhere else: no `sx` colors, no `styled()` literals, no inline Emotion in components.
- Three layers. **Primitives** are the Figma ramps and scales, mirrored in `src/primitives.ts` with every color ramp normalised to eleven steps named 50 to 950 (the ten-step Figma ramps have their 1000 named 950 and a synthesized 50 tint, flagged as derived until added in Figma) and emitted as `--color-slate-300`, `--spacing-4`, `--radius-md` and so on; they change only when Figma changes. **Core** tokens are the identity knobs (background, text, accent, state colors, fonts, radius, control height, elevation, base space). **Semantic** tokens are roles with their own stored value (surfaces, borders, secondary text, tints, utilities, chart slots). Core and semantic are editable in the Theme editor and take their defaults from primitive steps.
- **Derived** variables (type scale steps, space scale, inner radius, shadow steps, scrollbar colors) are computed from the layers above and are never stored. Change the source token to move them.
- Every color token has a light and a dark value. A new color token is not done until both exist and the Design System contrast list has been checked.
- Adding a token means: add it to `src/tokens.ts`, give it a role group so the Design System page and the CSS export pick it up, and update the stylesheet `:root` fallback.

## Color

- Colors come from the Figma semantic collection, which has Light and Dark modes: three surfaces (page, sunken, raised), one border, one text color and the brand ramp, all built on the slate and navy primitives.
- Text emphasis: Figma defines secondary, muted and disabled as 70, 60 and 40 percent opacity of the text color. Our tokens are those steps flattened onto the raised surface and snapped so secondary and muted clear 4.5:1. Never use raw alpha text over a colored surface.
- Buttons rest on the sunken surface, lift to the raised surface on hover and drop to the page surface on press, with borders stepping through the text opacity scale, after Figma `button/*`. Navigation marks the selected item with the brand tint and brand text, after Figma `nav color/*`.
- Status colors are reserved. Positive, warning and negative mean good, caution and bad. They never color a series or a decoration, and they always ship with an icon or a label, never color alone.
- Warning text on white is below 4.5:1 by design. Pair it with an icon or use it on its tint.
- Utility colors (electricity, water, gas, steam, sanitation) are entity colors. A commodity keeps its hue everywhere it appears. They are not a categorical palette and fail the adjacent-pair checks together, so never rely on them alone to separate series.
- Links use the link token. Focus rings use the accent.

## Material UI

- Material UI is the component library for data display and page composition: cards, lists, chips, badges, skeletons, alerts, pagination, app bars and drawers. Base UI remains in place for the primitives already built on it. New work reaches for Material first; existing Base UI components migrate when they are next touched, not before.
- The bridge in `src/mui/theme.ts` is the only place Material learns a value. It reads the same resolved tokens the stylesheet receives, so the Theme editor and the scheme switch reach every Material component with no second source of truth. Add a token mapping there; never pass a color to a component.
- Material's palette roles map onto ours: `primary` is the accent, contained primary buttons wear the solid token, `secondary` is solid, `success`, `error` and `warning` are the state colors, `info` is the link color, `divider` is the border, `background.paper` is the raised surface.
- Material defaults that contradict the system are switched off in the bridge: ripples, button elevation, uppercase button text, the dark-mode elevation overlay. Cards are outlined. Motion uses the system curve and durations.
- `sx` is for layout only: spacing, flex, grid, width. Its spacing unit is 4px, so `spacing={4}` is 16px.
- Icons stay Material Symbols through `src/icons.tsx`. The `@mui/icons-material` package is not installed on purpose.

## Data components

- Components that show API data live in `src/components/data` and are built on Material UI. They are prop-driven: a component takes rows plus an `AsyncState`, never a query result. Pages derive the state with `fromQuery`. A fixture must reach loading, fetching, empty, error and, where names appear, placeholder.
- `DataState` is the one way to render the async states. No component hand-rolls a spinner, an empty message or an error block.
- Relations render through `RelationLink`, which accepts the bare id or the expanded record. Never assume the request expanded a relation.
- Names go through `EntityName` or `EntityCard`, which replace placeholder values such as `???` and `0` with "Unnamed {noun}" and explain why. The raw placeholder is never printed as a name.
- Status vocabularies render through `StatusChip` and its wrappers (`ActionStatusChip`, `ActionPriorityChip`, `AlertStateChip`). Tones follow meaning: success for done, warning for waiting, error for blocked or overdue, info for in progress, neutral otherwise. A chip always carries its label.
- Dates render through `DateText`, `RelativeTime` and `DateRangeText`. Calendar dates never shift time zone; timestamps render in the operations zone.
- The API gives no totals. A count says what is on the page and whether there is more; it never invents a total.
- Page views live in `src/pages`, compose these components, and run real queries. Their fixtures expose fail and latency switches.

## Charts

- Charts are built in `src/charts`. Every chart renders inside `ChartFrame`, uses `useChartRoot` for its root, and reads colors from the frame. No chart calls the chart library's color APIs with literals.
- The seven chart slots are a fixed order and are assigned to series in sequence by series id. Color follows the entity: filtering a chart never repaints the survivors. An eighth series is never a generated hue; fold it into Other or facet.
- The slots are steps from the Figma ramps (brand, orange, green, violet, spring, midnight, meadow), one per chromatic ramp, ordered by a search that maximises colorblind separation and validated with the dataviz checks on both surfaces. Red and yellow are reserved for status and never appear as series. Run the validator again before changing any slot or surface color.
- One axis per chart. Two measures of different scale get two charts, small multiples, or an index to a common base.
- Marks: 2px lines, columns capped at 24px with a 4px rounded data end, a 2px surface gap between touching fills, area washes at 10%.
- Text in charts wears text tokens, never the series color. Identity comes from a colored key beside the text.
- A legend is present for two or more series and absent for one. Every chart offers the table view so values are reachable without hover or color.
- Sequential color is one hue, light to dark, anchored to the surface in each scheme. Diverging color is two hues with a neutral midpoint.
- Heatmaps hide the categorical legend and show the ramp scale instead.

## Typography

- Roboto for interface text, Roboto Serif for long reading, Roboto Mono for code and identifiers.
- Type sizes come from the eight-step scale. Fixed steps serve dense UI; the fluid variants serve page-level hierarchy only.
- Titles are regular weight. Hierarchy comes from size, color and position, not from weight.
- Section eyebrows are small caps with wide tracking. Metrics are bold with tabular numerals so digits never shift.
- Body text is 14px with a 1.5 line height. Labels and descriptions are 12px.

## Space and shape

- Spacing uses the eight-step scale. The Figma component and layout aliases map onto it; use the alias that names the intent.
- Cards are 8px radius, controls 8px and 36px tall (Figma `button/radius` and `button/height/md`), chips and nested tiles 4px, avatars full.
- Nested radii are concentric: outer radius equals inner radius plus padding. Menu items derive their radius from the popup radius for this reason.
- Shadows are for elevation, borders are for structure. Cards are flat and rely on their border; popovers carry the md shadow, modals lg. Dividers, table cell lines and input outlines stay borders.
- Images get a 1px outline at 10% black in light and 10% white in dark. Never a tinted outline.

## Motion

- Interactive state changes use CSS transitions so they can be interrupted. Keyframes are for one-shot sequences only.
- One curve, `cubic-bezier(0.2, 0, 0, 1)`, and 150ms for state changes. Icon cross-fades run 300ms with scale 0.25, opacity 0 and 4px blur.
- Buttons scale to 0.96 on press. Steppers and segmented toggles stay static.
- Transition only the properties that change. Never `transition: all`.
- Theme switches suppress transitions for the swap so the page snaps instead of smearing.
- Every animated state also has a static cue. Motion is never the only feedback channel, and everything respects reduced motion.

## Icons

- One icon set per surface: Material Symbols Outlined, Google's variable icon font, wrapped once in `src/icons.tsx`. Nothing else references the font or its ligature names. Icons use `currentColor` and take hover, selected and disabled states from CSS.
- The font's axes are tokens: weight follows text weight (400), optical size 20 at 16px, grade 0. `FILL` is the one axis components may set, and only to mark an active state.
- Icons render at 16px in controls and 12px inside a checkbox. The icon class, not the surrounding font size, sets the size.
- Outline is the default variant. Fill marks the active state.

## Tables

- Tables are built with `DataTable`. Client mode for small sets; server mode with controlled state for portfolio-scale data.
- Column layout (visibility, order, pinning, sizing, density) persists per table id. Sort, filter and page state can sync to the URL so views are shareable.
- Numeric columns align end with tabular numerals. Empty values render as an em dash with an accessible name.
- Export writes the filtered and sorted model, every page, visible columns only.
- Loading shows a skeleton. Refetching keeps the previous rows at reduced opacity. Errors offer a retry.

## Accessibility baseline

- Every control has a visible focus ring and an accessible name. Icon-only buttons carry an `aria-label`.
- Contrast: body text 4.5:1, large text and UI parts 3:1. The Design System page measures the token pairs that matter.
- Charts expose a text description and a table view. Tables expose sort state, row counts and selection counts to assistive technology.
- Hit targets are at least 24px, and 28px for card controls.

## Changing the system

1. Change tokens in `src/tokens.ts` and the stylesheet fallback together.
2. Run the test suite. Palette and contrast expectations are tests, so a drift shows up immediately.
3. For chart colors, run the dataviz palette validator on both surfaces and keep the output with the change.
4. Check both schemes in the gallery. The Theme editor can preview a change before it lands.
5. Update this document in the same change.
