import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Icon } from '../icons';
import { ShowTheFigures, type ProvenanceFactor } from './ProvenancePopover';

/** The figures behind a figure's calculation, for someone checking it: what Show the Figures lays out in the dialog. */
export type FigureFigures = {
  /** The formula with the values used, a line per step: “2,696,400 kBtu ÷ 42,000 ft² = 64.2 kBtu/ft²”. */
  formula: string[];
  /** For an emissions figure: the factor applied per fuel, with its source and year. Defaults to none. */
  factors?: ProvenanceFactor[];
  /** For an emissions figure: a link to the building's factors table. Defaults to none. */
  factorsTable?: { label: string; href: string };
};

/**
 * Where a figure comes from, each as one short line. `SourceFigure`'s dialog lists them as the provenance
 * popover does (`ProvenanceFigure`), in the same order: Built From, Period, Calculation, Includes, Estimated
 * by Source, Awaiting Bill, Last Updated and ENERGY STAR Last Push, leaving out a row that isn't given.
 */
export type FigureSource = {
  /** Where the data comes from: “Utility bills, then interval meter data where no bill covers the period”. */
  source: string;
  /** The period the figure covers: “January–December 2025”. */
  period: string;
  /** How the figure is worked out from the data, as a sentence. */
  calculation: string;
  /** The formula with the values used, and an emissions figure's factors, under the calculation behind Show the Figures, folded until asked for. Defaults to none, and the control is left out. */
  figures?: FigureFigures;
  /** What the figure counts: which properties, meters or areas. The first line under Includes. */
  scope: string;
  /** What the figure includes: how much of the scope has data, and what is left out. The second line under Includes. */
  coverage: string;
  /** Which values are estimated and by which source, never “estimated” alone. Defaults to none, and the row is left out. */
  estimatedBySource?: string;
  /** The bills still to come. Defaults to none, and the row is left out. */
  awaitingBill?: string;
  /** When the data was last updated, formatted with `Intl.DateTimeFormat`. */
  updated: string;
  /** For a figure synced to ENERGY STAR, when it was last pushed. Defaults to none, and the row is left out. */
  energyStarPush?: string;
};

/** A place a figure's data comes from: a link in the dialog's Built From list. */
export type FigureLink = {
  /** What the place is called: “Utility bills”. */
  label: string;
  /** One line under it, such as when it was last updated. Defaults to none. */
  detail?: string;
  /** Where the link goes. Defaults to none, and the label is plain text. */
  href?: string;
  /** The records the figure is built from (the properties, meters or accounts it counts), each a link under the detail that opens its record. Six are listed, then "and N more". The explanation closes as a record opens, so the record isn't behind it. Defaults to none. */
  records?: FigureRecord[];
};

/** A record a figure is built from: a link in the dialog's Built From list that opens it. */
export type FigureRecord = {
  /** Identifies the record in the list. */
  id: string;
  /** The record's name: “Harbor Point”. */
  label: string;
  /** Opens the record, in the record drawer or on its page. */
  onOpen: () => void;
};

/** Closes the explanation dialog a record link sits in, so the record it opens isn't behind it. */
const CloseExplanation = createContext<() => void>(() => undefined);

/** How many records a source lists before "and N more". */
const listedRecords = 6;

/** A source's records as links, the explanation closing as one opens. */
function RecordLinks({ records }: { records: FigureRecord[] }) {
  const close = useContext(CloseExplanation);
  const shown = records.slice(0, listedRecords);
  const more = records.length - shown.length;
  return (
    <Stack component="ul" aria-label="Records" sx={{ listStyle: 'none', m: 0, p: 0, mt: 0.5, gap: 0.25 }}>
      {shown.map((record) => (
        <li key={record.id}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => {
              close();
              record.onOpen();
            }}
            sx={{ textAlign: 'start' }}
          >
            {record.label}
          </Link>
        </li>
      ))}
      {more > 0 && (
        <Typography component="li" variant="caption" color="text.secondary">
          and {new Intl.NumberFormat().format(more)} more
        </Typography>
      )}
    </Stack>
  );
}

/** One term and its detail in the explanation's description list, as the provenance popover sets a row. */
function ExplanationRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
        {term}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0 }}>
        {children}
      </Typography>
    </div>
  );
}

