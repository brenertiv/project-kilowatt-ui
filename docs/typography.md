# Typography

The type primitives as they stand: families, scale, line height and weight. Semantic roles are documented on the Foundations Typography page and are omitted here. Source of truth is `src/tokens.ts`; the stylesheet `:root` carries matching fallbacks.

## Families

| Token | Stack |
| --- | --- |
| `--font-sans` | Roboto, system-ui, sans-serif |
| `--font-serif` | "Roboto Serif", Georgia, serif |
| `--font-mono` | "Roboto Mono", ui-monospace, monospace |

All three load from Google Fonts.

## Scale

Nine fixed steps, each declared once in rem. The four largest also have a fluid variant that clamps between a floor and the fixed step.

| Step | Token | Fixed | Fluid token | Fluid value |
| --- | --- | --- | --- | --- |
| xxs | `--text-xxs` | 0.625rem, 10px | | |
| xs | `--text-xs` | 0.75rem, 12px | | |
| sm | `--text-sm` | 0.875rem, 14px | | |
| md | `--text-md` | 1rem, 16px | | |
| lg | `--text-lg` | 1.125rem, 18px | | |
| xl | `--text-xl` | 1.375rem, 22px | `--text-xl-fluid` | `clamp(1.25rem, 1.1rem + 0.5vw, 1.375rem)` |
| 2xl | `--text-2xl` | 1.75rem, 28px | `--text-2xl-fluid` | `clamp(1.5rem, 1.25rem + 0.8vw, 1.75rem)` |
| 3xl | `--text-3xl` | 2.125rem, 34px | `--text-3xl-fluid` | `clamp(1.75rem, 1.4rem + 1.2vw, 2.125rem)` |
| 4xl | `--text-4xl` | 2.75rem, 44px | `--text-4xl-fluid` | `clamp(2.25rem, 1.7rem + 1.8vw, 2.75rem)` |

Each fluid value reaches its ceiling where the middle term equals the fixed step: about 880px viewport width for xl, 1000px for 2xl, 966px for 3xl and 933px for 4xl. Below that it eases toward the floor. Fluid steps are for page-level hierarchy; dense UI uses the fixed steps.

## Line height

Line heights live in the stylesheet and the type roles rather than as tokens.

| Value | Where |
| --- | --- |
| 1.1 | Metrics and compact metrics |
| 1.2 | Titles |
| 1.3 | Card, dialog and popover titles |
| 1.4 | Labels, descriptions, eyebrows, tab panels |
| 1.5 | Body |
| 1 | Icons and single-line controls |

## Weight

Weights are not tokens. Hierarchy comes from size, color and position.

| Value | Where |
| --- | --- |
| 400 | Everything, including headings, metrics, table headers and `strong` |
| 500 | Section eyebrows, the selected tab, table column headers, avatar initials, the wordmark |

No 600 or 700 is used anywhere. The icon font carries its own `--icon-weight` at 400 to match text.

## Relation to Figma

Families and the xs through 4xl sizes match the Foundations file; xxs was adopted from it. The file's full style matrix, its flat line height, its 600 weights and its 32px `5xl` are deliberately not used.
