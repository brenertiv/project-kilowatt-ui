import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { Icon } from '../icons';

/**
 * A month's state in a feed. `complete`: its data arrived, every source reported. `partial`: some sources did.
 * `estimated`: the data arrived as its source's estimate. `gap`: none arrived, the month is missing. `vacant`: the space
 * was vacant, so none is expected. `overlap`: two sources reported the same month. `not-sold`: the month is outside the
 * sold scope. `awaiting`: a month after the latest entry that is still within the billing lag, so no data yet.
 */
export type MonthState = 'complete' | 'partial' | 'estimated' | 'gap' | 'vacant' | 'overlap' | 'not-sold' | 'awaiting';

/** Every state in the legend's order, with the name the legend gives it. */
const stateLabels: [MonthState, string][] = [
  ['complete', 'Complete'],
  ['partial', 'Partial'],
  ['estimated', 'Estimated'],
  ['gap', 'Gap'],
  ['vacant', 'Vacant'],
  ['overlap', 'Overlap'],
  ['not-sold', 'Not in sold scope'],
  ['awaiting', 'Awaiting'],
];

export type MonthBarsProps = {
  /** One state per month of the period, oldest first. Past 24 months the bars are too thin to read, and the count of complete months stands in. */
  months: MonthState[];
  /** One sentence with the numbers: the strip's tooltip and its accessible name, `Electricity, Jan–Dec 2025: 10 of 12 months complete; no data in March.` */
  summary: string;
  /**
   * What stands in place of the bars, for a feed that isn't counted: `Not applicable` for a utility the property
   * doesn't have. No bars are drawn, so it never looks like a problem. Default none: the bars.
   */
  placeholder?: string;
  /**
   * A label over the bars, every month drawn as a gap: `No source` for a feed the property has but nothing is
   * connected for. Default none.
   */
  overlay?: string;
  /** Whether the strip fills its row, the bars sharing the width, so strips in a card line up on one month axis. Default `false`: 4px bars, for a table cell. */
  stretch?: boolean;
  /** Whether the strip takes keyboard focus. Default `true`; `false` inside a clickable card, whose button can't hold a focusable element (its tooltip still shows on hover, and the card carries the summary). */
  focusable?: boolean;
};

/** Past this many months a bar is too thin to read, and the count stands alone. */
const mostBars = 24;

/**
 * A bar's box by its state, each a fixed drawing so the color never stands alone: a solid bar for Complete and
 * Estimated (`success`) and for Partial (`warning`), an empty cell for a Gap (its dash is `glyph`'s), a hatched cell
 * for Vacant, two stacked bars for an Overlap, a dotted outline for Not in sold scope and a dashed one for Awaiting.
 */
function fill(theme: Theme, state: MonthState) {
  const { palette } = theme.vars ?? theme;
  const outline = { border: 1, borderColor: palette.text.secondary, boxSizing: 'border-box' as const };
  switch (state) {
    case 'complete':
    case 'estimated':
      return { bgcolor: palette.success.main };
    case 'partial':
      return { bgcolor: palette.warning.main };
    case 'gap':
      return {};
    case 'vacant':
      return {
        ...outline,
        backgroundImage: `repeating-linear-gradient(135deg, ${palette.text.secondary} 0 1px, transparent 1px ${theme.spacing(0.5)})`,
      };
    case 'overlap':
      // Two stacked bars: two fills with the surface showing between them.
      return {
        backgroundImage: `linear-gradient(to bottom, ${palette.warning.main} 0 45%, transparent 45% 55%, ${palette.warning.main} 55% 100%)`,
      };
    case 'not-sold':
      return { ...outline, borderStyle: 'dotted' };
    case 'awaiting':
      return { ...outline, borderStyle: 'dashed' };
  }
}

/**
 * What a state draws inside its box: a gap's dash at any width and, where the bar is wide enough to hold them (`wide`:
 * a stretched strip, the legend), the est. tag of an estimated month and an overlap's warning glyph.
 */
function glyph(state: MonthState, wide: boolean): ReactNode {
  if (state === 'gap')
    return (
      <Box
        sx={{ position: 'absolute', left: '15%', right: '15%', top: '50%', height: '1px', bgcolor: 'text.secondary' }}
      />
    );
  if (!wide) return null;
  const centred = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as const;
  if (state === 'estimated')
    return (
      <Typography component="span" variant="caption" sx={{ ...centred, lineHeight: 1, color: 'success.contrastText' }}>
        est.
      </Typography>
    );
  if (state === 'overlap')
    return (
      <Box sx={{ ...centred, color: 'warning.contrastText' }}>
        <Icon name="warning" sx={{ fontSize: (t) => t.spacing(1.5) }} />
      </Box>
    );
  return null;
}