export type FigureExplanationProps = {
  /** What the figure is, always shown, first; an array shows one line each. Defaults to none. */
  description?: string | string[];
  /** Built From: where the data comes from, as links where a place has one. Defaults to none, and the row is left out. */
  sources?: FigureLink[];
  /** Period: the period the figure covers. Defaults to none, and the row is left out. */
  period?: string;
  /** Calculation: how the figure is worked out, as a sentence or your own content. Defaults to none, and the row is left out. */
  calculation?: ReactNode;
  /** The formula with the values used, under the calculation behind Show the Figures. Defaults to none, and the control is left out. */
  figures?: FigureFigures;
  /** Includes: what the figure counts and what is left out; an array shows one line each. Defaults to none, and the row is left out. */
  includes?: string | string[];
  /** Estimated by Source: which values are estimated and by which source. Defaults to none, and the row is left out. */
  estimatedBySource?: string;
  /** Awaiting Bill: the bills still to come. Defaults to none, and the row is left out. */
  awaitingBill?: string;
  /** Last Updated: when the data was last updated, already formatted. Defaults to none, and the row is left out. */
  updated?: string;
  /** ENERGY STAR Last Push: when a figure synced to ENERGY STAR was last pushed. Defaults to none, and the row is left out. */
  energyStarPush?: string;
};

/**
 * What a figure's dialog says: a description, then the rows the provenance popover lists
 * (`ProvenanceFigure`), under the same names and in the same order, as one description list: Built From,
 * Period, Calculation (with the formula behind Show the Figures), Includes, Estimated by Source, Awaiting
 * Bill, Last Updated and ENERGY STAR Last Push. A row that isn't given is left out. `SourceFigure` builds
 * one from its `source`; put one in an `ExplainedFigure` for a figure that isn't a `SourceFigure`, so
 * every figure's dialog reads the same way, and the same way as a number cited in text.
 *
 * @summary A figure's explanation: a description, then the provenance popover's rows in its order.
 * @import import { FigureExplanation } from 'src/components/SourceFigure';
 */
