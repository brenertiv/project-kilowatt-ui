import { useCallback } from 'react';
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy';
import Box from '@mui/material/Box';
import { seriesColors, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One part of the whole, and how it takes its color: a fixed `slot` for a product meaning (`meaningColor` from `src/charts/meanings`), `neutral`, or neither for the next free slot, largest first. */
export type TreemapNode = SeriesColor & {
  /** The part's name, shown in its label and tooltip, in sentence case. */
  category: string;
  /** The part's value, in `unit`. */
  value: number;
};

export type TreemapProps = {
  /** The parts of the whole, in any order; the chart places them largest first. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: TreemapNode[];
  /** The unit of the values, shown in the tooltip: `kWh`, `sq ft`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The name of the rectangle that groups the smallest parts when there are more than six. Default `'Other'`. */
  otherLabel?: string;
  /** The chart's height in pixels. Default `240`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** Shares in the labels and tooltips, formatted with Intl (Rules → Content and layout). */
const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });

/** The most rectangles a treemap shows: the number of `chart.series` colors (Rules → Charts). */
const maxParts = 6;

/**
 * The parts, largest first. Past six, the five largest keep their rectangles and the rest are
 * summed into one `otherLabel` rectangle, drawn in `chart.neutral`.
 */
function parts(data: TreemapNode[], otherLabel: string) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  if (sorted.length <= maxParts) return { kept: sorted, other: undefined };
  const kept = sorted.slice(0, maxParts - 1);
  const rest = sorted.slice(maxParts - 1);
  return { kept, other: { category: otherLabel, value: rest.reduce((sum, part) => sum + part.value, 0) } };
}

/**
 * A treemap of the parts of one whole, in Kilowatt's chart theme (Rules → Charts): a reference
 * implementation that Enertiv's app rebuilds. Each part is a rectangle sized by its value, largest
 * first, labeled with its name and share where it fits; the tooltip gives every part's exact value.
 * Rectangles take `chart.series` colors, or a fixed `slot` for a product meaning. Past six parts,
 * the smallest are grouped into one neutral rectangle. It's one level deep: a click doesn't drill
 * in. The chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A treemap of up to six parts of a whole, sized by value and labeled with their shares, with the smallest grouped into Other.
 * @import import { Treemap } from 'src/charts/Treemap';
 */
export function Treemap({ data, unit, summary, otherLabel = 'Other', height = 240, inset = 2 }: TreemapProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const series = root.container.children.push(
        am5hierarchy.Treemap.new(root, {
          valueField: 'value',
          categoryField: 'category',
          childDataField: 'children',
          fillField: 'fill',
          // The root is the whole and isn't drawn; its children are the parts, one level deep.
          topDepth: 1,
          initialDepth: 1,
        }),
      );
      // One level deep, so a part has nothing to drill into: no click, no pointer cursor.
      series.nodes.template.setAll({
        toggleKey: 'none',
        cursorOverStyle: 'default',
        tooltipText: `{category}: {sum.formatNumber('${tooltipNumberFormat}')} ${unit} ({share})`,
      });
      // A label that doesn't fit its rectangle is hidden rather than shrunk; the tooltip still names the part.
      series.labels.template.setAll({ text: '{category}\n{share}', textAlign: 'center', oversizedBehavior: 'hide' });
      const { kept, other } = parts(data, otherLabel);
      const total = data.reduce((sum, part) => sum + part.value, 0);
      const share = (value: number) => (total ? percent.format(value / total) : '–');
      // Parts with a slot keep it, so a meaning is one color on every chart; the rest take the free slots, largest first.
      const fills = seriesColors(kept, colors);
      series.data.setAll([
        {
          category: 'Whole',
          children: [
            ...kept.map(({ category, value }, i) => ({ category, value, share: share(value), fill: fills[i] })),
            ...(other ? [{ ...other, share: share(other.value), fill: colors.neutral }] : []),
          ],
        },
      ]);
      series.set('selectedDataItem', series.dataItems[0]);
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
