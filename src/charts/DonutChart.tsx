import { useCallback, type ReactNode } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { rgbToHex, useColorScheme } from '@mui/material/styles';
import { createSchemeTheme } from '../mui/theme';
import { seriesColors, seriesSlots, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One part of the whole, and how it takes its color: a fixed `slot` for a product meaning (`meaningColor` from `src/charts/meanings`), `neutral`, or neither for the next free slot, largest first. */
export type DonutSlice = SeriesColor & {
  /** The part's name, shown in the legend and the tooltip, in sentence case. */
  category: string;
  /** The part's value, in `unit`. */
  value: number;
};

export type DonutChartProps = {
  /** The parts of the whole, in any order; the chart sorts them largest first. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: DonutSlice[];
  /** What one unit of value is, shown under the total in the middle and in the tooltip: `properties`, `kWh`, `USD`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** Draws every slice in this one color, stepping down in opacity slice by slice, and the total in it too: for a chart on a colored surface, where the series colors would clash. A palette key, as `sx` takes one (`'secondary.main'`), which follows the color scheme, or a solid CSS color (hex or `rgb()`, not a CSS variable, since the chart draws on a canvas). Default none: slices take `chart.series`. */
  fill?: string;
  /** The hole's radius, in percent of the ring's outer radius: higher is a thinner ring. Default `82`. */
  innerRadius?: number;
  /** The name of the slice that groups the smallest parts when there are more than six. Default `'Other'`. */
  otherLabel?: string;
  /** The ring's height in pixels, the legend not included. Default `220`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
  /** Makes the chart a filter: called with a part's category when its slice or its legend entry is clicked; each legend entry becomes a toggle button. Default none: the chart and its legend are read-only. */
  onSelect?: (category: string) => void;
  /** The categories currently selected, with `onSelect`; while any are, the others step back. Default none. */
  selected?: string[];
};

/** How far an unselected slice steps back while others are selected. */
const dimmedOpacity = 0.35;

/** The opacity of the n-th slice when every slice shares one `fill`: full, then a step down per slice, to a floor. */
const stepOpacity = (index: number) => Math.max(0.28, 1 - index * 0.22);

/** Each scheme's palette, to resolve a `fill` palette key for the canvas, which can't read the theme's CSS variables. */
const palettes = { light: createSchemeTheme('light').palette, dark: createSchemeTheme('dark').palette };

/** A `fill` as a solid color for the canvas: a palette key (`'secondary.main'`) takes the scheme's value; anything else is a CSS color already. */
function resolveFill(fill: string, scheme: 'light' | 'dark'): string {
  const value = fill.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), palettes[scheme]);
  return rgbToHex(typeof value === 'string' ? value : fill);
}

/** The total in the middle and the shares in the legend and tooltips, formatted with Intl (Rules → Content and layout). */
const whole = new Intl.NumberFormat();
const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });

/** The most slices a donut shows: the number of `chart.series` colors (Rules → Charts). */
const maxSlices = 6;

/**
 * The parts, largest first. Past six, the five largest keep their slices and the rest are
 * summed into one `otherLabel` slice, drawn in `chart.neutral`.
 */
function slices(data: DonutSlice[], otherLabel: string): DonutSlice[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  if (sorted.length <= maxSlices) return sorted;
  const rest = sorted.slice(maxSlices - 1);
  return [...sorted.slice(0, maxSlices - 1), { category: otherLabel, value: rest.reduce((sum, part) => sum + part.value, 0), neutral: true }];
}

/**
 * A donut chart of the parts of one whole, in Kilowatt's chart theme (Rules → Charts): a
 * reference implementation that Enertiv's app rebuilds. A thin ring with the total in the middle
 * (the number large, the unit under it), and a legend under the ring naming each part and its
 * share; the slices have no labels. Slices take `chart.series` colors, largest first, or a fixed
 * `slot` for a product meaning, or every one the same `fill` at stepped opacities. Past six parts,
 * the smallest are grouped into one neutral slice. The chart sits in a `figure` named by `summary`.
 * With `onSelect` it's a filter: a slice, or its legend entry (a toggle button), selects its part.
 * Put it in a `Card` under a `CardHeader`.
 *
 * @summary A donut chart of up to six parts of a whole, with the total in the middle and a legend that can filter.
 * @import import { DonutChart } from 'src/charts/DonutChart';
 */
