# Design System Rules

Rules for building Kilowatt UI. These are decisions, not suggestions: when code and this document disagree, fix one of them in the same change.

Kilowatt starts from stock Material UI. The theme is `createTheme` with MUI's own light and dark color schemes, plus the departures in `src/mui/departures.ts`. Foundations → MUI departures lists every one of them; anything not listed there is MUI's default, on purpose.

## Build with MUI as MUI documents it

- Use MUI components, props, variants and palette roles as the MUI documentation describes them. Don't restyle a component to make it look like something MUI doesn't document.
- Style through MUI's documented props first (`color`, `variant`, `size`, `elevation`), then `sx` with theme keys: palette paths (`color: 'text.secondary'`), spacing multiples (`p: 2`), radius multiples (`borderRadius: 1`), elevation levels (`boxShadow: 1`) and breakpoint objects.
- Never a raw value: no hex colors, pixel radii, font families or shadows of your own, and no parallel set of CSS variables. The Foundations pages list every theme value, each marked as MUI's default or a departure.

## Surfaces and borders

- Surfaces go by elevation: `background.level0` (the page, darkest) to `background.level4` (the highest surface, lightest), in both schemes. Paper takes its level from its `elevation`, so cards, menus and dialogs need nothing extra. Set a level yourself only on a surface that isn't Paper: `sx={{ bgcolor: 'background.level2' }}`.
- Borders go by contrast: `border.level0` (faintest) to `border.level2` (strongest), in both schemes. `divider` is `border.level1`. Use `border.level0` for quiet separators and `border.level2` where the edge must read.
- Intents (`primary`, `error`, `success` and the rest) pass 4.5:1 as text on every surface level, in both schemes, so any intent can sit on any surface. Use them through `color` props or palette keys, never by hex.
- Never use a ramp step (`src/mui/colors.ts`) in a component. The levels are the API; the ramps are what they're made of.

## Adding a convention

A convention is anything that differs from MUI's default: a theme value, a default prop, or a rule about how a component is used. To add one:

1. Add an entry to `src/mui/departures.ts` with the reason. Theme changes go in `options`; anything outside the theme goes in `convention`, saying what MUI does, what Kilowatt does instead and where.
2. Don't set theme values anywhere else. `departures.test.ts` fails when the theme differs from stock MUI anywhere a departure doesn't claim.
3. Check that the new convention doesn't overlap an existing one. If two entries touch the same thing, merge them.

## Icons

- Use `<Icon name="…" />` from `src/icons`: Material Symbols Outlined, Google's variable icon font, through MUI's `Icon`. It renders outlined at weight 300. Size and color are MUI's `fontSize` and `color` props. Pass `weight` or `fill` only for a reason, and never write a ligature or an SVG by hand.
- A selected control fills its icons through the theme (`ToggleButton`, `Tab`, `ListItemButton`, `MenuItem`, `BottomNavigationAction`). Don't pass `fill={selected}` yourself.
- Icons are decorative (`aria-hidden`). An icon-only control needs an `aria-label`.

## Accessibility

- Every control has a visible focus state and an accessible name.
- Every story runs an axe check in the story tests, and a violation fails it.
