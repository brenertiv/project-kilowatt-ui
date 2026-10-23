# Design System Rules

Rules for building Kilowatt UI. These are decisions, not suggestions: when code and this document disagree, fix one of them in the same change.

Kilowatt starts from stock Material UI. The theme is `createTheme` with light and dark color schemes, plus the departures in `src/mui/departures.ts`: the palette (surfaces, borders, a navy primary (light neutral in dark), a brand-blue secondary, a purple info, intent colors), the corner radius, the button style, the icon set, type rendering (tabular numerals, text wrapping, no synthesized styles) and reduced motion. Foundations → MUI departures lists every one of them; anything not listed there is MUI's default, on purpose.

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
- Borders go by contrast, in both schemes. `border.level0` to `border.level2` separate and frame: `border.level0` for quiet separators, `divider` (`border.level1`) by default, `border.level2` where the edge must read. `border.level3` is the strongest, for a frame or separator that must stand out; it reaches 3:1 on every dark surface and sits below 3:1 in light for now, by design decision.
- Control outlines are a separate role, `palette.control` (`border`, `hover`, `focus`, `pressed`), set for inputs, selects, outlined buttons and toggle buttons through the `control-outlines` departure. They don't follow the border levels, and the border levels don't follow them, so either can change on its own. Don't outline a control with a `border.level*`, and don't frame a surface with a `control` color. At rest the control outline is slate 600 in light and navy 700 in dark, below 3:1 by design decision.
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

All buttons, icon buttons and other rounded components share that one radius, and it changes only in one place: the `shape-radius` departure. Don't give one intent, variant or instance its own radius, in a theme override or in `sx`. The one exception is a container whose controls always sit close to its corners: its departure rounds it at a whole multiple of the theme radius (`calc(2 * var(--mui-shape-borderRadius))`), as `card-radius` does for cards. `tokens.test.ts` fails any component override that rounds with anything else.

When a rounded element sits close inside a rounded container, their corners are concentric: the container's radius is the element's radius plus the gap between them.

- **The gap** is everything between the two edges at the corner: padding plus the container's border.
- **The control keeps the theme radius; the container grows.** A button is 8px wherever it sits, so a container hugging it with 4px of padding is 12px. Don't shrink the inner radius to make the corners fit.
- **In theme units it's addition.** The radius unit and the spacing unit are both 8px, so container `borderRadius` = inner `borderRadius` + padding: a button (`1`) in a toolbar with `p: 0.5` gives the toolbar `borderRadius: 1.5`. This holds only while both units are 8px; if either changes, convert through pixels.
- **When it applies:** gaps under 16px. At 16px or more, the corners read as separate shapes, and both keep the theme radius (a button inside a card with `p: 2`).
- **Flush edges aren't rounded.** An element flush against its container's edge (an image at the top of a card, menu items) has square corners on that side; the container's radius and `overflow: hidden` shape it.
- **MUI already does this** for `ButtonGroup` and `ToggleButtonGroup`, which square the corners where buttons meet.

To check: wherever a rounded element sits within 16px of a rounded container's corner, compare the container's radius with the element's radius plus the gap.

## Component size

