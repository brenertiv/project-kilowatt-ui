import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import type { ChartStatus } from '../charts/theme';

/** One part of the whole, and how it takes its color: a series `slot`, a `status`, or `neutral`. */
export type Segment = {
  /** The part's name, in sentence case, shown in the legend: `In progress`. */
  label: string;
  /** The part's value, in `unit`. */
  value: number;
  /** The `chart.series` slot for a product meaning (`workOrderTypeSlots` from `src/charts/meanings`). Default: the next free slot. */
  slot?: number;
  /** An intent, for a bar colored by status (`workOrderStatusIntents` from `src/charts/meanings`), or `neutral` for a part that isn't the focus. */
  status?: ChartStatus | 'neutral';
};

export type SegmentedBarProps = {
  /** The parts, in the order they're drawn left to right and listed: a lifecycle's order for statuses, largest first otherwise. Parts with no value stay in the legend. */
  segments: Segment[];
  /** The unit of the values, written after each one in the legend: `work orders`. */
  unit: string;
  /** What the whole is, for screen readers and as the legend's name: `Work orders by status`. */
  label: string;
};

const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });
const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/** Each segment's color as a CSS value from the palette, following the chart rules: slots for meanings, the intents for status, `chart.neutral` otherwise. */
function fills(segments: Segment[], theme: Theme): string[] {
  const { chart } = theme.palette;
  const taken = new Set(segments.flatMap(({ slot }) => (slot === undefined ? [] : [slot])));
  const free = chart.series.map((_, slot) => slot).filter((slot) => !taken.has(slot));
  return segments.map(({ slot, status }) => {
    if (status === 'neutral') return chart.neutral;
    if (status) return theme.palette[status].main;
    return chart.series[(slot ?? free.shift() ?? 0) % chart.series.length];
  });
}

/**
 * The parts of one whole as segments of a single bar, with a legend that names each part, its value
 * and its share. Color follows the chart rules (Rules → Charts): a product meaning takes its series
 * `slot`, a status takes its intent, and the rest take `chart.neutral`; color a bar by series or by status,
 * not both. The bar is decorative: the legend is the text everyone reads, so nothing rests on color or length.
 *
 * @summary Parts of one whole as segments of a bar, with a legend of values and shares.
 * @import import { SegmentedBar } from 'src/components/SegmentedBar';
 */
export function SegmentedBar({ segments, unit, label }: SegmentedBarProps) {
  const total = segments.reduce((sum, { value }) => sum + value, 0);
  if (segments.some(({ status }) => status && status !== 'neutral') && segments.some(({ slot }) => slot !== undefined)) {
    console.warn('A SegmentedBar mixes series slots and statuses; color a bar by series or by status, not both (Rules → Charts).');
  }
  return (
    <Box component="figure" aria-label={label} sx={{ m: 0 }}>
      {/* The bar repeats the legend in shape, so screen readers skip it. Gaps of the surface keep neighbouring parts apart. */}
      <Box aria-hidden sx={{ display: 'flex', gap: '2px', height: 12, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}>
        {segments.map((segment, i) =>
          segment.value > 0 ? (
            <Box key={segment.label} sx={(theme) => ({ flexGrow: segment.value, flexBasis: 0, minWidth: 2, bgcolor: fills(segments, theme)[i] })} />
          ) : null,
        )}
      </Box>
      <Box
        component="ul"
        sx={{ listStyle: 'none', p: 0, m: 0, mt: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', columnGap: 3, rowGap: 1 }}
      >
        {segments.map((segment, i) => (
          <Box component="li" key={segment.label} sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
            <Box aria-hidden sx={(theme) => ({ flex: 'none', width: 8, height: 8, borderRadius: '50%', alignSelf: 'center', bgcolor: fills(segments, theme)[i] })} />
            <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
              {segment.label}
            </Typography>
            <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {whole.format(segment.value)}
              {/* The label names what's counted; screen readers hear the unit with each value too. */}
              <Box component="span" sx={visuallyHidden}>{` ${unit}`}</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', minWidth: '4ch', textAlign: 'right' }}>
              {total > 0 ? percent.format(segment.value / total) : '—'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
