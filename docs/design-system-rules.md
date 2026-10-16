# Design System Rules

Rules for building Kilowatt UI. These are decisions, not suggestions: when code and this document disagree, fix one of them in the same change.

Kilowatt starts from stock Material UI. The theme is `createTheme` with light and dark color schemes, plus the departures in `src/mui/departures.ts`: the palette (surfaces, borders, a navy primary, intent colors), the corner radius, the button style and the icon set. Foundations → MUI departures lists every one of them; anything not listed there is MUI's default, on purpose.

## Build with MUI as MUI documents it

- Use MUI components, props, variants and palette roles as the MUI documentation describes them. Don't restyle a component to make it look like something MUI doesn't document.
- Style through MUI's documented props first (`color`, `variant`, `size`, `elevation`), then `sx` with theme keys: palette paths (`color: 'text.secondary'`), spacing multiples (`p: 2`), radius multiples (`borderRadius: 1`), elevation levels (`boxShadow: 1`) and breakpoint objects.
- Never a raw value: no hex colors, pixel radii, font families or shadows of your own, and no parallel set of CSS variables. The Foundations pages list every theme value, each marked as MUI's default or a departure.

## Token tiers

Tokens come in three tiers, each reading only from the one below it.

| Tier          | Where                                                                                | What it holds                                                                             | Read by                              |
| ------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| 1. Primitives | `src/mui/colors.ts` and MUI's `@mui/material/colors`                                 | Raw ramps (slate, navy, blue, red…). The only place a hex value lives.                    | The semantic tier only               |
| 2. Semantic   | `theme.palette`, `theme.typography`, `theme.shadows`, `theme.shape`, `theme.spacing` | Roles: `primary`, `background.level*`, `border.level*`, `text.*`, the `button` type style | The component tier, components, `sx` |
| 3. Component  | `theme.components.Mui*` (`defaultProps`, `styleOverrides`)                           | How one component uses the roles                                                          | Nothing; it's the end of the chain   |

- A palette color is a ramp step. To add a color, add or pick a step in a ramp, then name the role in the palette.
- Ramps use the standard steps only: 50, the hundreds from 100 to 900, and 950. No half steps (350, 650) and nothing past 50 or 950 (25, 1000). When a ramp needs a color between two steps, renumber the ramp so it still fits the standard steps, rather than adding one in between.
- A component override refers to the palette through MUI's CSS variables (`var(--mui-palette-background-level3)`), never to a hex value or a ramp step.
- Components and `sx` use the semantic tier only: palette paths, spacing multiples, the type variants.
- `src/mui/tokens.test.ts` checks the ramp steps, that palette colors are ramp steps, and that component overrides use palette variables.

## Surfaces and borders

- Surfaces go by elevation: `background.level0` (the page, darkest) to `background.level4` (the highest surface, lightest), in both schemes. Paper takes its level from its `elevation`, so cards, menus and dialogs need nothing extra. Set a level yourself only on a surface that isn't Paper: `sx={{ bgcolor: 'background.level2' }}`.
- Borders go by contrast, in both schemes. `border.level0` to `border.level2` separate and frame: `border.level0` for quiet separators, `divider` (`border.level1`) by default, `border.level2` where the edge must read. `border.level3` is only for control outlines (outlined buttons, inputs, selects): it reaches 3:1 on every surface, as WCAG asks of a control's boundary. Don't use it for dividers or containers.
- Intents (`primary`, `error`, `success` and the rest) pass 4.5:1 as text on every surface level, in both schemes, so any intent can sit on any surface. Use them through `color` props or palette keys, never by hex.
- Never use a ramp step (`src/mui/colors.ts`) in a component. The levels are the API; the ramps are what they're made of.

## One border per edge

Advisory: check for this while building a component or layout, as part of the work.

Every visible edge is drawn once. When two elements on the same layer would each draw a line along the same edge, or two parallel lines sit within 4px of each other with nothing meaningful between them, only one of them keeps its border.

What counts as a double border:

- **Nested frames.** A bordered container directly inside another, sharing an edge or sitting inside its padding: an outlined Paper inside a Card, a framed specimen inside a Storybook Canvas.
- **Adjacent full borders.** Items that each draw a full border, so the shared edge is 2px: cells, list rows, stacked cards with no gap, buttons in a row.
- **A divider on an edge.** A `Divider`, or a top or bottom border, placed first or last inside a bordered container, landing on the container's own edge.
- **Border plus shadow.** An elevated surface that also has an outline.
- **Borders inside a scroll container.** Edge borders drawn by the scrolling content, which scroll away or stack against the container's own edge.