/**
 * One bar per month of a period, showing how completely a feed reported in each, every bar the same height so it reads
 * as the state of the data, not as usage. Each state has a fixed drawing beyond its color, the same for every feed:
 * Complete is a solid `success` bar, Partial a solid `warning` bar, Estimated a solid bar with a small est. tag, a Gap
 * an empty cell with a dash (a mark, not a hole the eye skips), Vacant a hatched cell, an Overlap two stacked bars with
 * a warning glyph, Not in sold scope a dotted outline, and Awaiting a dashed one. The est. tag and the warning glyph
 * need a wide bar, so they show in a stretched strip and the legend; in a table cell's 4px bars the sentence carries
 * them. `placeholder` replaces the bars for a feed that isn't counted; `overlay` draws every month as a gap and labels
 * the strip. The `summary` sentence is the tooltip and the accessible name. Built from MUI's `Box`: a table of 48
 * properties by four feeds is 192 strips, too many canvases.
 *
 * @summary A strip of equal bars, one per month, each drawn by how completely a feed reported.
 * @import import { MonthBars, MonthBarsLegend } from 'src/components/MonthBars';
 */
export function MonthBars({
  months,
  summary,
  placeholder,
  overlay,
  stretch = false,
  focusable = true,
}: MonthBarsProps) {
  const strip = months.length <= mostBars;
  const complete = months.filter((state) => state === 'complete').length;
  return (
    <Tooltip title={summary}>
      {/* The strip repeats what the summary says, so screen readers get the sentence once, as the figure's name. */}
      <Box
        component="figure"
        aria-label={summary}
        tabIndex={focusable ? 0 : undefined}
        sx={{
          position: 'relative',
          display: stretch ? 'flex' : 'inline-flex',
          flex: stretch ? 1 : undefined,
          minWidth: 0,
          alignItems: 'center',
          m: 0,
          borderRadius: 0.5,
          '&:focus-visible': { outline: (t) => `2px solid ${(t.vars ?? t).palette.control.focus}`, outlineOffset: 2 },
        }}
      >
        {placeholder ? (
          // No bars at all: the slot keeps the strip's height, so the row stays in line with the others.
          <Typography
            component="span"
            variant="caption"
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: stretch ? 1 : undefined,
              height: (t) => t.spacing(stretch ? 2 : 3),
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {placeholder}
          </Typography>
        ) : strip ? (
          <Box
            aria-hidden
            sx={{
              display: 'flex',
              flex: stretch ? 1 : undefined,
              alignItems: 'flex-end',
              gap: 0.25,
              height: (t) => t.spacing(stretch ? 2 : 3),
            }}
          >
            {months.map((state, i) => (
              <Box
                key={i}
                sx={(t) => ({
                  position: 'relative',
                  width: stretch ? undefined : t.spacing(0.5),
                  flex: stretch ? 1 : undefined,
                  minWidth: stretch ? 2 : undefined,
                  height: '100%',
                  borderRadius: 0.125,
                  ...fill(t, overlay ? 'gap' : state),
                })}
              >
                {glyph(overlay ? 'gap' : state, stretch)}
              </Box>
            ))}
          </Box>
        ) : (
          // A period too long to draw: the count stands in for the strip.
          <Typography
            component="span"
            variant="caption"
            sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
          >
            {overlay ?? `${complete}/${months.length}`}
          </Typography>
        )}
        {overlay && strip && !placeholder && (
          // The label sits over the strip of gaps, on the card's surface so it reads.
          <Typography
            component="span"
            variant="caption"
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              '& > span': { bgcolor: 'background.level3', px: 0.5, borderRadius: 0.5 },
            }}
          >
            <span>{overlay}</span>
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

export type MonthBarsLegendProps = {
  /** Drops the row's padding, for a toolbar or a caption beside a grid. Default `false`: 16px of padding, for the row under a table. */
  inline?: boolean;
};

/**
 * The key for `MonthBars`: every state's drawing, named, for the row under a table of month bars or beside a grid of them.
 *
 * @summary The legend for MonthBars: each state's drawing with its name.
 * @import import { MonthBarsLegend } from 'src/components/MonthBars';
 */
export function MonthBarsLegend({ inline = false }: MonthBarsLegendProps) {
  return (
    <Box
      component="ul"
      aria-label="How the month bars read"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
        listStyle: 'none',
        m: 0,
        p: inline ? 0 : 2,
      }}
    >
      {stateLabels.map(([state, label]) => (
        <Box component="li" key={state} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            aria-hidden
            sx={(t) => ({
              position: 'relative',
              width: t.spacing(3.5),
              height: t.spacing(2),
              borderRadius: 0.125,
              ...fill(t, state),
            })}
          >
            {glyph(state, true)}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