Every component with a `size` prop uses `medium`: buttons, icon buttons, button and toggle groups, Fabs, text fields, selects, autocompletes, checkboxes, radios, switches, sliders, ratings, chips, tables and pagination. It's MUI's default everywhere (the `medium-size` departure makes it Fab's too), so leave `size` off.

- **One-offs only.** Set `small` or `large` on a single instance that needs it, such as one control squeezed into a table cell, and say why in a comment. Don't make another size the pattern for a screen, a section or a component type.
- **Don't write the default.** `size="medium"` is noise; leave it out.
- **One size per group.** Controls that sit together (a toolbar, a form row, a filter bar) share one size, so an override applies to the whole group or not at all.

## Typography

Foundations → Typography lists every variant's computed size, weight, line height and letter spacing, read from the running theme. Take type from those variants; never set a size, weight or tracking of your own.

- **A compact heading scale.** `h1` to `h6` run 32, 28, 24, 20, 18 and 16px (the `type-scale` departure), sized for product screens rather than MUI's marketing-page headings. Body, caption, button and input sizes stay MUI's. Pick a heading by its place in the page, and set the HTML element with `component` when it differs from the variant: `<Typography variant="h5" component="h2">`. Don't set `fontSize` on a heading to resize it; pick another variant.
- **Antialiased rendering.** MUI's CssBaseline sets `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` on the page, so text renders thinner and crisper on macOS. It's stock MUI, not a departure: render every app under `MuiProvider`, which includes CssBaseline, and never override font smoothing. A surface rendered outside it (an iframe, a portal into another document) needs MUI's `ScopedCssBaseline`.
- **Tabular numerals.** Digits that line up in a column or change in place use tabular figures, each the same width. Table cells, pagination, badges, chips and slider labels get them from the theme (the `tabular-numerals` departure). Anywhere else a number is data rather than part of a sentence (a KPI, a meter reading, a timer, a column of figures in your own layout), add `sx={{ fontVariantNumeric: 'tabular-nums' }}`. Leave numbers in running text proportional.
- **Wrapping.** Headings balance their lines and body text avoids a lone last word (the `text-wrap` departure). Don't override `textWrap` per instance.
- **One weight for type styles.** Every `Typography` variant is regular (400, the `regular-weight` departure); size and color carry hierarchy. Don't set `fontWeight` on a variant to emphasize it; pick another variant, or use `strong` (`fontWeightBold`) for emphasis within text.
- **No faux styles.** Roboto is loaded at 300, 400, 500 and 700, with no italics, and the browser doesn't fake the rest (the `font-synthesis` departure). Use only the theme's weights (`fontWeightLight` to `fontWeightBold`). Don't rely on italic for emphasis; use weight or wording.
- **Inputs stay at 16px.** MUI's inputs use `body1` (16px), which keeps Safari on iOS from zooming the page when a field is focused. Don't set a smaller type style on an input, and never cap zoom with `maximum-scale` in the viewport tag.

## Content and layout

- **Line length.** Cap long-form text (guide pages, long descriptions, empty-state explanations) at 60ch to 75ch: `sx={{ maxWidth: '65ch' }}`. Labels, table cells and other UI text don't need a cap.
- **Typographic punctuation.** Write copy with the real characters: curly quotes and apostrophes (“ ” ’), an en dash for ranges (9:00–17:00, Jan–Mar), an em dash to set off a thought, and the ellipsis character (…) instead of three periods. Straight quotes belong only in code. Use a non-breaking space between a value and its unit where a break would split them (`12&nbsp;kWh`).
- **Truncation keeps the full value.** Truncate with MUI's `noWrap` on `Typography`, or clamp to a number of lines, rather than letting text overflow its container. Anything clipped must be readable another way: a `Tooltip` with the full text, an expanded view, or the detail page it links to. `TruncatedText` (`src/components/TruncatedText`) does both for one line of text.
- **Locale formatting.** Format numbers, units, currency, dates and times with `Intl` (`Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`) in the user's locale. Never build them by hand (`value.toFixed(2) + ' kWh'`, `'$' + amount`, `month + '/' + day`). A building's local time zone applies to its readings; say which zone a time is in when it isn't the user's.

## Motion

- **Respect reduced motion.** When the user asks for reduced motion, CssBaseline ends every CSS transition at once and stills the touch ripple (the `reduced-motion` departure). An animation in JavaScript (a chart's entrance, a counter running up) checks `useMediaQuery('(prefers-reduced-motion: reduce)')` and jumps to its end state. Progress indicators and skeletons keep moving: the motion is the information.

## Charts

Every way Kilowatt's charts differ from stock amCharts is listed in Foundations → amCharts departures (`src/charts/departures.ts`), and each chart's page lists its own. Charts use amCharts 5, the library Enertiv's app is built on, inside MUI's outlined `Card` (`variant="outlined"`): `CardHeader` for the title and actions, then the chart straight in the card, padding itself through the chart's `inset`: 16px at the sides and bottom by default, in line with the title and `CardContent`; 8px for a tighter fit; 0 to run edge to edge. The period is set for the whole page, and units sit with the numbers (Units, below), so chart headers have no subtitle. amCharts draws on a canvas and doesn't read the MUI theme, so one Kilowatt theme function turns the palette into an amCharts theme, and every chart's root goes through it.

**Where charts live.** Kilowatt holds the reference: the conventions, the theme function and a reference implementation of each chart type, with stories in the Charts section of Storybook. Enertiv's app is where charts ship; its chart components are rebuilt from Kilowatt's references, not imported from Kilowatt. Keeping the two in step is not set up yet.

**In code.** The roles are `palette.chart.series`, `palette.chart.neutral` and `palette.chart.sequential` (the `chart-palette` departure). Run every chart through `useChart` from `src/charts/useChart`: it applies `chartThemes` for the active scheme and hands `build` the colors for a series that takes a slot. Card → Chart is the reference. When an existing chart doesn't fit these rules, redesign the chart rather than adding a color.

- **Color does four jobs, and only these.** Telling categories apart: `chart.series`, six hues in a fixed order. Magnitude: `chart.sequential`, the steps of one ramp, light to dark. Deviation from a midpoint: `success` and `error` either side of a neutral. Status: the intents (`info`, `warning`, `error`, `success`), as everywhere else. Plus `chart.neutral` for whatever isn't the focus: a baseline, the previous period, the other series.
- **Meaning is an assignment, not a color.** A product meaning (a utility type, occupancy, a work-order type) maps to a `chart.series` slot once, in product code, so it's the same color everywhere. The palette has no `chart.electricity` or `chart.gas`. Kilowatt keeps the reference assignments in `src/charts/meanings.ts` (utility types and work-order types to slots, work-order statuses to intents, and `scoreBands` for 0–100 scores), keyed on the API's names, never on translated labels.
- **Variants don't get colors.** Two versions of one series (supply and delivery, actual and forecast) share its hue and differ by dash pattern, stack position or a direct label.
- **Six series at most.** Past six, group the smallest into "Other", split the chart, or show a table. Don't extend the palette.
- **Highlight, don't rainbow.** When one series is the point (this period against a baseline), draw it in a series hue and the rest in `chart.neutral`.
- **The chart's chrome uses roles that already exist.** Labels and ticks: `text.secondary` in the `caption` style. Gridlines and axes: `border.level1` and `border.level2`. Tooltips: the menu surface (`background.level3`) with `text.primary`. Range bands (weekends, schedules): `action.hover`. Target lines: `text.secondary`, dashed. There are no chart-only tokens for these.
- **Colors come from the theme, never from the chart.** Chart code doesn't call `am5.color()` with a hex value or a ramp step. Data takes its color from the series order or a slot number; everything else comes from the theme function.
- **Both schemes.** amCharts applies a theme when it builds a chart, so a chart rebuilds with the other scheme's theme when the color scheme changes.
- **Motion.** The amCharts animation theme is added only when the user hasn't asked for reduced motion (Motion above).
- **Not color alone.** Prefer direct labels to a legend. Give every chart a text alternative: a one-line summary of what it shows, as the accessible name of the `figure` around it (not shown on screen), or the data as a table.
- **Units sit with the numbers.** A unit goes where its values are read, never in the card header: above its value axis, read horizontally and left-aligned with the axis's numbers (`axisUnit` from `src/charts/theme`), and in the tooltip after each value. A headline number above the chart carries its unit too.
- **Value axes.** A chart with one value axis puts it on the right; a two-unit chart puts its first unit on the left and its second on the right. Axis numbers are left-aligned on both sides, so a left axis's numbers and unit line up with the card's title; compact numbers are short enough that none sits far from the plot.
- **Axis numbers are compact; everything else is full.** Value axes write numbers in `Intl.NumberFormat`'s compact notation in the viewer's locale (1.5K, 60K, 1.2M), which `useChart` sets as the chart's default number format (`axisNumberFormat`). Tooltips, headline numbers, tables and the chart's summary show the full value (61,240 kWh). Because the axis rounds, every chart item a pointer can rest on (a line point, a column, a slice) has a tooltip with its exact value and unit, written with `tooltipNumberFormat` from `src/charts/theme`. Don't set a number format on an axis.
- **Two units at most.** A chart with two units (energy and outdoor temperature) has two value axes, each labeled with its unit, and each series names its unit in the legend ("Energy use (kWh)"), so a line isn't tied to its axis by color alone. `LineChart` does this with `rightUnit` and `right` lines (Charts → Line → Two units). Past two units, split the chart into small multiples. Convert one quantity to one unit (kW, not kW and MW) rather than adding an axis.
- **Contrast.** Every `chart.series` color and `chart.neutral` reach 3:1 on every surface level, and every pair of them stays apart under normal vision and simulated protanopia, deuteranopia and tritanopia; `departures.test.ts` checks both. Series and status colors can't all be kept apart (status takes red, orange, purple and green), so don't mix them in one chart: color a chart either by series or by status.

## Maps

Every way Kilowatt's maps differ from stock CARTO is listed in Foundations → CARTO departures (`src/maps/departures.ts`). Maps use MapLibre GL with CARTO's vector basemaps, Positron in light and Dark Matter in dark, and deck.gl for the data drawn on them. MapLibre draws the basemap from a style file that doesn't read the MUI theme, so one Kilowatt theme function rewrites CARTO's style from the palette, and every map loads its basemap through it.

**Where maps live.** As with charts, Kilowatt holds the reference: the conventions, the theme function and a reference implementation of each map type, with stories in the Maps section of Storybook (`SiteMap` so far). Enertiv's app rebuilds its maps from them rather than importing them. A new reference map adds its name to `MapName` in `src/maps/departures.ts`, and the conventions that name it are then checked against its source and its page.

**Keys.** The basemaps are public and need no key. CARTO's platform APIs (deck.gl's CARTO data sources, `fetchMap`) take the access token in `VITE_CARTO_API_KEY` (`.env.local`, see `.env.example`), read through `cartoAccessToken` in `src/maps/carto`. Vite puts it in the browser bundle and Storybook is public, so it must be a token scoped to read only what maps show.

**In code.** `SiteMap` (Maps → Site map) is the reference. Load the basemap with `basemapStyle(scheme)` from `src/maps/theme`, which fetches CARTO's style for the scheme and applies the theme, and pass it to MapLibre's `style` (or `setStyle` when the scheme changes). Take data colors from `mapColors(scheme)`, which gives the palette's chart roles as the RGBA arrays deck.gl takes. Map code never sets a basemap paint property or a color of its own.

- **The basemap uses roles that already exist.** Land is the card surface the map sits on (`background.level1`), so a map runs edge to edge in its card with no seam. Buildings and road fills are a level up (`background.level2`), road edges `border.level0`, boundaries `border.level1`, labels `text.secondary` haloed in the land color. Water is the one map role, `map.water` (the `map-palette` departure): a step of the surface ramp past the land, with no hue of its own, so it can't be mistaken for data.
- **Data takes the chart roles, and the chart rules.** Categories: `series`, six at most. Magnitude (a choropleth, a heat map): `sequential`, passed as `colors` to CARTO's `colorBins` or `colorContinuous` in place of a CARTOColors scheme. Deviation: `below` and `above` (`error` and `success`). Status: the intents. What isn't the focus: `neutral`. Don't mix series and status colors on one map, and redesign a map that needs another color rather than adding one (Charts above).
- **Contrast.** Every series color and the neutral reach 3:1 on the land, water and buildings, and labels 4.5:1 on the land and water, in both schemes; `src/maps/departures.test.ts` checks both. That's why light water stops at slate 700.
- **In a card.** A map sits in an outlined `Card` under a title-only `CardHeader`, edge to edge below it and clipped to the card's corners (Concentric corners above), like a chart run at `inset` 0.
- **Controls are MUI.** Zoom in, zoom out and recenter are `IconButton`s with `Icon` and an `aria-label`, not MapLibre's `NavigationControl`. Leave the scroll to the page: maps turn on `cooperativeGestures`, so zoom takes Ctrl or ⌘ with the wheel.
- **Keep the attribution.** CARTO's terms and OpenStreetMap's license require their credit. Show it with `attributionControl: { compact: true }`; never remove it.
- **Tooltips.** Every item a pointer can rest on (a site, a region) has a tooltip on the menu surface with its name and exact value and unit, written with `Intl`.
- **Not color alone, and not the map alone.** Name the map's `figure` with a one-line summary (`aria-label`), and make what it shows available as a list or table, since a map is hard to use by keyboard or screen reader.
- **Motion.** MapLibre already jumps camera moves (`flyTo`, `easeTo`) to their end under `prefers-reduced-motion` unless they're marked `essential`; don't mark them.
- **Labels in Roboto.** MapLibre draws labels from glyph files, and CARTO's font server has no Roboto, so Kilowatt serves Roboto Regular and Medium itself (`src/maps/fonts`, at `/map-fonts/` in Storybook) and sets every label in them, upright (the `basemap-label-font` departure). Chinese, Japanese and Korean names use the viewer's system font. An app that rebuilds the maps hosts the same folder and passes its glyphs URL to `basemapStyle(scheme, glyphs)`; other scripts (Arabic, Hebrew) would need Noto's glyphs added beside Roboto's.
- **License.** CARTO's basemaps are free only within CARTO's terms for their use; check Enertiv's CARTO plan before a map ships in the app.

## Adding a convention

A convention is anything that differs from MUI's default: a theme value, a default prop, or a rule about how a component is used. To add one:

1. Add an entry to `src/mui/departures.ts` with the reason. Theme changes go in `options`; anything outside the theme goes in `convention`, saying what MUI does, what Kilowatt does instead and where. List the MUI components it changes in `components` (leave it out only for a theme-wide change), and add the departure to each of those components' pages under MUI departures.
2. Don't set theme values anywhere else. `departures.test.ts` fails when the theme differs from stock MUI anywhere a departure doesn't claim.
3. Check that the new convention doesn't overlap an existing one. If two entries touch the same thing, merge them.

Charts work the same way against amCharts' defaults, in `src/charts/departures.ts` (Foundations → amCharts departures):

1. Add an entry with the reason and the reference charts it changes (`charts`). A `theme` entry sets amCharts rules in `apply`, and `chartThemes` is built from these entries, so don't call `theme.rule` anywhere else. A `convention` entry is something each chart does in its own code: say what amCharts does, what Kilowatt does instead and where, and give a `check` that every chart it names matches.
2. Add it to each named chart's page under amCharts departures, right after MUI departures. `src/charts/departures.test.ts` and `src/charts/docs.test.ts` fail when the theme, a chart or a page doesn't match the list.
3. A chart's own design (grouping into Other, striped columns, two units) is a feature, not a departure; it goes in the chart page's Variants.

Maps work the same way against CARTO's basemaps and deck.gl's defaults, in `src/maps/departures.ts` (Foundations → CARTO departures):

1. Add an entry with the reason. A `theme` entry changes basemap layers in `apply`, picking them by what they draw (`layers('water')`, from `basemapFeature`), and `basemapTheme` is built from these entries, so don't set a basemap paint property anywhere else. A `convention` entry is something each map does in its own code: say what CARTO or MapLibre does, what Kilowatt does instead and where, name the reference maps it applies to in `maps`, and give a `check` that every map it names matches.
2. A color the basemap needs that no role covers is a palette departure in `src/mui/departures.ts`, as `map-palette` is, not a value in `src/maps`. `src/maps/departures.test.ts` fails when the basemap paints a color that isn't from the palette, or a CARTO layer isn't mapped to a feature.

## Icons

- Use `<Icon name="…" />` from `src/icons`: Material Symbols Outlined, Google's variable icon font, through MUI's `Icon`. It renders outlined at weight 300. Size and color are MUI's `fontSize` and `color` props. Pass `weight` or `fill` only for a reason, and never write a ligature or an SVG by hand.
- A selected control fills its icons through the theme (`ToggleButton`, `Tab`, `ListItemButton`, `MenuItem`, `BottomNavigationAction`). Don't pass `fill={selected}` yourself.
- Icons are decorative (`aria-hidden`). An icon-only control needs an `aria-label`.

## Accessibility

- Every control has a visible focus state and an accessible name.
- **Hit areas.** Every pointer target is at least 24×24px (WCAG 2.2); aim for 32×32px on desktop and 44×44px on touch screens. MUI's medium controls meet this; a small one-off control needs a larger hit area around it, not a smaller one. Items in a list or menu touch, with no dead gap between them where a click lands on nothing (MUI's `List` and `Menu` already do this).
- **Not color alone.** Color never carries meaning by itself. Pair it with text or an icon: an invalid field shows `error` plus `helperText` saying what's wrong, a status chip has a label, a chart series has a legend or direct label.
- **Announce what changes on its own.** A result that appears without moving focus ("Copied", "Saved", "Export ready") reaches screen readers: show it in MUI's `Snackbar` or `Alert`, or put it in an `aria-live="polite"` region. Use `assertive` only for something that hurts if it arrives late, such as a session about to expire.
- Every story runs an axe check in the story tests, and a violation fails it.

## Before a screen is done

Check every screen against this list before review. Each line points back to the rule it summarizes.

- [ ] It renders under `MuiProvider` and builds with MUI components and documented props ([Build with MUI as MUI documents it](#build-with-mui-as-mui-documents-it)).
- [ ] Color, type, spacing, radius and elevation come from theme roles, with no hex values, pixel radii, font sizes or font families of its own ([Token tiers](#token-tiers)).
- [ ] Surfaces use `background.level*` and `border.level*`, with one border per edge and concentric corners ([Surfaces and borders](#surfaces-and-borders), [One border per edge](#one-border-per-edge), [Concentric corners](#concentric-corners)).
- [ ] Text uses Typography variants, and numbers that are data use tabular figures ([Typography](#typography)).
- [ ] It works in light and dark, and its transitions still under `prefers-reduced-motion` ([Motion](#motion)).
- [ ] Every control has a visible focus state, an accessible name and a 24px hit area, and no meaning rests on color alone ([Accessibility](#accessibility)).
- [ ] Its loading, empty, error and partial-data states each show something true, never a blank or misleading view.
- [ ] Lint, the type-check and the tests pass (in this repository: `npm run lint`, `npx tsc --noEmit -p .storybook` and `npm test`).
