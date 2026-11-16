import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Icon } from '../icons';

/** A source, or the data-health item behind what a number leaves out, as a link to its object. */
export type ProvenanceLink = {
  /** What the source is called, by type and name: “Harbor Point electricity bills”. */
  label: string;
  /** One line under it, such as when it was last updated. Defaults to none. */
  detail?: string;
  /** Where the link goes, passed to `onNavigate`. Defaults to none, and the label is plain text. */
  to?: string;
};

/** An emission factor a figure applies to one fuel, with where the factor comes from. */
export type ProvenanceFactor = {
  /** The fuel the factor applies to: “Electricity”. */
  fuel: string;
  /** The factor, already formatted, with its unit: “0.000233 tCO₂e/kWh”. */
  factor: string;
  /** Where the factor comes from: the published set it is taken from. */
  source: string;
  /** The year of the factor set: “2024”. */
  year: string;
};

/** The figures behind a calculation, for someone checking it: what Show the Figures lays out. */
export type ProvenanceFigures = {
  /** The formula with the values used, a line per step: “38,420 kWh × 0.000233 tCO₂e/kWh = 8.95 tCO₂e”. */
  formula: string[];
  /** For an emissions figure: the factor applied per fuel, with its source and year. Defaults to none. */
  factors?: ProvenanceFactor[];
  /** For an emissions figure: a link to the building's factors table. Defaults to none. */
  factorsTable?: ProvenanceLink;
};

/**
 * Where a number comes from, as data, so it can be stored with the message or record that cites it.
 * The popover shows the rows that apply, in this order, and leaves out the rest.
 */
export type Provenance = {
  /** Built From: each source by type and name, as a link where it has one. */
  builtFrom: ProvenanceLink[];
  /** Period, in the long-month format: “October 2026”. Defaults to none, and the row is left out. */
  period?: string;
  /** Calculation, as a sentence in plain words and units. */
  calculation: string;
  /** The formula with the values used, and an emissions figure's factors, under the calculation behind Show the Figures, folded until asked for. Defaults to none, and the control is left out. */
  figures?: ProvenanceFigures;
  /** Includes: how much of the scope is in the number and what is left out. Defaults to none, and the row is left out. */
  includes?: string;
  /** The data-health item behind what is missing, as a link under Includes. Defaults to none. */
  missing?: ProvenanceLink;
  /** Estimated by Source: which values are estimated and by which source, never “estimated” alone. Defaults to none, and the row is left out. */
  estimatedBySource?: string;
  /** Awaiting Bill: the bills still to come. Defaults to none, and the row is left out. */
  awaitingBill?: string;
  /** Last Updated, in epoch milliseconds; `null` when no date is recorded, which the row says in words. */
  updated: number | null;
  /** ENERGY STAR Last Push, for a number synced to ENERGY STAR. Defaults to none, and the row is left out. */
  energyStarPush?: string;
};

/** A number a sentence cites, with what it is and where it comes from. */
export type CitedFigure = {
  /** What the number is: “Monthly Electricity Spend”. It leads the popover's title and the button's name. */
  label: string;
  /** The number, already formatted with `Intl.NumberFormat`. */
  value: string;
  /** The unit, shown after the value. Defaults to none. */
  unit?: string;
  /** Where the number comes from: the popover's rows. */
  provenance: Provenance;
};

const longDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

/** “3 weeks ago”, beside the date. */
function ago(time: number) {
  const days = Math.round((time - Date.now()) / 86_400_000);
  if (Math.abs(days) < 7) return relative.format(days, 'day');
  if (Math.abs(days) < 60) return relative.format(Math.round(days / 7), 'week');
  return relative.format(Math.round(days / 30), 'month');
}

