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
