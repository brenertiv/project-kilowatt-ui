import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import { stackOrder } from '../charts/stackOrder';
import type { ChartStatus } from '../charts/theme';
import type { ColorScheme } from '../mui/departures';
import { createSchemeTheme } from '../mui/theme';

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
  /**
   * Marks the negative part of a positive-and-negative pair (Vacant beside Leased, Unsold beside Sold, Not metered
   * beside Metered). It's drawn in `chart.seriesShade`, a shade darker than the card in light and lighter than it in
   * dark, after its positive part, which takes `slot` 0 (brand blue) or 1 (aquaverde). Default `false`.
   */
  negative?: boolean;
};

export type SegmentedBarProps = {
  /** The parts. The bar and its legend order them by color, lightest at the left to darkest at the right across all of them, reversed in dark (`stackOrder`); parts of one color keep the order given here, which is also the order screen readers hear. A `negative` part comes last, after its positive, in both schemes. Parts with no value stay in the legend. */
  segments: Segment[];
  /** The unit of the values, written after each one in the legend: `work orders`. */
  unit: string;
  /** What the whole is, for screen readers and as the legend's name: `Work orders by status`. */
  label: string;
};

const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });
const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

type Palette = Theme['palette'] | NonNullable<Theme['vars']>['palette'];

/** Each scheme's palette with its values, which a stack's order is worked out from: the active palette holds CSS variables. */
const schemePalettes = { light: createSchemeTheme('light').palette, dark: createSchemeTheme('dark').palette };

/**
 * Each segment's color from a palette, following the chart rules: slots for meanings, the intents for status,
 * `chart.neutral` otherwise, and `chart.seriesShade` for a `negative` part.
 */
function fills(segments: Segment[], palette: Palette): string[] {
  const { chart } = palette;
  const taken = new Set(segments.flatMap(({ slot, negative }) => (slot === undefined || negative ? [] : [slot])));
  const free = chart.series.map((_, slot) => slot).filter((slot) => !taken.has(slot));
  return segments.map(({ slot, status, negative }) => {
    if (negative) return chart.seriesShade;
    if (status === 'neutral') return chart.neutral;
    if (status) return palette[status].main;
    return chart.series[(slot ?? free.shift() ?? 0) % chart.series.length];
  });
}

/**
 * Each segment's color and place, for its part of the bar and its legend item. The color is a CSS value read through
 * `theme.vars`, so it follows the active color scheme (under CSS variables, `theme.palette` is the default scheme's).
 * The place is a CSS `order`: the bar runs lightest at the left to darkest at the right across all its colors, and
 * dark reverses it (Rules → Charts → A stack runs dark to light), so each scheme's order comes from that scheme's own
 * colors and dark's is set under its selector. A negative part is the exception: it comes last in both schemes, after its positive.
 */
function placed(segments: Segment[], theme: Theme) {
  const colors = fills(segments, theme.vars?.palette ?? theme.palette);
  const places = (scheme: ColorScheme) => {
    const byColor = stackOrder(fills(segments, schemePalettes[scheme]), scheme, true);
    const order = [...byColor.filter((i) => !segments[i].negative), ...byColor.filter((i) => segments[i].negative)];
    return segments.map((_, i) => order.indexOf(i));
  };
  const [light, dark] = [places('light'), places('dark')];
  return segments.map((_, i) => ({ bgcolor: colors[i], order: light[i], ...theme.applyStyles('dark', { order: dark[i] }) }));
}

/**
 * The parts of one whole as segments of a single bar, with a legend that names each part, its value
 * and its share. Color follows the chart rules (Rules → Charts): a product meaning takes its series
 * `slot`, a status takes its intent, and the rest take `chart.neutral`; color a bar by series or by status,
 * not both. A positive part takes brand blue or aquaverde (slot 0 or 1) and its `negative` takes `chart.seriesShade`, a shade off the
 * card, after it. The bar and its legend otherwise run lightest at the left to darkest at the right across all their colors, reversed in dark. The bar is decorative: the legend is the text everyone reads, so nothing rests on color or length.
 *
 * @summary Parts of one whole as segments of a bar, with a legend of values and shares.
 * @import import { SegmentedBar } from 'src/components/SegmentedBar';
 */
export function SegmentedBar({ segments, unit, label }: SegmentedBarProps) {
  const total = segments.reduce((sum, { value }) => sum + value, 0);
  if (segments.some(({ status }) => status && status !== 'neutral') && segments.some(({ slot }) => slot !== undefined)) {
    console.warn('A SegmentedBar mixes series slots and statuses; color a bar by series or by status, not both (Rules → Charts).');
  }
  if (segments.some(({ negative }) => negative) && segments.some(({ negative, slot, status }) => !negative && (status !== undefined || (slot ?? 0) > 1))) {
    console.warn('A SegmentedBar has a negative part whose positive is not in slot 0 or 1; a positive part is brand blue or aquaverde (Rules → Charts).');
  }
  return (
    <Box component="figure" aria-label={label} sx={{ m: 0 }}>
      {/* The bar repeats the legend in shape, so screen readers skip it. Gaps of the surface keep neighbouring parts apart. */}
      <Box aria-hidden sx={{ display: 'flex', gap: '2px', height: 12, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}>
        {segments.map((segment, i) =>
          segment.value > 0 ? (
            <Box key={segment.label} sx={(theme) => ({ flexGrow: segment.value, flexBasis: 0, minWidth: 2, ...placed(segments, theme)[i] })} />
          ) : null,
        )}
      </Box>
      <Box
        component="ul"
        sx={{ listStyle: 'none', p: 0, m: 0, mt: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', columnGap: 3, rowGap: 1 }}
      >
        {segments.map((segment, i) => (
          <Box
            component="li"
            key={segment.label}
            // The legend reads in the bar's order, so the item takes the place; its dot takes the color.
            sx={(theme) => ({ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0, ...placed(segments, theme)[i], bgcolor: undefined })}
          >
            <Box aria-hidden sx={(theme) => ({ flex: 'none', width: 8, height: 8, borderRadius: '50%', alignSelf: 'center', bgcolor: placed(segments, theme)[i].bgcolor })} />
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
