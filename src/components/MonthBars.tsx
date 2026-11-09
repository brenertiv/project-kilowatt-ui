import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';

/**
 * How completely a feed reported in one month. `complete`: every source reported. `partial`: some did. `gap`: none did.
 * `awaiting`: a month after the latest entry that is still within the billing lag, so no data yet.
 */
export type MonthState = 'complete' | 'partial' | 'gap' | 'awaiting';

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
};

/** Past this many months a bar is too thin to read, and the count stands alone. */
const mostBars = 24;

/** A bar's look by its state: the status intents, the disabled background for a gap, and an outline alone for a month still awaited. */
function fill(theme: Theme, state: MonthState) {
  const { palette } = theme.vars ?? theme;
  if (state === 'complete') return { bgcolor: palette.success.main };
  if (state === 'partial') return { bgcolor: palette.warning.main };
  if (state === 'awaiting') return { border: 1, borderColor: palette.action.disabled, boxSizing: 'border-box' as const };
  return { bgcolor: palette.action.disabledBackground };
}

/**
 * One bar per month of a period, showing how completely a feed reported in each, every bar the same height so it reads
 * as the state of the data, not as usage. The state is the bar's color, by status, the same for every feed: Complete is
 * `success`, Partial `warning`, a Gap the disabled background (a mark, not a hole the eye skips), and Awaiting an
 * outline with no fill. `placeholder` replaces the bars for a feed that isn't counted; `overlay` greys every month and
 * labels the strip. The `summary` sentence is the tooltip and the accessible name, so the colors never stand alone.
 * Built from MUI's `Box`: a table of 48 properties by four feeds is 192 strips, too many canvases.
 *
 * @summary A strip of equal bars, one per month, colored by how completely a feed reported.
 * @import import { MonthBars, MonthBarsLegend } from 'src/components/MonthBars';
 */
export function MonthBars({ months, summary, placeholder, overlay, stretch = false }: MonthBarsProps) {
  const strip = months.length <= mostBars;
  const complete = months.filter((state) => state === 'complete').length;
  return (
    <Tooltip title={summary}>
      {/* The strip repeats what the summary says, so screen readers get the sentence once, as the figure's name. */}
      <Box
        component="figure"
        aria-label={summary}
        tabIndex={0}
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
          <Box aria-hidden sx={{ display: 'flex', flex: stretch ? 1 : undefined, alignItems: 'flex-end', gap: 0.25, height: (t) => t.spacing(stretch ? 2 : 3) }}>
            {months.map((state, i) => (
              <Box
                key={i}
                sx={(t) => ({
                  width: stretch ? undefined : t.spacing(0.5),
                  flex: stretch ? 1 : undefined,
                  minWidth: stretch ? 2 : undefined,
                  height: '100%',
                  borderRadius: 0.125,
                  ...fill(t, overlay ? 'gap' : state),
                })}
              />
            ))}
          </Box>
        ) : (
          // A period too long to draw: the count stands in for the strip.
          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {overlay ?? `${complete}/${months.length}`}
          </Typography>
        )}
        {overlay && strip && !placeholder && (
          // The label sits over the greyed strip, on the card's surface so it reads.
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
 * The key for `MonthBars`: a swatch per state, named, for the row under a table of month bars or beside a grid of them.
 *
 * @summary The legend for MonthBars: Complete, Partial, Gap and Awaiting.
 * @import import { MonthBarsLegend } from 'src/components/MonthBars';
 */
export function MonthBarsLegend({ inline = false }: MonthBarsLegendProps) {
  const swatch = (state: MonthState) => <Box aria-hidden sx={(t) => ({ width: t.spacing(1), height: t.spacing(1.5), borderRadius: 0.125, ...fill(t, state) })} />;
  const item = (mark: ReactNode, text: string) => (
    <Box component="li" key={text} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      {mark}
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {text}
      </Typography>
    </Box>
  );
  return (
    <Box component="ul" aria-label="How the month bars read" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, listStyle: 'none', m: 0, p: inline ? 0 : 2 }}>
      {item(swatch('complete'), 'Complete')}
      {item(swatch('partial'), 'Partial')}
      {item(swatch('gap'), 'Gap')}
      {item(swatch('awaiting'), 'Awaiting')}
    </Box>
  );
}