Who keeps the line:

1. **Nested:** the outermost element that owns the edge keeps it; the inner one drops its border. With MUI, that usually means `elevation={0}` in place of `variant="outlined"` on the inner Paper.
2. **Adjacent:** separate items with dividers, never a full border on each. Prefer MUI components that already do this: `List` with `divider` items, `ButtonGroup`, `ToggleButtonGroup`, `Table`. In your own styles, draw the line on one side only.
3. **Dividers:** never first or last inside a framed container; the frame is already the edge.
4. **Elevation or outline:** a surface uses one or the other. MUI's outlined Paper is the outlined version; don't add a border to an elevated surface.
5. **Scrolling:** the scroll container draws the frame; the content inside it draws only inner dividers.
6. **Color:** a frame and its inner dividers use the same `border.level*`, so they never read as two different lines.

What the rule doesn't cover:

- **Other layers.** The rule applies within one layer. Modals, drawers, menus, popovers, tooltips and snackbars float above the page on their own layer (MUI renders them in a portal and stacks them with `theme.zIndex`; see Foundations → Z-index). Their edge landing next to a line on the layer below is not a double border.
- **Focus rings.** They are outlines outside the border, not borders.

To check: inspect each bordered element in the browser and compare its border on each side with its parent's and children's on the same side. Look at light and dark, at 200% zoom, and with any scroll container at rest and scrolled to each end. Storybook's docs chrome (Canvas blocks, code blocks, tables) follows the same rule.

## Concentric corners

Advisory: check for this while building a component or layout, as part of the work.

The theme has one corner radius, `shape.borderRadius` (8px), and every rounded component takes it, buttons and icon buttons included. In `sx`, `borderRadius` counts in theme radii: `1` is 8px, `1.5` is 12px.

All buttons, icon buttons and other rounded components share that one radius, and it changes only in one place: the `shape-radius` departure. Don't give one intent, variant or instance its own radius, in a theme override or in `sx`; `tokens.test.ts` fails any component override that rounds with anything but the theme radius.

When a rounded element sits close inside a rounded container, their corners are concentric: the container's radius is the element's radius plus the gap between them.

- **The gap** is everything between the two edges at the corner: padding plus the container's border.
- **The control keeps the theme radius; the container grows.** A button is 8px wherever it sits, so a container hugging it with 4px of padding is 12px. Don't shrink the inner radius to make the corners fit.
- **In theme units it's addition.** The radius unit and the spacing unit are both 8px, so container `borderRadius` = inner `borderRadius` + padding: a button (`1`) in a toolbar with `p: 0.5` gives the toolbar `borderRadius: 1.5`. This holds only while both units are 8px; if either changes, convert through pixels.
- **When it applies:** gaps under 16px. At 16px or more, the corners read as separate shapes, and both keep the theme radius (a button inside a card with `p: 2`).
- **Flush edges aren't rounded.** An element flush against its container's edge (an image at the top of a card, menu items) has square corners on that side; the container's radius and `overflow: hidden` shape it.
- **MUI already does this** for `ButtonGroup` and `ToggleButtonGroup`, which square the corners where buttons meet.

To check: wherever a rounded element sits within 16px of a rounded container's corner, compare the container's radius with the element's radius plus the gap.

## Adding a convention

A convention is anything that differs from MUI's default: a theme value, a default prop, or a rule about how a component is used. To add one:

1. Add an entry to `src/mui/departures.ts` with the reason. Theme changes go in `options`; anything outside the theme goes in `convention`, saying what MUI does, what Kilowatt does instead and where. List the MUI components it changes in `components` (leave it out only for a theme-wide change), and add the departure to each of those components' pages under MUI departures.
2. Don't set theme values anywhere else. `departures.test.ts` fails when the theme differs from stock MUI anywhere a departure doesn't claim.
3. Check that the new convention doesn't overlap an existing one. If two entries touch the same thing, merge them.

## Icons

- Use `<Icon name="…" />` from `src/icons`: Material Symbols Outlined, Google's variable icon font, through MUI's `Icon`. It renders outlined at weight 300. Size and color are MUI's `fontSize` and `color` props. Pass `weight` or `fill` only for a reason, and never write a ligature or an SVG by hand.
- A selected control fills its icons through the theme (`ToggleButton`, `Tab`, `ListItemButton`, `MenuItem`, `BottomNavigationAction`). Don't pass `fill={selected}` yourself.
- Icons are decorative (`aria-hidden`). An icon-only control needs an `aria-label`.

## Accessibility

- Every control has a visible focus state and an accessible name.
- Every story runs an axe check in the story tests, and a violation fails it.