/** One term and its detail in the popover's description list. */
function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <Box>
      <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
        {term}
      </Typography>
      <Box component="dd" sx={{ m: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

export type ShowTheFiguresProps = {
  /** The formula's lines, and an emissions figure's factors. */
  figures: Pick<ProvenanceFigures, 'formula' | 'factors'>;
  /** The link to the building's factors table, under the factors. Defaults to none. */
  factorsLink?: ReactNode;
};

/**
 * The figures behind a calculation, folded under its sentence until asked for: a Show the Figures text
 * `Button` (`aria-expanded`, `aria-controls`) over MUI's `Collapse`, holding the formula with the values
 * used, a line per step in tabular numerals, then for an emissions figure the factor applied per fuel with
 * its source and year, and a link to the building's factors table. `ProvenanceFigure`'s popover and
 * `SourceFigure`'s dialog both use it, so the two lay the figures out the same way.
 *
 * @summary The formula and factors behind a calculation, folded behind a Show the Figures button.
 * @import import { ShowTheFigures } from 'src/components/ProvenancePopover';
 */
export function ShowTheFigures({ figures, factorsLink }: ShowTheFiguresProps) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <div>
      <Button
        variant="text"
        aria-expanded={shown}
        aria-controls={id}
        onClick={() => setShown((value) => !value)}
        endIcon={<Icon name="expand_more" sx={{ transform: shown ? 'rotate(180deg)' : undefined }} />}
        // The label lines up with the sentence above it; the button's own padding hangs outside.
        sx={{ ml: -1 }}
      >
        Show the Figures
      </Button>
      <Collapse in={shown} id={id}>
        <Stack sx={{ gap: 1, pt: 0.5 }}>
          <Stack component="ul" aria-label="Formula" sx={{ listStyle: 'none', m: 0, p: 0, gap: 0.5 }}>
            {figures.formula.map((line) => (
              <Typography key={line} component="li" variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {line}
              </Typography>
            ))}
          </Stack>
          {figures.factors && figures.factors.length > 0 && (
            <div>
              <Typography id={`${id}-factors`} component="p" variant="caption" sx={{ color: 'text.secondary' }}>
                Emission Factors
              </Typography>
              <Stack component="ul" aria-labelledby={`${id}-factors`} sx={{ listStyle: 'none', m: 0, p: 0, gap: 0.5 }}>
                {figures.factors.map(({ fuel, factor, source, year }) => (
                  <li key={fuel}>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fuel}: {factor}
                    </Typography>
                    <Typography component="p" variant="caption" sx={{ color: 'text.secondary' }}>
                      {source}, {year}
                    </Typography>
                  </li>
                ))}
              </Stack>
            </div>
          )}
          {factorsLink}
        </Stack>
      </Collapse>
    </div>
  );
}

/** The rows themselves, shared by the popover and the phone's bottom sheet. */
function ProvenanceRows({ provenance, onFollow }: { provenance: Provenance; onFollow: (to: string) => void }) {
  const link = ({ label, to }: ProvenanceLink) =>
    to ? (
      // A button styled as a link: it goes somewhere, but through `onNavigate`, after the popover closes.
      <Link component="button" type="button" variant="body2" onClick={() => onFollow(to)} sx={{ textAlign: 'start', minHeight: (theme) => theme.spacing(3) }}>
        {label}
      </Link>
    ) : (
      <Typography variant="body2">{label}</Typography>
    );
  return (
    <Stack component="dl" sx={{ m: 0, gap: 1.5 }}>
      <Row term="Built From">
        <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 0, gap: 0.5 }}>
          {provenance.builtFrom.map((source) => (
            <li key={source.label}>
              {link(source)}
              {source.detail && (
                <Typography component="p" variant="caption" sx={{ color: 'text.secondary' }}>
                  {source.detail}
                </Typography>
              )}
            </li>
          ))}
        </Stack>
      </Row>
      {provenance.period && (
        <Row term="Period">
          <Typography variant="body2">{provenance.period}</Typography>
        </Row>
      )}
      <Row term="Calculation">
        <Typography variant="body2">{provenance.calculation}</Typography>
        {provenance.figures && <ShowTheFigures figures={provenance.figures} factorsLink={provenance.figures.factorsTable && link(provenance.figures.factorsTable)} />}
      </Row>
      {provenance.includes && (
        <Row term="Includes">
          <Typography variant="body2">{provenance.includes}</Typography>
          {provenance.missing && link(provenance.missing)}
        </Row>
      )}
      {provenance.estimatedBySource && (
        <Row term="Estimated by Source">
          <Typography variant="body2">{provenance.estimatedBySource}</Typography>
        </Row>
      )}
      {provenance.awaitingBill && (
        <Row term="Awaiting Bill">
          <Typography variant="body2">{provenance.awaitingBill}</Typography>
        </Row>
      )}
      <Row term="Last Updated">
        <Typography variant="body2">
          {provenance.updated === null ? 'No last-updated date is recorded for this number.' : `${longDate.format(provenance.updated)} (${ago(provenance.updated)})`}
        </Typography>
      </Row>
      {provenance.energyStarPush && (
        <Row term="ENERGY STAR Last Push">
          <Typography variant="body2">{provenance.energyStarPush}</Typography>
        </Row>
      )}
    </Stack>
  );
}

