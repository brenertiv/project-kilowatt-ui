import { useId, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
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

/**
 * Where a number comes from, as data, so it can be stored with the message or record that cites it.
 * The popover shows the rows that apply, in this order, and leaves out the rest.
 */
export type Provenance = {
  /** Built From: each source by type and name, as a link where it has one. */
  builtFrom: ProvenanceLink[];
  /** Period, in the long-month format: “October 2026”. Defaults to none, and the row is left out. */
  period?: string;
  /** Calculation, in plain words and units. */
  calculation: string;
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

/**
 * A number cited in running text, with where it comes from one click away. The number, its unit and
 * the `info` icon are one `ButtonBase`, set in the surrounding text's font with a faint `border.level2`
 * underline and the theme's `action.hover` tint; it opens on click, Enter or Space, never on hover. What
 * opens is MUI's `Popover`, anchored under the number and capped at 44 characters a line, holding a
 * description list of the rows that apply: Built From (the sources, as links where they have one),
 * Period, Calculation, Includes (with a link to what is missing), Estimated by Source, Awaiting Bill,
 * Last Updated (which says in words when no date is recorded) and ENERGY STAR Last Push. Below the
 * `md` breakpoint it is a bottom sheet instead, MUI's bottom `Drawer`, titled with the number and
 * closed by a Close button. Following a link closes the popover, then calls `onNavigate`. It shows
 * provenance; it never computes it. For a card's headline number, use `SourceFigure`.
 *
 * @summary A number cited in text, as a button that opens a popover listing its sources, period and calculation.
 * @import import { ProvenanceFigure } from 'src/components/ProvenancePopover';
 */
export function ProvenanceFigure({ figure, onNavigate }: ProvenanceFigureProps) {
  const theme = useTheme();
  const phone = !useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const titleId = useId();
  const open = Boolean(anchor);
  const shown = `${figure.value}${figure.unit ? ` ${figure.unit}` : ''}`;
  const close = () => setAnchor(null);
  const follow = (to: string) => {
    close();
    onNavigate(to);
  };
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
      <ButtonBase
        focusRipple
        // The visible figure leads the name, so speech input can say what's on screen.
        aria-label={`${figure.label}, ${shown}: where this number comes from`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => setAnchor(event.currentTarget)}
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
          open={open}
          anchorEl={anchor}
          onClose={close}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { role: 'dialog', 'aria-labelledby': titleId } }}
        >
          {/* A line-length cap (Rules → Content and layout), not a width of its own. */}
          <Stack sx={{ p: 2, gap: 1.5, maxWidth: '44ch' }}>{body}</Stack>
        </Popover>
      )}
    </>
  );
}
