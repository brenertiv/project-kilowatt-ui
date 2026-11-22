import { useCallback } from 'react';
import type * as am5 from '@amcharts/amcharts5';
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy';
import Box from '@mui/material/Box';
import { seriesColors, seriesSlots, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One node of the hierarchy: a leaf with a `value`, or a group with `children`, whose value is their sum. */
export type PartitionNode = SeriesColor & {
  /** The node's name, shown in its label and tooltip, in sentence case. */
  name: string;
  /** A leaf's value, in `unit`. A group takes the sum of its children. */
  value?: number;
  /** A group's parts. */
  children?: PartitionNode[];
};

export type PartitionChartProps = {
  /** The whole: one root node with its branches as `children`, each a leaf or a group, to any depth (two or three levels read well). A branch may take a `slot` for a product meaning. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: PartitionNode;
  /** The unit of the values, shown in the tooltip: `kWh`, `USD`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The chart's height in pixels. Default `320`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** Shares in the labels and tooltips, formatted with Intl (Rules → Content and layout). */
const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });

/** A node's value: its own, or the sum of its children's. */
const sum = (node: PartitionNode): number => (node.children ? node.children.reduce((total, child) => total + sum(child), 0) : (node.value ?? 0));

/** How many levels sit under a node: 0 for a leaf. */
const levels = (node: PartitionNode): number => (node.children?.length ? 1 + Math.max(...node.children.map(levels)) : 0);

/**
 * A partition (icicle) chart of a hierarchy, in Kilowatt's chart theme (Rules → Charts): a reference
 * implementation that Enertiv's app rebuilds. The whole is a column at the left, and each level sits a
 * column further right, every rectangle as tall as its share: a building, its systems, their equipment.
 * Each branch takes a `chart.series` color in order (or a fixed `slot`) and its descendants keep it, so
 * color names the branch and position the level; the whole is drawn in `chart.neutral`. Rectangles are
 * labeled with their name and share where they fit, in the palette's contrast text, and every one has a
 * full-value tooltip. A click on a group zooms into it, and a click on the column at its left zooms back
 * out. The chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A partition (icicle) chart of a hierarchy: the whole at the left, each level a column further right, sized by value.
 * @import import { PartitionChart } from 'src/charts/PartitionChart';
 */
export function PartitionChart({ data, unit, summary, height = 320, inset = 2 }: PartitionChartProps) {
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const series = root.container.children.push(
        am5hierarchy.Partition.new(root, {
          valueField: 'value',
          categoryField: 'name',
          childDataField: 'children',
          fillField: 'fill',
          orientation: 'horizontal',
          // Every level shows at once, each its share of the width; a click zooms into a branch.
          singleBranchOnly: false,
          downDepth: levels(data),
          initialDepth: levels(data),
        }),
      );
      series.nodes.template.set('tooltipText', `{category}: {sum.formatNumber('${tooltipNumberFormat}')} ${unit} ({share})`);
      // Rectangles are parted by a 2px line of the card surface, as a treemap's are by its gaps.
      series.rectangles.template.setAll({ stroke: colors.surface, strokeWidth: 2, strokeOpacity: 1 });
      // A label that doesn't fit its rectangle is hidden rather than shrunk or turned; the tooltip still names the node.
      series.labels.template.setAll({ text: '{category}\n{share}', textAlign: 'center', oversizedBehavior: 'hide' });
      // Each label in the palette's contrast text for its rectangle's color.
      series.labels.template.adapters.add('fill', (value, target) => (target.dataItem?.dataContext as { label?: am5.Color } | undefined)?.label ?? value);

      const branches = data.children ?? [];
      // Branches with a slot keep it, so a meaning is one color on every chart; the rest take the free slots in order.
      const fills = seriesColors(branches, colors);
      const slots = seriesSlots(branches, colors.series.length);
      const total = sum(data);
      const share = (node: PartitionNode) => (total ? percent.format(sum(node) / total) : '–');
      // A branch's descendants keep its color: color names the branch, and the column the level.
      const colored = (node: PartitionNode, fill: am5.Color, label: am5.Color): Record<string, unknown> => ({
        name: node.name,
        share: share(node),
        fill,
        label,
        ...(node.children ? { children: node.children.map((child) => colored(child, fill, label)) } : { value: node.value ?? 0 }),
      });
      series.data.setAll([
        {
          name: data.name,
          share: share(data),
          fill: colors.neutral,
          label: colors.contrast.neutral,
          children: branches.map((branch, i) => {
            const slot = slots[i];
            return colored(branch, fills[i], typeof slot === 'string' ? colors.contrast[slot] : colors.contrast.series[slot]);
          }),
        },
      ]);
      series.set('selectedDataItem', series.dataItems[0]);
    },
    [data, unit],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
    </Box>
  );
}
