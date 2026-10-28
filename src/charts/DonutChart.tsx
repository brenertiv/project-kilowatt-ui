import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import { seriesColors, seriesSlots, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One part of the whole, and how it takes its color: a fixed `slot` for a product meaning (`meaningColor` from `src/charts/meanings`), `neutral`, or neither for the next free slot, largest first. */
export type DonutSlice = SeriesColor & {
  /** The part's name, shown in its label and tooltip, in sentence case. */
  category: string;
  /** The part's value, in `unit`. */
  value: number;
};

export type DonutChartProps = {
  /** The parts of the whole, in any order; the chart sorts them largest first. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: DonutSlice[];
  /** The unit of the values, shown in the tooltip: `kWh`, `USD`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The name of the slice that groups the smallest parts when there are more than six. Default `'Other'`. */
  otherLabel?: string;
  /** The chart's height in pixels. Default `280`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
  /** Makes the chart a filter: called with a part's category when its slice or its toggle under the chart is clicked. Default none: the chart is read-only. */
  onSelect?: (category: string) => void;
  /** The categories currently selected, with `onSelect`; while any are, the others step back. Default none. */
  selected?: string[];
};

/** How far an unselected slice steps back while others are selected. */
const dimmedOpacity = 0.35;

/** Shares in the labels and tooltips, formatted with Intl (Rules → Content and layout). */
const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });

/** The most slices a donut shows: the number of `chart.series` colors (Rules → Charts). */
const maxSlices = 6;

/**
 * The parts, largest first. Past six, the five largest keep their slices and the rest are
 * summed into one `otherLabel` slice, drawn in `chart.neutral`.
 */
function slices(data: DonutSlice[], otherLabel: string) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  if (sorted.length <= maxSlices) return { parts: sorted, other: undefined };
  const kept = sorted.slice(0, maxSlices - 1);
  const rest = sorted.slice(maxSlices - 1);
  return { parts: kept, other: { category: otherLabel, value: rest.reduce((sum, part) => sum + part.value, 0) } };
}

/**
 * A donut chart of the parts of one whole, in Kilowatt's chart theme (Rules → Charts): a
 * reference implementation that Enertiv's app rebuilds. Slices take `chart.series` colors,
 * largest first, or a fixed `slot` for a product meaning, and are labeled directly with their share. Past six parts, the smallest are
 * grouped into one neutral slice. The chart sits in a `figure` named by `summary`.
 * With `onSelect` it's a filter: a slice, or its toggle button under the chart, selects its part.
 * Put it in a `Card` under a `CardHeader`.
 *
 * @summary A donut chart of up to six parts of a whole, labeled directly, with the smallest grouped into Other.
 * @import import { DonutChart } from 'src/charts/DonutChart';
 */
export function DonutChart({ data, unit, summary, otherLabel = 'Other', height = 280, inset = 2, onSelect, selected }: DonutChartProps) {
  const picked = selected ?? [];
  const dimmed = (category: string) => picked.length > 0 && !picked.includes(category);
  // A string, so the chart rebuilds when the selection changes but not when the array is only recreated.
  const pickedKey = picked.join('\u0000');
  const { parts, other } = slices(data, otherLabel);
  const total = data.reduce((sum, part) => sum + part.value, 0);
  const share = (value: number) => percent.format(value / total);
  const slots = seriesSlots(parts);
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5percent.PieChart.new(root, { innerRadius: am5.percent(60), radius: am5.percent(50) }));
      const series = chart.series.push(
        am5percent.PieSeries.new(root, { categoryField: 'category', valueField: 'value', legendLabelText: '{category}' }),
      );
      series.slices.template.set('templateField', 'sliceSettings');
      // Aligned labels (amCharts' default) space themselves out, so small neighbouring slices stay readable.
      series.labels.template.setAll({ text: '{category} {share}', oversizedBehavior: 'truncate', maxWidth: 140 });
      series.slices.template.set('tooltipText', `{category}: {value.formatNumber('${tooltipNumberFormat}')} ${unit} ({share})`);
      const { parts, other } = slices(data, otherLabel);
      const total = data.reduce((sum, part) => sum + part.value, 0);
      const share = (value: number) => percent.format(value / total);
      const chosen = pickedKey ? pickedKey.split('\u0000') : [];
      const fillOpacity = (category: string) => (chosen.length > 0 && !chosen.includes(category) ? dimmedOpacity : 1);
      if (onSelect) {
        series.slices.template.set('cursorOverStyle', 'pointer');
        series.slices.template.events.on('click', ({ target }) => {
          const category = (target.dataItem?.dataContext as { category?: string } | undefined)?.category;
          if (category) onSelect(category);
        });
      }
      // Slices with a slot keep it, so a work-order type is one color on every chart; the rest take the free slots, largest first.
      const fills = seriesColors(parts, colors);
      series.data.setAll([
        ...parts.map(({ category, value }, i) => ({ category, value, share: share(value), sliceSettings: { fill: fills[i], fillOpacity: fillOpacity(category) } })),
        ...(other ? [{ ...other, share: share(other.value), sliceSettings: { fill: colors.neutral, fillOpacity: fillOpacity(other.category) } }] : []),
      ]);
    },
    [data, unit, otherLabel, onSelect, pickedKey],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
      {onSelect && (
        // The slices as toggle buttons, so the filter works by keyboard and names what each color is.
        <Stack component="ul" direction="row" aria-label={`Filter ${summary}`} sx={{ listStyle: 'none', m: 0, p: 0, gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[...parts.map((part, i) => ({ ...part, slot: slots[i] })), ...(other ? [{ ...other, slot: 'neutral' as const }] : [])].map(({ category, value, slot }) => (
            <li key={category}>
              <ToggleButton value={category} selected={picked.includes(category)} onChange={() => onSelect(category)} sx={{ gap: 1 }}>
                <Box
                  aria-hidden
                  sx={(theme) => ({
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    bgcolor: slot === 'neutral' ? (theme.vars ?? theme).palette.chart.neutral : (theme.vars ?? theme).palette.chart.series[slot],
                    opacity: dimmed(category) ? dimmedOpacity : 1,
                  })}
                />
                {category} {share(value)}
              </ToggleButton>
            </li>
          ))}
        </Stack>
      )}
    </Box>
  );
}