export function FigureExplanation({
  description,
  sources = [],
  period,
  calculation,
  figures,
  includes,
  estimatedBySource,
  awaitingBill,
  updated,
  energyStarPush,
}: FigureExplanationProps) {
  const lines = description === undefined ? [] : Array.isArray(description) ? description : [description];
  const included = includes === undefined ? [] : Array.isArray(includes) ? includes : [includes];
  const rows = sources.length > 0 || period || calculation || included.length > 0 || estimatedBySource || awaitingBill || updated || energyStarPush;
  return (
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
      {rows && (
        <Stack component="dl" sx={{ gap: 1.5, m: 0 }}>
          {sources.length > 0 && (
            <div>
              <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
                Built From
              </Typography>
              <Stack component="dd" sx={{ m: 0 }}>
                <List disablePadding aria-label="Built From">
                  {sources.map(({ label, detail, href, records }) => (
                    <ListItem key={label} disableGutters sx={{ py: 0.25 }}>
                      <ListItemText
                        sx={{ my: 0 }}
                        primary={
                          href ? (
                            <Link href={href} variant="body2" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              {label}
                              <Icon name="arrow_right_alt" fontSize="small" />
                            </Link>
                          ) : (
                            label
                          )
                        }
                        // A source's records as links under its detail; a list can't sit in a paragraph, so the line is a div then.
                        secondary={
                          records ? (
                            <>
                              {detail}
                              <RecordLinks records={records} />
                            </>
                          ) : (
                            detail
                          )
                        }
                        slotProps={{ primary: { variant: 'body2' }, ...(records ? { secondary: { component: 'div' } } : {}) }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </div>
          )}
          {period && <ExplanationRow term="Period">{period}</ExplanationRow>}
          {calculation && (
            <div>
              <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
                Calculation
              </Typography>
              <Stack component="dd" sx={{ m: 0 }}>
                {typeof calculation === 'string' ? <Typography variant="body2">{calculation}</Typography> : calculation}
                {figures && (
                  <ShowTheFigures
                    figures={figures}
                    factorsLink={
                      figures.factorsTable && (
                        <Link href={figures.factorsTable.href} variant="body2" sx={{ alignSelf: 'flex-start' }}>
                          {figures.factorsTable.label}
                        </Link>
                      )
                    }
                  />
                )}
              </Stack>
            </div>
          )}
          {included.length > 0 && (
            <div>
              <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
                Includes
              </Typography>
              <Stack component="dd" sx={{ m: 0, gap: 0.5 }}>
                {included.map((line) => (
                  <Typography key={line} variant="body2">
                    {line}
                  </Typography>
                ))}
              </Stack>
            </div>
          )}
          {estimatedBySource && <ExplanationRow term="Estimated by Source">{estimatedBySource}</ExplanationRow>}
          {awaitingBill && <ExplanationRow term="Awaiting Bill">{awaitingBill}</ExplanationRow>}
          {updated && <ExplanationRow term="Last Updated">{updated}</ExplanationRow>}
          {energyStarPush && <ExplanationRow term="ENERGY STAR Last Push">{energyStarPush}</ExplanationRow>}
        </Stack>
      )}
    </Stack>
  );
}

/** A value longer than this (a phrase rather than a number) steps down from `h2` to `h4`, so it still fits on a card. */
const longValue = 14;

/** What the estimated marker's tooltip says, and what the figure's name adds: “Estimated by the utility”. */
const estimatedBy = (source: string) => `Estimated by ${source}`;

/**
 * The estimated marker: the word “est.” after a value its source estimated, in `body1` and `text.secondary` as the
 * unit is. On a figure that isn't a control it carries its own tooltip and takes keyboard focus, so the tooltip opens
 * without a pointer; inside a figure's button, the button carries the tooltip.
 */
function EstimatedMarker({ source, standalone }: { source: string; standalone: boolean }) {
  const marker = (
    <Typography component="span" variant="body1" tabIndex={standalone ? 0 : undefined} sx={{ color: 'text.secondary', display: 'inline-block', ml: 0.5, borderRadius: 1 }}>
      est.
    </Typography>
  );
  return standalone ? <Tooltip title={estimatedBy(source)}>{marker}</Tooltip> : marker;
}

/** The headline number as it reads on a card: `h2` with tabular numerals (`h4` for a long phrase), the unit after it in `body1`, then “est.” for an estimated value. */
function FigureText({ value, unit, underline, estimated }: { value: string; unit?: string; underline: boolean; estimated?: string }) {
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
      {estimated && <EstimatedMarker source={estimated} standalone={!underline} />}
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
  /** For a value its source estimated, the source's name as it reads after “Estimated by”: `the utility`. The figure is followed by the word “est.” in `text.secondary`, and its tooltip and name say “Estimated by the utility”. Never Enertiv, and never for a total: a total says what it includes instead. Defaults to none. */
  estimated?: string;
  /** What explains the figure: the dialog's content, usually a `FigureExplanation`. */
  children: ReactNode;
  /** Where View Sources goes, after the dialog closes. Defaults to none, and the action isn't shown. */
  onViewSources?: () => void;
};

/**
 * A headline number that opens what explains it. The number is a button with a faint `border.level2`
 * underline under the number (not the unit) and the theme's `action.hover` tint on hover; it opens a
 * `Dialog` titled with the card's title that holds the explanation. A value its source estimated is followed
 * by “est.” (`estimated`). Use it for any figure a card would
 * otherwise clarify with a caption under it; `SourceFigure` fills the dialog with where the figure comes
 * from, and `PlainFigure` sets a figure with nothing to explain in the same type.
 *
 * @summary A card's headline number as a button that opens a dialog explaining it.
 * @import import { ExplainedFigure } from 'src/components/SourceFigure';
 */
export function ExplainedFigure({ title, value, unit, estimated, children, onViewSources }: ExplainedFigureProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = () => setOpen(false);
  return (
    <>
      <Tooltip title={estimated ? `${estimatedBy(estimated)}. View source: ${title}` : `View source: ${title}`}>
        <ButtonBase
          focusRipple
          // The visible figure leads the name, so speech input can say what's on screen.
          aria-label={`${unit ? `${value} ${unit}` : value}${estimated ? `, estimated by ${estimated}` : ''}, view source for ${title}`}
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
          <FigureText value={value} unit={unit} underline estimated={estimated} />
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
        <DialogContent>
          {/* A record link in the explanation closes it as the record opens. */}
          <CloseExplanation.Provider value={close}>{children}</CloseExplanation.Provider>
        </DialogContent>
        {/* No Done button: the close button and Escape close the dialog. */}
        {onViewSources && (
          <DialogActions>
            <Button
              onClick={() => {
                close();
                onViewSources();
              }}
            >
              View Sources
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}

export type PlainFigureProps = {
  /** The figure, already formatted with `Intl.NumberFormat`. Longer than 14 characters, it steps down from `h2` to `h4`. */
  value: string;
  /** The unit, shown after the value in `body1` and `text.secondary`. Defaults to none. */
  unit?: string;
  /** For a value its source estimated, the source's name as it reads after “Estimated by”: `the utility`. The figure is followed by the word “est.” in `text.secondary`, which takes keyboard focus and shows “Estimated by the utility” in a tooltip. Defaults to none. */
  estimated?: string;
};

/**
 * A headline number with nothing to explain: the same type as `ExplainedFigure` (`h2` with tabular
 * numerals, the unit after it in `body1` and `text.secondary`), as a paragraph rather than a control.
 * A value its source estimated is followed by “est.” (`estimated`), with the source in its tooltip.
 *
 * @summary A card's headline number, with its unit, that isn't a control.
 * @import import { PlainFigure } from 'src/components/SourceFigure';
 */
export function PlainFigure({ value, unit, estimated }: PlainFigureProps) {
  return (
    <Typography component="p" sx={{ m: 0 }}>
      <FigureText value={value} unit={unit} underline={false} estimated={estimated} />
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
  /** For a value its source estimated, the source's name as it reads after “Estimated by”: `the utility`. The figure is followed by the word “est.” in `text.secondary`, its tooltip and name say “Estimated by the utility”, and the dialog's Estimated by Source row says so too unless `source.estimatedBySource` says more. Never Enertiv, and never for a total. Defaults to none. */
  estimated?: string;
  /** Where the figure comes from: the dialog's rows, in the provenance popover's order. */
  source: FigureSource;
  /** What clarifies the number (what it counts, how sure it is): the dialog's description, at the top; an array shows one line each. Defaults to none. */
  note?: string | string[];
  /** The places the data comes from, as links under Built From, in place of `source.source`. Defaults to none. */
  sources?: FigureLink[];
  /** Where View Sources goes, after the dialog closes. Defaults to none, and the action isn't shown. */
  onViewSources?: () => void;
};

/**
 * A headline number that opens its source: an `ExplainedFigure` whose dialog is a `FigureExplanation`,
 * with `note` as the description and then the rows the provenance popover lists (`ProvenanceFigure`), in
 * the same order: Built From, Period, Calculation (with Show the Figures where `source.figures` is given),
 * Includes (the scope, then what it leaves out), Estimated by Source, Awaiting Bill, Last Updated and
 * ENERGY STAR Last Push, with an optional View Sources action. A value its source estimated is followed
 * by “est.” (`estimated`). The card carries no caption under the figure; what would have gone there goes
 * in `note`.
 *
 * @summary A card's headline number that opens a dialog with its description and where it comes from.
 * @import import { SourceFigure } from 'src/components/SourceFigure';
 */
export function SourceFigure({ title, value, unit, estimated, source, note, sources, onViewSources }: SourceFigureProps) {
  return (
    <ExplainedFigure title={title} value={value} unit={unit} estimated={estimated} onViewSources={onViewSources}>
      <FigureExplanation
        description={note}
        sources={sources ?? [{ label: source.source }]}
        period={source.period}
        calculation={source.calculation}
        figures={source.figures}
        includes={[source.scope, source.coverage]}
        estimatedBySource={source.estimatedBySource ?? (estimated ? `This value is estimated by ${estimated}` : undefined)}
        awaitingBill={source.awaitingBill}
        updated={source.updated}
        energyStarPush={source.energyStarPush}
      />
    </ExplainedFigure>
  );
}
