import { useId, useState, type ReactNode } from 'react';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Icon } from '../icons';

/** Where a figure comes from, each as one short line. `SourceFigure`'s dialog lists them in this order. */
export type FigureSource = {
  /** Where the data comes from: “Utility bills, then interval meter data where no bill covers the period”. */
  source: string;
  /** The period the figure covers: “January–December 2025”. */
  period: string;
  /** How the figure is worked out from the data. */
  calculation: string;
  /** What the figure counts: which properties, meters or areas. */
  scope: string;
  /** How much of the scope has data, and what is left out. */
  coverage: string;
  /** When the data was last updated, formatted with `Intl.DateTimeFormat`. */
  updated: string;
};

const labels: Record<keyof FigureSource, string> = {
  source: 'Source',
  period: 'Period',
  calculation: 'Calculation',
  scope: 'Scope',
  coverage: 'Coverage',
  updated: 'Last updated',
};

/** A value longer than this (a phrase rather than a number) steps down from `h2` to `h4`, so it still fits on a card. */
const longValue = 14;

/** The headline number as it reads on a card: `h2` with tabular numerals (`h4` for a long phrase), the unit after it in `body1`. */
function FigureText({ value, unit, underline }: { value: string; unit?: string; underline: boolean }) {
  return (
    <Typography
      variant={value.length > longValue ? 'h4' : 'h2'}
      component="span"
      sx={{
        fontVariantNumeric: 'tabular-nums',
        ...(underline && {
          textDecorationLine: 'underline',
          textDecorationColor: (theme) => (theme.vars ?? theme).palette.border.level2,
          textDecorationThickness: '1px',
          textUnderlineOffset: '0.18em',
        }),
      }}
    >
      {value}
      {unit && (
        // Inline-block, so the number's underline doesn't run under the unit. The margin stands in for the
        // no-break space a plain figure would use, which an inline-block would drop at the line's edge.
        <Typography component="span" variant="body1" sx={{ color: 'text.secondary', display: 'inline-block', ml: 0.5 }}>
          {unit}
        </Typography>
      )}
    </Typography>
  );
}

export type ExplainedFigureProps = {
  /** The card's title: the dialog's title, and part of the figure's accessible name and tooltip. */
  title: string;
  /** The figure, already formatted with `Intl.NumberFormat`. Longer than 14 characters, it steps down from `h2` to `h4`. */
  value: string;
  /** The unit, shown after the value in `body1` and `text.secondary`. Defaults to none. */
  unit?: string;
  /** What explains the figure: the dialog's content. */
  children: ReactNode;
  /** Where View Sources goes, after the dialog closes. Defaults to none, and the action isn't shown. */
  onViewSources?: () => void;
};

/**
 * A headline number that opens what explains it. The number is a button with a faint `border.level2`
 * underline under the number (not the unit) and the theme's `action.hover` tint on hover; it opens a
 * `Dialog` titled with the card's title that holds the explanation. Use it for any figure a card would
 * otherwise clarify with a caption under it; `SourceFigure` fills the dialog with where the figure comes
 * from, and `PlainFigure` sets a figure with nothing to explain in the same type.
 *
 * @summary A card's headline number as a button that opens a dialog explaining it.
 * @import import { ExplainedFigure } from 'src/components/SourceFigure';
 */