export type ProvenanceFigureProps = {
  /** The cited number: its label, formatted value, unit and provenance. */
  figure: CitedFigure;
  /** Where a source's link goes. The popover closes first, then this is called with the link's `to`. */
  onNavigate: (to: string) => void;
};

/** How long a mouse rests on the number before its popover opens: long enough for the tooltip to come first. */
const hoverOpenDelay = 600;
/** How long the pointer may be off the number and its popover before a popover opened by hover closes: time to cross from one to the other. */
const hoverCloseDelay = 200;

/**
 * A number cited in running text, with where it comes from one click away. The number, its unit and
 * the `info` icon are one `ButtonBase`, set in the surrounding text's font with a faint `border.level2`
 * underline and the theme's `action.hover` tint. It opens on click, tap, Enter or Space; for a mouse it
 * also opens after the pointer rests on it for a moment, its tooltip (“Where this number comes from”)
 * first and the popover after. Opened by click it is MUI's `Popover` as it comes, so the page doesn't
 * scroll under it and focus moves into it; opened by hover it takes no focus, leaves the page
 * scrolling, and closes when the pointer leaves the number and the popover, or on Escape. Clicking the
 * number while it is open by hover keeps it open as a click does. The popover is anchored under the
 * number and capped at 44 characters a line, holding a description list of the rows that apply, in
 * this order: Built From (the sources, as links where they have one), Period, Calculation (a
 * sentence, with the formula and values behind Show the Figures), Includes (with a link to what is
 * missing), Estimated by Source, Awaiting Bill, Last Updated (which says in words when no date is
 * recorded) and ENERGY STAR Last Push. Below the `md` breakpoint it is a bottom sheet instead, MUI's
 * bottom `Drawer`, titled with the number and closed by a Close button, opened by tap or click only.
 * Following a link closes the popover, then calls `onNavigate`. It shows provenance; it never
 * computes it. For a card's headline number, use `SourceFigure`, whose dialog lists the same rows.
 *
 * @summary A number cited in text, as a button that opens a popover listing its sources, period and calculation.
 * @import import { ProvenanceFigure } from 'src/components/ProvenancePopover';
 */
