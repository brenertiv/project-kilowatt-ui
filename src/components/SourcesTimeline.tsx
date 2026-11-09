import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';

/** A run of months on the timeline's axis, in months from the first; `end` is exclusive. */
export type MonthSpan = { start: number; end: number };

/** The runs of months a source reported in, as the timeline draws its bars. */
export function spansOf(reported: boolean[]): MonthSpan[] {
  const spans: MonthSpan[] = [];
  reported.forEach((on, i) => {
    if (!on) return;
    const last = spans[spans.length - 1];
    if (last && last.end === i) last.end = i + 1;
    else spans.push({ start: i, end: i + 1 });
  });
  return spans;
}

/**
 * The gaps the timeline hatches on a source's row: the holes between its runs, the stretch after its last run when
 * that is longer than `lagMonths` (the billing lag), or the whole axis when it reported nothing at all. Months before
 * the first run are a source not reporting yet, not a gap.
 */
export function gapsOf(reported: boolean[], lagMonths = 2): MonthSpan[] {
  const spans = spansOf(reported);
  const n = reported.length;
  if (!n) return [];
  if (!spans.length) return [{ start: 0, end: n }];
  const gaps: MonthSpan[] = [];
  for (let i = 1; i < spans.length; i += 1) gaps.push({ start: spans[i - 1].end, end: spans[i].start });
  const lastEnd = spans[spans.length - 1].end;
  if (n - lastEnd > lagMonths) gaps.push({ start: lastEnd, end: n });
  return gaps;
}

/** One source on the timeline. */
export type TimelineSource = {
  /** A stable id, passed to `onSelect`. */
  id: string;
  /** What kind of source it is, written before its name: `Utility account`. */
  kind: string;
  /** The source's name: an account or meter number. */
  name: string;
  /** Whether it reported in each month of `months`, in the same order. */
  reported: boolean[];
};

export type SourcesTimelineProps = {
  /** The first day of each month on the axis, oldest first. */
  months: Date[];
  /** The rows, one per source. */
  sources: TimelineSource[];
  /** The group's accessible name: `Electricity sources, Jan–Dec 2025`. */
  label: string;
  /** The id of the selected source, ringed in `primary`. Default none. */
  selected?: string;
  /** Called with a source's id when its row is chosen. Default none: the rows are still focusable, for their summary. */
  onSelect?: (id: string) => void;
  /** Months a silence after the last run may last before it's a gap: the billing lag. Default `2`. */
  lagMonths?: number;
  /**
   * Columns of the feed's usage above the rows, on the same month slots: the values (none for a month without data),
   * their unit and a heading such as `Electricity usage · kWh per month`. Default none.
   */
  usage?: { values: (number | undefined)[]; unit: string; heading: string };
  /** A heading over the rows: `Electricity sources`. Default none. */
  heading?: string;
};

const whole = new Intl.NumberFormat();
const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumSignificantDigits: 3 });
const shortMonth = new Intl.DateTimeFormat(undefined, { month: 'short' });
const monthAndYear = new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' });
const longMonth = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

/** The warning hatch that marks a gap, shared by the rows and the legend so the two can't drift. */
const gapHatch = (t: Theme) =>
  `repeating-linear-gradient(45deg, color-mix(in srgb, ${(t.vars ?? t).palette.warning.main} 25%, transparent) 0 ${t.spacing(0.5)}, transparent ${t.spacing(0.5)} ${t.spacing(1)})`;

const place = (span: MonthSpan, n: number) => ({ left: `${(span.start / n) * 100}%`, width: `${((span.end - span.start) / n) * 100}%` });