export function DonutChart({
  data,
  unit,
  summary,
  fill,
  innerRadius = 82,
  otherLabel = 'Other',
  height = 220,
  inset = 2,
  onSelect,
  selected,
}: DonutChartProps) {
  const picked = selected ?? [];
  const dimmed = (category: string) => picked.length > 0 && !picked.includes(category);
  // A string, so the chart rebuilds when the selection changes but not when the array is only recreated.
  const pickedKey = picked.join('\u0000');
  const parts = slices(data, otherLabel);
  const total = data.reduce((sum, part) => sum + part.value, 0);
  const share = (value: number) => (total ? percent.format(value / total) : '–');
  const slots = seriesSlots(parts);
  const { mode, systemMode } = useColorScheme();
  const scheme = (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';
  // The canvas takes the resolved color; the HTML (the total, the swatches) takes `fill` as it is, through `sx`.
  const solidFill = fill ? resolveFill(fill, scheme) : undefined;
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      const chart = root.container.children.push(am5percent.PieChart.new(root, { innerRadius: am5.percent(innerRadius) }));
      const series = chart.series.push(am5percent.PieSeries.new(root, { categoryField: 'category', valueField: 'value', alignLabels: false }));
      // The legend under the ring names the parts, so the slices carry no labels or ticks.
      series.labels.template.set('forceHidden', true);
      series.ticks.template.set('forceHidden', true);
      series.slices.template.setAll({
        templateField: 'sliceSettings',
        strokeOpacity: 0,
        tooltipText: `{category}: {value.formatNumber('${tooltipNumberFormat}')} ${unit} ({share})`,
      });
      const parts = slices(data, otherLabel);
      const total = data.reduce((sum, part) => sum + part.value, 0);
      const share = (value: number) => (total ? percent.format(value / total) : '–');
      const chosen = pickedKey ? pickedKey.split('\u0000') : [];
      const dim = (category: string) => (chosen.length > 0 && !chosen.includes(category) ? dimmedOpacity : 1);
      if (onSelect) {
        series.slices.template.set('cursorOverStyle', 'pointer');
        series.slices.template.events.on('click', ({ target }) => {
          const category = (target.dataItem?.dataContext as { category?: string } | undefined)?.category;
          if (category) onSelect(category);
        });
      }
      // One color for every slice, stepped down in opacity; otherwise slices with a slot keep it, so a meaning is one color on every chart, and the rest take the free slots, largest first.
      const mono = solidFill ? am5.color(solidFill) : undefined;
      const fills = seriesColors(parts, colors);
      series.data.setAll(
        parts.map(({ category, value }, i) => ({
          category,
          value,
          share: share(value),
          sliceSettings: { fill: mono ?? fills[i], fillOpacity: (mono ? stepOpacity(i) : 1) * dim(category) },
        })),
      );
    },
    [data, unit, solidFill, innerRadius, otherLabel, onSelect, pickedKey],
  );
  const ref = useChart(build);

  const legend = parts.map(({ category, value }, i) => {
    const slot = slots[i];
    const swatch = (
      <Box
        aria-hidden
        sx={(theme) => {
          const { chart } = (theme.vars ?? theme).palette;
          return {
            width: 12,
            height: 12,
            flex: 'none',
            borderRadius: 0.5,
            bgcolor: fill ?? (slot === 'neutral' ? chart.neutral : chart.series[slot]),
            opacity: (fill ? stepOpacity(i) : 1) * (dimmed(category) ? dimmedOpacity : 1),
          };
        }}
      />
    );
    // The separator is hidden from screen readers, so an entry reads "Office 42%".
    const label: ReactNode = (
      <>
        {category} <span aria-hidden>·</span> {share(value)}
      </>
    );
    return { category, swatch, label };
  });

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box sx={{ position: 'relative', height }}>
        <Box ref={ref} sx={{ height: 1 }} />
        {/* The total in the hole, as text in the page's type: the pie is centered in its box, so the total is too. */}
        <Stack sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textAlign: 'center' }}>
          <Typography variant="h2" component="p" sx={{ fontVariantNumeric: 'tabular-nums', color: fill ?? 'text.primary' }}>
            {whole.format(total)}
          </Typography>
          <Typography variant="body2" sx={{ color: fill ?? 'text.secondary' }}>
            {unit}
          </Typography>
        </Stack>
      </Box>
      {/* The legend: read-only text, or with onSelect one toggle button per part, so the filter works by keyboard and names what each color is. */}
      <Stack
        component="ul"
        direction="row"
        aria-label={onSelect ? `Filter ${summary}` : undefined}
        sx={{ listStyle: 'none', m: 0, p: 0, pt: 1.5, columnGap: onSelect ? 1 : 2, rowGap: onSelect ? 1 : 0.5, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {legend.map(({ category, swatch, label }) => (
          <li key={category}>
            {onSelect ? (
              <ToggleButton value={category} selected={picked.includes(category)} onChange={() => onSelect(category)} sx={{ gap: 1, fontVariantNumeric: 'tabular-nums' }}>
                {swatch}
                {label}
              </ToggleButton>
            ) : (
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                {swatch}
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {label}
                </Typography>
              </Stack>
            )}
          </li>
        ))}
      </Stack>
    </Box>
  );
}
