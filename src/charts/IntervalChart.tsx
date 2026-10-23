import { useCallback, useRef, useState } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { Icon } from '../icons';
import { axisUnit, legend, referenceLines, seriesColors, tooltipNumberFormat, type ChartInset, type ReferenceLine, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One line of readings: the data field it plots, its name in the legend and tooltip, and how it takes its color. */
export type IntervalSeries = SeriesColor & {
  /** The field in each data row that holds this line's readings. */
  field: string;
  /** The line's name in the legend and tooltip, in sentence case. */
  name: string;
};

/** How readings combine into a longer interval when the chart groups them: `average` for a rate (kW), `sum` for an amount (kWh), `high` for a peak. */
export type IntervalAggregate = 'average' | 'sum' | 'high';

/** A target the readings are held to, such as a demand limit: a dashed reference line, with the readings past it highlighted. */
export type IntervalTarget = ReferenceLine & {
  /** Which side of the target is past it: `above` for a limit not to exceed, `below` for a minimum to keep. Default `'above'`. */
  past?: 'above' | 'below';
};

export type IntervalChartProps = {
  /** The readings, oldest first, each with a UTC timestamp in `dateField` and a number per series: tens of thousands of rows is expected. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: Record<string, number>[];
  /** The lines, in legend order: one, or a few to compare. Keep it stable, like `data`. */
  series: IntervalSeries[];
  /** The unit of the readings, shown above the value axis and in the tooltip: `kW`, `kWh`. */
  unit: string;
  /** How readings combine when the chart groups them into hours, days, weeks or months. Default `'average'`. */
  aggregate?: IntervalAggregate;
  /** A target the readings are held to: a dashed line labeled with its name and value. The line is drawn in `chart.neutral` where it's within the target and in its own hue, filled to the target, where it's past it; the tooltip says so in words. Keep it stable, like `data`. Default none. */
  target?: IntervalTarget;
  /** One sentence on what the chart shows, with the numbers that matter. It isn't shown: it's the figure's accessible name, the chart's text alternative for screen readers. */
  summary: string;
  /** The field in each row that holds the UTC timestamp. Default `'date'`. */
  dateField?: string;
  /** The time between readings, in minutes. Default `15`. */
  intervalMinutes?: number;
  /** The plot's height in pixels, without the scrollbar. Default `240`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** The longer intervals readings group into as the chart zooms out, shortest first. */
const groupIntervals: am5.time.ITimeInterval[] = [
  { timeUnit: 'hour', count: 1 },
  { timeUnit: 'day', count: 1 },
  { timeUnit: 'week', count: 1 },
  { timeUnit: 'month', count: 1 },
];

/** Most points in view before readings group into a longer interval. */
const groupCount = 400;

/** The scrollbar's height in pixels: the preview, and the hit area of its grips. */
const scrollbarHeight = 40;
/** The space between the date labels and the scrollbar, and between the scrollbar and the reset button, in pixels. */
const scrollbarGap = 8;
/** The reset button's width in pixels: a medium `IconButton`, as tall as the scrollbar. */
const resetWidth = 40;

/** How strongly the stretch past a target is filled, in the line's hue: the amCharts demo's tint, light enough that gridlines show through. */
const pastFillOpacity = 0.2;

/** What the tooltip says a grouped value is: `daily average`, `weekly peak`. */
const periods: Partial<Record<am5.time.TimeUnit, string>> = { hour: 'hourly', day: 'daily', week: 'weekly', month: 'monthly' };
const aggregates: Record<IntervalAggregate, string> = { average: 'average', sum: 'total', high: 'peak' };

/**
 * A line chart of meter readings at a fine interval (15-minute demand over a year), in Kilowatt's chart
 * theme (Rules → Charts): a reference implementation that Enertiv's app rebuilds. Tens of thousands of
 * readings stay fast because the chart groups them into hours, days, weeks or months by `aggregate` as it
 * zooms out, and back as it zooms in; the tooltip names the grouping (`daily average`). Swipe up or down
 * with two fingers (or pinch, or turn the mouse wheel) over the plot to zoom, swipe sideways to pan, drag
 * across the plot to zoom to a range, use the scrollbar below it to pan or resize the view (its grips take the arrow keys), and
 * the button at the scrollbar's right to show the whole period again. Lines take `chart.series` colors
 * in order, or a fixed `slot`; the scrollbar's preview is `chart.neutral`. A `target` draws a dashed reference
 * line and highlights the readings past it: the line is `chart.neutral` within the target and takes its hue,
 * filled to the target, past it. The chart sits in a `figure`
 * named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A zoomable line chart of fine-interval readings that groups them by hour, day, week or month as it zooms, named by a one-line summary for screen readers.
 * @import import { IntervalChart } from 'src/charts/IntervalChart';
 */
export function IntervalChart({
  data,
  series,
  unit,
  aggregate = 'average',
  target,
  summary,
  dateField = 'date',
  intervalMinutes = 15,
  height = 240,
  inset = 2,
}: IntervalChartProps) {
  const [zoomed, setZoomed] = useState(false);
  const xAxisRef = useRef<am5xy.DateAxis<am5xy.AxisRenderer>>(undefined);
  const build = useCallback(
    ({ root, colors }: ChartContext) => {
      root.utc = true;
      const baseInterval: am5.time.ITimeInterval = { timeUnit: 'minute', count: intervalMinutes };
      const chart = root.container.children.push(
        // No bottom padding: the scrollbar ends the chart, level with the reset button beside it; the figure's inset pads below.
        // Over the plot, a two-finger swipe up or down (or a pinch, or the mouse wheel) zooms, and a sideways swipe pans.
        am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0, paddingBottom: 0, panX: false, panY: false, wheelX: 'panX', wheelY: 'zoomX' }),
      );
      const xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          baseInterval,
          groupData: true,
          groupCount,
          groupIntervals: [baseInterval, ...groupIntervals.filter(({ timeUnit }) => timeUnit !== 'minute')],
          maxDeviation: 0,
          renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }),
          // The cursor's date, on the axis: amCharts writes it for the interval in view (its `tooltipDateFormats`).
          tooltip: am5.Tooltip.new(root, {}),
        }),
      );
      // A label at the plot's left edge would sit half outside the chart, so none is drawn there.
      xAxis.get('renderer').labels.template.set('minPosition', 0.02);
      // Zooming out is an MUI button beside the scrollbar (below), not amCharts' own over the plot.
      chart.zoomOutButton.set('forceHidden', true);
      // A rebuild (the color scheme changed) starts from the whole period again.
      xAxisRef.current = xAxis;
      setZoomed(false);
      const updateZoomed = () => setZoomed((xAxis.get('start') ?? 0) > 0.0001 || (xAxis.get('end') ?? 1) < 0.9999);
      xAxis.on('start', updateZoomed);
      xAxis.on('end', updateZoomed);
      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, { opposite: true }) }));
      axisUnit(root, chart, yAxis, unit);
      if (target && series.filter(({ neutral }) => !neutral).length > 1) {
        console.warn('An IntervalChart with a target has more than one colored line; highlight one line against its target (Rules → Charts).');
      }

      const strokes = seriesColors(series, colors);
      const lines = series.map(({ field, name }, i) =>
        chart.series.push(
          am5xy.LineSeries.new(root, {
            name,
            xAxis,
            yAxis,
            valueXField: dateField,
            valueYField: field,
            valueYGrouped: aggregate,
            stroke: strokes[i],
            fill: strokes[i],
            tooltip: am5.Tooltip.new(root, {}),
          }),
        ),
      );
      for (const line of lines) line.strokes.template.set('strokeWidth', 2);

      // A target: the dashed reference line, and each line in chart.neutral within it and in its own hue past it,
      // filled to the target (the series fill reaches the axis, and the range clips it to the target's far side).
      const past = target?.past ?? 'above';
      const isPast = (value: number | undefined) => target !== undefined && value !== undefined && (past === 'above' ? value > target.value : value < target.value);
      if (target) {
        // The label sits on its line, so it stays with the line however far the readings run past it.
        referenceLines(root, chart, yAxis, [target], unit, colors, true);
        lines.forEach((line, i) => {
          line.set('stroke', colors.neutral);
          const item = yAxis.makeDataItem({ value: target.value, endValue: past === 'above' ? Number.MAX_SAFE_INTEGER : 0 });
          const range = line.createAxisRange(item) as am5xy.ILineSeriesAxisRange;
          range.strokes?.template.setAll({ stroke: strokes[i], strokeWidth: 2 });
          range.fills?.template.setAll({ fill: strokes[i], fillOpacity: pastFillOpacity, visible: true });
          // The range marks the series, not the axis: the reference line above is the target's only mark on the axis.
          item.get('grid')?.set('forceHidden', true);
          item.get('label')?.set('forceHidden', true);
          item.get('tick')?.set('forceHidden', true);
        });
      }

      // The tooltip says when a value stands for a group of readings, and says in words when it's past the target,
      // which the line shows by color. The date is on the date axis's tooltip.
      let period: string | undefined;
      const updatePeriod = () => {
        const interval = xAxis.getPrivate('groupInterval') ?? baseInterval;
        period = interval.timeUnit === 'minute' ? undefined : periods[interval.timeUnit];
      };
      series.forEach(({ name }, i) => lines[i].get('tooltip')?.set('labelText', `${name}: {valueY.formatNumber('${tooltipNumberFormat}')} ${unit}`));
      for (const line of lines) {
        const tooltip = line.get('tooltip');
        tooltip?.label.adapters.add('text', (text) => {
          if (!text) return text;
          const notes = [period && `${period} ${aggregates[aggregate]}`, isPast((tooltip.dataItem as am5.DataItem<am5xy.ILineSeriesDataItem> | undefined)?.get('valueY')) && `${past === 'above' ? 'over' : 'under'} target`].filter(Boolean);
          return notes.length ? `${text} (${notes.join(', ')})` : text;
        });
      }
      updatePeriod();
      xAxis.events.on('groupintervalchanged', updatePeriod);

      chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'zoomX', xAxis }));
      if (lines.length > 1) chart.children.push(legend(root)).data.setAll(lines);

      // The scrollbar previews the whole period in chart.neutral, grouped by month so it shows the season, not every weekday.
      // It's the chart's last row, leaving room at its right for the reset button, which sits beside the control it affects.
      // A horizontal scrollbar is always its parent's full width, so a padded row makes that room.
      const scrollbarRow = chart.children.push(am5.Container.new(root, { width: am5.p100, marginTop: scrollbarGap, paddingRight: resetWidth + scrollbarGap }));
      const scrollbar = scrollbarRow.children.push(am5xy.XYChartScrollbar.new(root, { orientation: 'horizontal', height: scrollbarHeight, marginTop: 0, marginBottom: 0 }));
      chart.set('scrollbarX', scrollbar);
      // The grips sit centered on the scrollbar's ends, so the row makes room for half a grip at each end: the left one
      // isn't clipped by the canvas, and the right one keeps clear of the reset button.
      scrollbar.startGrip.events.on('boundschanged', () => {
        const half = Math.ceil(scrollbar.startGrip.width() / 2);
        scrollbarRow.setAll({ paddingLeft: half, paddingRight: resetWidth + scrollbarGap + half });
      });
      // amCharts hides the XY scrollbar's thumb in code, where the theme can't reach; its look comes from `scrollbar-selection`.
      scrollbar.thumb.set('opacity', 1);
      scrollbar.thumb.states.create('hover', { opacity: 1 });
      const previewX = scrollbar.chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          baseInterval,
          groupData: true,
          groupIntervals: [{ timeUnit: 'month', count: 1 }],
          renderer: am5xy.AxisRendererX.new(root, {}),
        }),
      );
      previewX.get('renderer').labels.template.set('forceHidden', true);
      // The preview fits its own range rather than starting at 0, so the season shows in its 40px.
      const previewY = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, { renderer: am5xy.AxisRendererY.new(root, {}) }));
      const preview = scrollbar.chart.series.push(
        am5xy.LineSeries.new(root, {
          xAxis: previewX,
          yAxis: previewY,
          valueXField: dateField,
          valueYField: series[0].field,
          // An average, whatever the chart's aggregate, so a short month doesn't dip in the preview.
          valueYGrouped: 'average',
          stroke: colors.neutral,
        }),
      );

      for (const line of lines) line.data.setAll(data);
      preview.data.setAll(data);
    },
    [data, series, unit, aggregate, target, dateField, intervalMinutes],
  );
  const ref = useChart(build);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset, position: 'relative' }}>
      <Box ref={ref} sx={{ height: height + scrollbarGap + scrollbarHeight }} />
      <IconButton
        aria-label="Show the whole period"
        disabled={!zoomed}
        onClick={() => xAxisRef.current?.zoom(0, 1)}
        sx={{ position: 'absolute', right: (theme) => theme.spacing(inset), bottom: (theme) => theme.spacing(inset) }}
      >
        <Icon name="fit_screen" />
      </IconButton>
    </Box>
  );
}