/** The month labels under the columns and the rows: the same slots both share. */
function MonthAxis({ months, gap }: { months: Date[]; gap?: number }) {
  const spansYears = new Set(months.map((m) => m.getFullYear())).size > 1;
  return (
    <Box aria-hidden sx={{ display: 'flex', gap }}>
      {months.map((date) => (
        <Typography key={date.getTime()} variant="caption" sx={{ flex: 1, textAlign: 'center', color: 'text.secondary', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {(spansYears ? monthAndYear : shortMonth).format(date)}
        </Typography>
      ))}
    </Box>
  );
}

/** The feed's usage by month, a column per month slot in the first series color, each with its compact value over it. */
function UsageColumns({ months, values, unit, heading }: { months: Date[]; values: (number | undefined)[]; unit: string; heading: string }) {
  const top = Math.max(0, ...values.map((v) => v ?? 0));
  const withData = values.filter((v): v is number => v !== undefined);
  const summary = withData.length
    ? `${heading}: ${whole.format(withData.length)} of ${whole.format(values.length)} months with data, the highest ${whole.format(Math.round(top))} ${unit}.`
    : `${heading}: no month has data.`;
  return (
    <Stack sx={{ gap: 1 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {heading}
      </Typography>
      <Box component="figure" aria-label={summary} sx={{ m: 0, display: 'flex', alignItems: 'flex-end', gap: 0.5, height: (t) => t.spacing(22.5), borderBottom: 1, borderColor: 'divider' }}>
        {values.map((value, i) => (
          // describeChild: the column has no role to carry a name; the figure's summary names the chart, and the tooltip describes the column while it shows.
          <Tooltip key={months[i].getTime()} describeChild title={`${longMonth.format(months[i])}: ${value === undefined ? 'no data' : `${whole.format(Math.round(value))} ${unit}`}`}>
            <Box sx={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
              {value !== undefined && (
                <>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, mb: 0.5 }}>
                    {compact.format(value)}
                  </Typography>
                  <Box sx={(t) => ({ width: '60%', height: top ? `${Math.max(2, (value / top) * 85)}%` : 0, bgcolor: (t.vars ?? t).palette.chart.series[0], borderRadius: 0.25 })} />
                </>
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>
      <MonthAxis months={months} gap={0.5} />
    </Stack>
  );
}

/** The key: a solid swatch for data, a hatched one for a gap, a dot for a source that needs fixing. */
function TimelineLegend({ selectable }: { selectable: boolean }) {
  const item = (mark: ReactNode, text: string) => (
    <Box component="li" key={text} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      {mark}
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {text}
      </Typography>
    </Box>
  );
  return (
    <Box component="ul" aria-label="How the sources timeline reads" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, listStyle: 'none', m: 0, p: 0 }}>
      {item(<Box aria-hidden sx={{ width: (t) => t.spacing(2), height: (t) => t.spacing(1.5), borderRadius: 0.5, bgcolor: 'success.main' }} />, 'Data')}
      {item(<Box aria-hidden sx={{ width: (t) => t.spacing(2), height: (t) => t.spacing(1.5), borderRadius: 0.5, border: 1, borderColor: 'warning.main', backgroundImage: gapHatch }} />, 'Gap')}
      {item(<Box aria-hidden sx={{ width: (t) => t.spacing(1), height: (t) => t.spacing(1), borderRadius: '50%', bgcolor: 'warning.main' }} />, 'Needs fixing')}
      {selectable && (
        <Box component="li">
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Click a source for details
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/** One source's row on the month axis: its runs as bars, its gaps hatched, its name in a chip at its first run. */
function SourceRow({ source, months, lagMonths, selected, onSelect }: { source: TimelineSource; months: Date[]; lagMonths: number; selected: boolean; onSelect?: () => void }) {
  const n = months.length;
  const spans = spansOf(source.reported);
  const gaps = gapsOf(source.reported, lagMonths);
  const needsFixing = gaps.length > 0;
  const name = `${source.kind} · ${source.name}${needsFixing ? ' · needs fixing' : ''}`;
  const reported = source.reported.filter(Boolean).length;
  const gapWords = gaps.map((g) => (g.end - g.start === 1 ? longMonth.format(months[g.start]) : `${longMonth.format(months[g.start])} to ${longMonth.format(months[g.end - 1])}`)).join(', ');
  const summary = `${name}: reported in ${reported} of ${n} months${needsFixing ? `; no data for ${gapWords}` : ''}.`;
  // The chip sits at the first run's start, no further right than three quarters of the axis so it stays readable.
  const labelLeft = Math.min((spans[0]?.start ?? 0) / n, 0.75) * 100;
  return (
    <Tooltip title={summary}>
      <ButtonBase
        onClick={onSelect}
        aria-pressed={onSelect ? selected : undefined}
        aria-label={summary}
        sx={(t) => {
          const { palette } = t.vars ?? t;
          return {
            display: 'block',
            position: 'relative',
            width: '100%',
            height: t.spacing(3),
            borderRadius: 0.5,
            // A month gridline every slot of the axis, drawn as a background so hover keeps it.
            backgroundImage: `repeating-linear-gradient(to right, ${palette.border.level0} 0 1px, transparent 1px calc(100% / ${n}))`,
            '&:hover': { bgcolor: 'action.hover' },
            // The selection ring and the needs-fixing outline sit above the bars, so they show whatever the row holds.
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 0.5,
              pointerEvents: 'none',
              zIndex: 2,
              boxShadow: selected ? `inset 0 0 0 2px ${palette.primary.main}` : needsFixing ? `inset 0 0 0 1px ${palette.warning.main}` : 'none',
            },
            '&:focus-visible': { outline: `2px solid ${palette.control.focus}`, outlineOffset: 2 },
          };
        }}
      >
        {spans.map((span) => (
          <Box key={`${span.start}-${span.end}`} aria-hidden sx={{ position: 'absolute', top: (t) => t.spacing(0.25), bottom: (t) => t.spacing(0.25), ...place(span, n), borderRadius: 0.5, bgcolor: 'success.main' }} />
        ))}
        {gaps.map((span) => (
          <Box
            key={`gap-${span.start}-${span.end}`}
            aria-hidden
            sx={{ position: 'absolute', top: (t) => t.spacing(0.25), bottom: (t) => t.spacing(0.25), ...place(span, n), borderRadius: 0.5, border: 1, borderColor: 'warning.main', backgroundImage: gapHatch, zIndex: 1 }}
          />
        ))}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: (t) => `calc(${labelLeft}% + ${t.spacing(0.5)})`,
            maxWidth: (t) => `calc(${100 - labelLeft}% - ${t.spacing(1)})`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 0.5,
            borderRadius: 0.5,
            bgcolor: 'background.level3',
            minWidth: 0,
            zIndex: 1,
          }}
        >
          {needsFixing && <Box sx={{ width: (t) => t.spacing(1), height: (t) => t.spacing(1), borderRadius: '50%', bgcolor: 'warning.main', flexShrink: 0 }} />}
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {source.kind}
          </Typography>
          <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {source.name}
          </Typography>
        </Box>
      </ButtonBase>
    </Tooltip>
  );
}

/**
 * A feed's sources over a period: a row per source on one month axis, a bar per run of months it reported, a hatched
 * segment for each gap (a hole between runs, a silence past the billing lag at the end, or a row that reported
 * nothing), and a "needs fixing" dot and outline on a row with a gap. With `usage`, the feed's usage by month sits above
 * as columns on the same month slots, so a column lines up with the rows beneath it. With `onSelect`, a row is a toggle
 * button that selects its source, for a record shown under the timeline. Every row's summary names its months in words,
 * so nothing rests on the hatch or the color. Built from MUI's `Box` and `ButtonBase`: `ColumnChart` keeps its value
 * axis, so its columns couldn't line up with the rows.
 *
 * @summary A row per data source on a month axis, with gaps hatched and optional usage columns above.
 * @import import { SourcesTimeline } from 'src/components/SourcesTimeline';
 */
export function SourcesTimeline({ months, sources, label, selected, onSelect, lagMonths = 2, usage, heading }: SourcesTimelineProps) {
  return (
    <Stack sx={{ gap: 3 }}>
      {usage && <UsageColumns months={months} values={usage.values} unit={usage.unit} heading={usage.heading} />}
      <Stack sx={{ gap: 1 }}>
        {heading && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {heading}
          </Typography>
        )}
        <TimelineLegend selectable={Boolean(onSelect)} />
        <Stack role="group" aria-label={label} sx={{ gap: 0.5 }}>
          {sources.map((source) => (
            <SourceRow key={source.id} source={source} months={months} lagMonths={lagMonths} selected={source.id === selected} onSelect={onSelect && (() => onSelect(source.id))} />
          ))}
        </Stack>
        <MonthAxis months={months} />
      </Stack>
    </Stack>
  );
}
