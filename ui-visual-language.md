# Operations UI Visual Language

## Design intent

A calm, high-density operations dashboard. The interface stays mostly monochrome so that one saturated blue accent can communicate selection, focus, and priority. Information is structured in a clear desktop app shell with compact controls and generous breathing room inside cards.

## Foundations

| Element | Direction |
|---|---|
| App background | Cool, very light gray (`#F6F7F8`) |
| Card surface | White (`#FFFFFF`) |
| Borders | Fine, low-contrast gray (`#E7E8EA`) |
| Primary text | Near-black (`#111214`) |
| Secondary text | Medium gray (`#6F7277`) |
| Subdued text | Light gray (`#A9ADB3`) |
| Primary accent | Electric blue (`#1254F6`) |
| Blue tint | `#EAF0FF` |
| Positive state | Green (`#178A4D`) |

Use shadows sparingly. A one-pixel border and, at most, a very soft elevation shadow should define cards.

## Layout

- Use a persistent left rail at 56–72px wide for icon navigation.
- Add a labeled sidebar at 200–260px only when a workflow needs settings or secondary navigation.
- Keep the top bar slim: 56–64px, with global navigation and quiet account utilities.
- Build primary content from a 12px-gap card grid.
- Use 8–12px corner radii. The default should be 10px.

## Typography

- Use an Inter/SF-style sans serif.
- Give headings and metrics a near-black, medium-weight treatment.
- Keep labels compact and muted: typically 11–14px.
- Set key metrics at 28–36px with tabular numerals.
- Let spacing and weight—not heavy color or oversized text—create hierarchy.

## Components

### Cards

Cards group a metric, workflow step, or visualization. They should be functional containers rather than decorative panels.

- White surface, 1px soft-gray border, 10px radius.
- Internal padding: 16–20px.
- Card title: 14px medium weight.
- Place low-priority utility actions in a small outlined or ghost icon button at the upper right.

### Buttons and inputs

- Use softly bordered white controls for secondary actions and form inputs.
- Reserve solid black buttons for a singular high-commitment workflow action.
- Use blue for selected navigation, active state, and analytical focus.
- Keep controls compact; avoid oversized pill shapes.

### Navigation and icons

- Use simple 1.5–2px outlined icons.
- Active navigation is a blue filled tile with a white icon.
- Inactive icons are dark gray on an unfilled or subtly tinted surface.
- Pair unfamiliar icons with labels; do not rely on iconography alone.

## Data visualization rules

- Render the full context in pale neutral gray.
- Use blue on one selected, current, or exceptional series/value only.
- Pair blue with a direct label, tooltip, or selected-state treatment—never color alone.
- Use green only for favorable deltas or success states.
- Prefer sparse axes, soft gridlines, and direct KPI labels.
- Use blue arcs or rings for progress/status; keep the remainder of the track neutral.
- Avoid rainbow palettes, bold grids, and heavy chart containers.

## Reference card: Support traffic activity

**Purpose:** Summarize total ticket volume while making the currently important period obvious.

### Anatomy

1. Card title with optional overflow action.
2. Muted metric label: `Total tickets`.
3. Large tabular metric: `12,853`.
4. Small green delta with an upward trend icon: `5.6%`.
5. Compact bar chart: pale-gray bars for all periods, cobalt-blue bar for the focus period.
6. Small blue callout above the focused bar: `2,647`.
7. Quiet footer with focus legend and date range.

### Default measurements

| Property | Value |
|---|---:|
| Card radius | 10px |
| Card padding | 18px horizontal; 18px top; 15px bottom |
| Title to metric label | 24px |
| Metric label to value | 8px |
| Value to chart | 22px |
| Chart height | 92px |
| Bar corner radius | 1px |
| Card gap in a grid | 12px |

### States

- **Focused series:** One bar is electric blue; show its value callout and a small blue legend dot.
- **Neutral overview:** All bars are pale gray; remove the callout and legend emphasis.

## Guardrails

Do not introduce heavy shadows, glossy gradients, large rounded pills, decorative illustrations, or multiple competing accent colors. The blue should make the answer to “what is active or important?” visible at a glance.