export function ProvenanceFigure({ figure, onNavigate }: ProvenanceFigureProps) {
  const theme = useTheme();
  const phone = !useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  // How the popover was opened: a click's is modal, as MUI's `Popover` is; a hover's takes no focus and closes on
  // pointer-out; `kept` is a hover's that a click then kept open, which is modal from then on.
  const [by, setBy] = useState<'click' | 'hover' | 'kept'>('click');
  const timer = useRef<number | undefined>(undefined);
  const button = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const open = Boolean(anchor);
  // Opened by hover; it holds while the popover closes, so MUI closes it as it opened it.
  const hover = by === 'hover' && !phone;
  const hovered = open && hover;
  const shown = `${figure.value}${figure.unit ? ` ${figure.unit}` : ''}`;
  const wait = (run: () => void, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(run, delay);
  };
  const close = () => {
    window.clearTimeout(timer.current);
    setAnchor(null);
  };
  const follow = (to: string) => {
    close();
    onNavigate(to);
  };
  const click = () => {
    window.clearTimeout(timer.current);
    // Already open by hover: the click keeps it open, as a click's popover from here on.
    setBy(hovered ? 'kept' : 'click');
    setAnchor(button.current);
  };
  // Only a mouse opens by resting: touch and pen tap, and the keyboard presses Enter or Space.
  const rest = (event: PointerEvent<HTMLElement>) => {
    if (phone || event.pointerType !== 'mouse') return;
    if (open) window.clearTimeout(timer.current);
    else
      wait(() => {
        setBy('hover');
        setAnchor(button.current);
      }, hoverOpenDelay);
  };
  const leave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    if (hovered) wait(close, hoverCloseDelay);
    else if (!open) window.clearTimeout(timer.current);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // A popover opened by hover holds no focus, so Escape is heard on the document.
  useEffect(() => {
    if (!hovered) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      window.clearTimeout(timer.current);
      setAnchor(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hovered]);
  const body = (
    <>
      {/* Room on the right for the sheet's close button. */}
      <Typography id={titleId} component="h2" variant="subtitle2" sx={{ pr: phone ? 5 : 0 }}>
        {figure.label}, {shown}
      </Typography>
      <ProvenanceRows provenance={figure.provenance} onFollow={follow} />
    </>
  );
  return (
    <>
      {/* The tooltip comes first, the popover after; once the popover is open the tooltip has nothing to add. */}
      <Tooltip title={open ? '' : 'Where this number comes from'}>
        <ButtonBase
          ref={button}
          focusRipple
          // The visible figure leads the name, so speech input can say what's on screen.
          aria-label={`${figure.label}, ${shown}: where this number comes from`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={click}
          onPointerEnter={rest}
          onPointerLeave={leave}
          // As a card's figure that opens its source does (`ExplainedFigure`): a faint underline, and the hover tint around it.
          sx={{
            font: 'inherit',
            color: 'inherit',
            verticalAlign: 'baseline',
            gap: 0.25,
            borderRadius: 1,
            px: 0.25,
            textDecorationLine: 'underline',
            textDecorationColor: (theme) => (theme.vars ?? theme).palette.border.level2,
            textDecorationThickness: '1px',
            textUnderlineOffset: '0.18em',
            transition: (theme) => theme.transitions.create('background-color', { duration: theme.transitions.duration.shortest }),
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {shown}
          <Icon name="info" fontSize="inherit" sx={{ color: 'text.secondary' }} />
        </ButtonBase>
      </Tooltip>
      {phone ? (
        <Drawer anchor="bottom" open={open} onClose={close} slotProps={{ paper: { role: 'dialog', 'aria-labelledby': titleId } }}>
          <Stack sx={{ p: 2, gap: 2, position: 'relative' }}>
            <IconButton aria-label="Close" onClick={close} sx={{ position: 'absolute', right: (theme) => theme.spacing(1), top: (theme) => theme.spacing(1) }}>
              <Icon name="close" />
            </IconButton>
            {body}
          </Stack>
        </Drawer>
      ) : (
        <Popover
          // A hover's popover that a click keeps is mounted again as a click's, in place and with no transition, so MUI
          // locks the page's scroll and moves focus into it as it does for any `Popover`.
          key={by === 'hover' ? 'hover' : 'modal'}
          transitionDuration={by === 'kept' ? 0 : 'auto'}
          open={open}
          anchorEl={anchor}
          onClose={close}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          // Opened by hover it isn't modal: the page scrolls, focus stays where it was, and only the paper takes the pointer,
          // so leaving the number for anything but the popover closes it.
          disableScrollLock={hover}
          disableAutoFocus={hover}
          disableEnforceFocus={hover}
          disableRestoreFocus={hover}
          sx={hover ? { pointerEvents: 'none' } : undefined}
          slotProps={{
            paper: {
              role: 'dialog',
              'aria-labelledby': titleId,
              onPointerEnter: () => window.clearTimeout(timer.current),
              onPointerLeave: leave,
              sx: { pointerEvents: 'auto' },
            },
          }}
        >
          {/* A line-length cap (Rules → Content and layout), not a width of its own. */}
          <Stack sx={{ p: 2, gap: 1.5, maxWidth: '44ch' }}>{body}</Stack>
        </Popover>
      )}
    </>
  );
}
