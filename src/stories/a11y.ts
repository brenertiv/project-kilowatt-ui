/**
 * axe rules every story runs with, on top of axe's defaults. `.storybook/preview.tsx` sets them
 * globally. A story that sets its own `a11y.config.rules` replaces this array rather than merging
 * with it, so story-level configs spread it first.
 */
export const a11yRules = [
  // Icons are Material Symbols ligatures: the glyph's text ("more_horiz") is not
  // what a sighted user sees, so axe's visible-label check misfires on icon buttons.
  { id: 'label-content-name-mismatch', enabled: false },
];

const contrastOff = { config: { rules: [...a11yRules, { id: 'color-contrast', enabled: false }] } };

/**
 * `parameters.a11y` for a story whose only axe failures are `color-contrast` between Figma-owned
 * semantic tokens, such as white on `successMain`. The fix is a Figma change and a re-snapshot,
 * not code, so the check stays off until then. Name the failing pair in a comment at each use, and
 * keep the list in docs/storybook-plan.md ("7. Phase 1 findings") in step: when the tokens pass,
 * delete the parameter.
 */
export const tokenContrast = contrastOff;

/**
 * `parameters.a11y` for a story that shows stale content while it refetches. `DataState` and
 * `StatCard` dim it to 60% opacity, which takes passing text tokens (such as `textSecondary`)
 * below 4.5:1. Whether to keep that dim is an open design decision in docs/storybook-plan.md
 * ("7. Phase 1 findings"); until it is made, the contrast check is off for these stories only.
 */
export const refreshDimContrast = contrastOff;
