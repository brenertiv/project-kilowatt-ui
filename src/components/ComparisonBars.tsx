import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { TruncatedText } from './TruncatedText';

/** One figure in a `ComparisonBars`: a period and its value. */
export type ComparisonRow = {
  /** What the figure is: the period's name, `Jan–Jun 2026`. */
  label: string;
  /** The figure, in the chart's `unit`. Leave it out where there is no data: the row draws an outline and says No data. */
  value?: number;
  /** The baseline row, drawn in `chart.neutral`. Default `false`: the first series color. */
  neutral?: boolean;
};

export type ComparisonBarsProps = {
  /** The figures, in reading order: the period that is the point first, then its baseline. */
  rows: ComparisonRow[];
  /** The unit, written after each value: `kWh`. */
  unit: string;
  /** What the comparison is, for screen readers: the list's accessible name. */
  label: string;
};

const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/** A row's color, read through `theme.vars` so the bars follow the active color scheme. */
function barColor(theme: Theme, neutral?: boolean): string {
  const { chart } = (theme.vars ?? theme).palette;
  return neutral ? chart.neutral : chart.series[0];
}

/**
 * Two or three figures side by side as bars: this period against the same months a year earlier. The period that is
 * the point takes the first series color and the baseline `chart.neutral` (Rules → Charts, Highlight, don't rainbow);
 * a row with no figure is an outline. Each row names its period and writes its value in full, so nothing rests on the
 * bar alone. Built from MUI's `Box` and `Typography`, as `SegmentedBar` is: a bar and its label need no canvas.
 *
 * @summary A few figures as labelled bars, one highlighted against a neutral baseline.
 * @import import { ComparisonBars } from 'src/components/ComparisonBars';
 */
export function ComparisonBars({ rows, unit, label }: ComparisonBarsProps) {
  const top = Math.max(0, ...rows.map((row) => row.value ?? 0));
  return (
    <Stack component="ul" aria-label={label} sx={{ listStyle: 'none', m: 0, p: 0, gap: 1.5 }}>
      {rows.map((row) => {
        const empty = row.value === undefined;
        const width = empty || top === 0 ? 0 : Math.max(2, (row.value! / top) * 100);
        return (
          <Stack component="li" key={row.label} sx={{ gap: 0.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
              {/* A long label truncates with its full text in a tooltip (Rules → Content and layout). */}
              <Typography variant="caption" color="text.secondary" component="div" sx={{ minWidth: 0 }}>
                <TruncatedText>{row.label}</TruncatedText>
              </Typography>
              <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {empty ? 'No data' : `${whole.format(row.value!)} ${unit}`}
              </Typography>
            </Stack>
            {/* The track is the card's surface edge; the bar fills its share of the largest figure. */}
            <Box
              aria-hidden
              sx={(theme) => ({
                height: 8,
                borderRadius: 1,
                border: 1,
                borderColor: empty ? barColor(theme, row.neutral) : 'transparent',
                bgcolor: empty ? 'transparent' : 'background.level2',
                overflow: 'hidden',
              })}
            >
              {!empty && <Box sx={(theme) => ({ height: '100%', width: `${width}%`, bgcolor: barColor(theme, row.neutral), borderRadius: 1 })} />}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
