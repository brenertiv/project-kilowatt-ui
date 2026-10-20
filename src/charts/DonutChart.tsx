import { useCallback } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import Box from '@mui/material/Box';
import { tooltipNumberFormat, type ChartInset } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One part of the whole. */
export type DonutSlice = {
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
};

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
 * largest first, and are labeled directly with their share. Past six parts, the smallest are
 * grouped into one neutral slice. The chart sits in a `figure` named by `summary`.
 * Put it in a `Card` under a `CardHeader`.
 *
 * @summary A donut chart of up to six parts of a whole, labeled directly, with the smallest grouped into Other.
 * @import import { DonutChart } from 'src/charts/DonutChart';
 */
export function DonutChart({ data, unit, summary, otherLabel = 'Other', height = 280, inset = 2 }: DonutChartProps) {
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
      series.data.setAll([
        ...parts.map((part, i) => ({ ...part, share: share(part.value), sliceSettings: { fill: colors.series[i] } })),
        ...(other ? [{ ...other, share: share(other.value), sliceSettings: { fill: colors.neutral } }] : []),
      ]);
    },
    [data, unit, otherLabel],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