export function ExplainedFigure({ title, value, unit, children, onViewSources }: ExplainedFigureProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = () => setOpen(false);
  return (
    <>
      <Tooltip title={`View source: ${title}`}>
        <ButtonBase
          focusRipple
          // The visible figure leads the name, so speech input can say what's on screen.
          aria-label={`${unit ? `${value} ${unit}` : value}, view source for ${title}`}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          sx={{
            borderRadius: 1,
            textAlign: 'start',
            // Sized to the figure and set at the start, whatever the card's layout around it.
            alignSelf: 'flex-start',
            justifyContent: 'flex-start',
            // A little room either side, so the hover tint clears the text, without moving the figure.
            mx: -0.5,
            px: 0.5,
            transition: (theme) => theme.transitions.create('background-color', { duration: theme.transitions.duration.shortest }),
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <FigureText value={value} unit={unit} underline />
        </ButtonBase>
      </Tooltip>
      <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby={titleId}>
        {/* Room on the right for the close button. */}
        <DialogTitle id={titleId} sx={{ pr: 7 }}>
          {title}
        </DialogTitle>
        {/* MUI's documented close button for a dialog (Dialog › Customization). */}
        <IconButton aria-label="Close" onClick={close} sx={{ position: 'absolute', top: (theme) => theme.spacing(1), right: (theme) => theme.spacing(1) }}>
          <Icon name="close" />
        </IconButton>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          {onViewSources && (
            <Button
              onClick={() => {
                close();
                onViewSources();
              }}
            >
              View Sources
            </Button>
          )}
          <Button onClick={close}>Done</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export type PlainFigureProps = {
  /** The figure, already formatted with `Intl.NumberFormat`. Longer than 14 characters, it steps down from `h2` to `h4`. */
  value: string;
  /** The unit, shown after the value in `body1` and `text.secondary`. Defaults to none. */
  unit?: string;
};

/**
 * A headline number with nothing to explain: the same type as `ExplainedFigure` (`h2` with tabular
 * numerals, the unit after it in `body1` and `text.secondary`), as a paragraph rather than a control.
 *
 * @summary A card's headline number, with its unit, that isn't a control.
 * @import import { PlainFigure } from 'src/components/SourceFigure';
 */
export function PlainFigure({ value, unit }: PlainFigureProps) {
  return (
    <Typography component="p" sx={{ m: 0 }}>
      <FigureText value={value} unit={unit} underline={false} />
    </Typography>
  );
}

export type SourceFigureProps = {
  /** The card's title: the dialog's title, and part of the figure's accessible name and tooltip. */
  title: string;
  /** The figure, already formatted with `Intl.NumberFormat`. Longer than 14 characters, it steps down from `h2` to `h4`. */
  value: string;
  /** The unit, shown after the value in `body1` and `text.secondary`. Defaults to none. */
  unit?: string;
  /** Where the figure comes from: the dialog lists it as Source, Period, Calculation, Scope, Coverage and Last updated. */
  source: FigureSource;
  /** What clarifies the number (what it counts, how sure it is), at the top of the dialog; an array shows one line each. Defaults to none. */
  note?: string | string[];
  /** Where View Sources goes, after the dialog closes. Defaults to none, and the action isn't shown. */
  onViewSources?: () => void;
};

/**
 * A headline number that opens its source: an `ExplainedFigure` whose dialog says where the figure
 * comes from, as a description list (Source, Period, Calculation, Scope, Coverage, Last updated), with
 * an optional note above it and an optional View Sources action. The card carries no caption under the
 * figure; what would have gone there goes in `note`.
 *
 * @summary A card's headline number that opens a dialog with its source, period, calculation and coverage.
 * @import import { SourceFigure } from 'src/components/SourceFigure';
 */
export function SourceFigure({ title, value, unit, source, note, onViewSources }: SourceFigureProps) {
  const lines = note === undefined ? [] : Array.isArray(note) ? note : [note];
  return (
    <ExplainedFigure title={title} value={value} unit={unit} onViewSources={onViewSources}>
      <Stack sx={{ gap: 2 }}>
        {lines.length > 0 && (
          <Stack sx={{ gap: 0.5 }}>
            {lines.map((line) => (
              <Typography key={line} variant="body2">
                {line}
              </Typography>
            ))}
          </Stack>
        )}
        <Stack component="dl" sx={{ gap: 1.5, m: 0 }}>
          {(Object.keys(labels) as (keyof FigureSource)[]).map((key) => (
            <div key={key}>
              <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
                {labels[key]}
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                {source[key]}
              </Typography>
            </div>
          ))}
        </Stack>
      </Stack>
    </ExplainedFigure>
  );
}
