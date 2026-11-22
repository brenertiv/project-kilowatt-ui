import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import { Annotator } from '@amcharts/amcharts5/plugins/exporting';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Icon } from '../icons';
import { createSchemeTheme } from '../mui/theme';
import { seriesColors, seriesSlots, tooltipNumberFormat, type ChartInset, type SeriesColor } from './theme';
import { useChart, type ChartContext } from './useChart';

/** One part of the whole, and how it takes its color: a fixed `slot` for a product meaning, `neutral`, or neither for the next free slot. */
export type AnnotatedSlice = SeriesColor & {
  /** The part's name, shown in the legend and the tooltip, in sentence case. */
  category: string;
  /** The part's value, in `unit`. */
  value: number;
};

/** A chart's annotations, as MarkerJS saves them: the size they were drawn at and each marker's state. Store it as it is and hand it back to restore them. */
export type Annotations = { width: number; height: number; markers: Record<string, unknown>[] };

export type AnnotatedChartProps = {
  /** The parts of the whole, up to six, largest first. Keep it stable (a constant or `useMemo`): the chart is rebuilt when it changes. */
  data: AnnotatedSlice[];
  /** What one unit of value is, shown in the tooltip: `kWh`, `USD`. */
  unit: string;
  /** One sentence on what the chart shows and what its annotations say. It isn't shown: it's the figure's accessible name, the chart's text alternative, and the only way a screen reader hears the annotations. */
  summary: string;
  /** Annotations saved earlier, drawn over the chart when it loads. Keep it stable. Default none. */
  annotations?: Annotations;
  /** Called with the annotations each time the person finishes annotating, so a page can save them. Keep it stable (`useCallback`). Default none. */
  onAnnotationsChange?: (annotations: Annotations) => void;
  /** The chart's height in pixels, the legend and the Annotate button not included. Default `240`. */
  height?: number;
  /** The padding at the chart's sides and bottom, in theme spacing units (`ChartInset`): `2` (16px) to line up with `CardContent` and the card's title, `1` (8px) for a tighter fit, `0` to run edge to edge. Default `2`. */
  inset?: ChartInset;
};

/** Each scheme's palette, for MarkerJS's toolbars, which are HTML outside the MUI theme and take plain CSS colors. */
const palettes = { light: createSchemeTheme('light').palette, dark: createSchemeTheme('dark').palette };

/** The shares in the legend and tooltips, formatted with Intl (Rules → Content and layout). */
const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });

/** MarkerJS's editing area, as far as this chart uses it. */
type MarkerArea = {
  addEventListener: (type: 'close' | 'render', listener: (event: { state?: Annotations }) => void) => void;
  startRenderAndClose: () => Promise<void>;
};

/**
 * A chart people can draw on: a pie of the parts of one whole with amCharts' annotator over it, in
 * Kilowatt's chart theme (Rules → Charts). It's a reference implementation that Enertiv's app rebuilds,
 * and shows how any chart built with `useChart` takes annotations. An MUI **Annotate** button under
 * the chart opens MarkerJS's tools (arrows, callouts, text, shapes) on the menu surface; **Done** keeps
 * what was drawn, hands it to `onAnnotationsChange` to save, and **Clear annotations** removes it.
 * Saved `annotations` are drawn back over the chart. Slices take `chart.series` colors, with a legend
 * under the chart naming each part and its share. Annotations are a picture, so `summary` says what
 * they point out. The chart sits in a `figure` named by `summary`. Put it in a `Card` under a `CardHeader`.
 *
 * @summary A pie chart people can annotate with arrows, callouts and text, saved and restored as state.
 * @import import { AnnotatedChart } from 'src/charts/AnnotatedChart';
 */
export function AnnotatedChart({ data, unit, summary, annotations, onAnnotationsChange, height = 240, inset = 2 }: AnnotatedChartProps) {
  const annotator = useRef<Annotator | null>(null);
  const area = useRef<MarkerArea | null>(null);
  const [annotating, setAnnotating] = useState(false);
  const [annotated, setAnnotated] = useState(Boolean(annotations?.markers.length));
  const changed = useRef(onAnnotationsChange);
  useLayoutEffect(() => {
    changed.current = onAnnotationsChange;
  }, [onAnnotationsChange]);

  const build = useCallback(
    ({ root, scheme, colors }: ChartContext) => {
      // A pie smaller than its box, which leaves room around it to write in, and for MarkerJS's toolbars above and below it.
      const chart = root.container.children.push(am5percent.PieChart.new(root, { radius: am5.percent(64) }));
      const series = chart.series.push(am5percent.PieSeries.new(root, { categoryField: 'category', valueField: 'value', alignLabels: false }));
      // The legend under the chart names the parts, so the slices carry no labels or ticks, and annotations have clear space.
      series.labels.template.set('forceHidden', true);
      series.ticks.template.set('forceHidden', true);
      series.slices.template.setAll({
        templateField: 'sliceSettings',
        stroke: colors.surface,
        strokeWidth: 2,
        strokeOpacity: 1,
        tooltipText: `{category}: {value.formatNumber('${tooltipNumberFormat}')} ${unit} ({share})`,
      });
      const total = data.reduce((sum, part) => sum + part.value, 0);
      const fills = seriesColors(data, colors);
      series.data.setAll(data.map(({ category, value }, i) => ({ category, value, share: total ? percent.format(value / total) : '–', sliceSettings: { fill: fills[i] } })));

      // amCharts' annotator, opened by the MUI button under the chart rather than amCharts' export menu. MarkerJS's
      // toolbars are HTML of their own, so they take the menu surface and the text color from the palette, and its
      // inks are the text color and the intents: an annotation is a remark on the data, never a series.
      const { background, text, primary, action, error, warning, success, info } = palettes[scheme];
      annotator.current = Annotator.new(root, {
        markerSettings: {
          defaultColor: text.primary,
          defaultStrokeColor: text.primary,
          defaultFillColor: background.level4,
          defaultHighlightColor: warning.main,
          defaultColorSet: [text.primary, error.main, warning.main, success.main, info.main, background.level4],
        },
        markerStyleSettings: {
          toolbarBackgroundColor: background.level4,
          toolbarBackgroundHoverColor: action.hover,
          toolbarColor: text.primary,
          toolboxBackgroundColor: background.level4,
          toolboxColor: text.primary,
          toolboxAccentColor: primary.main,
        },
      });
      // Saved annotations are drawn back once the annotator's layer is on screen: MarkerJS renders them onto that layer's
      // canvas, which amCharts makes on the frame after the annotator first asks for it.
      if (annotations?.markers.length) {
        const instance = annotator.current;
        const draw = () => {
          if (!root.isDisposed() && !instance.isDisposed()) instance.set('markerState', annotations);
        };
        void instance.getMarkerArea().then(() => requestAnimationFrame(() => requestAnimationFrame(draw)));
      }
      area.current = null;
    },
    [data, unit, annotations],
  );
  const ref = useChart(build);

  const annotate = async () => {
    if (!annotator.current) return;
    // The annotator makes a new editing area each time it opens.
    const opened: MarkerArea = await annotator.current.getMarkerArea();
    opened.addEventListener('render', ({ state }) => {
      if (!state) return;
      setAnnotated(state.markers.length > 0);
      changed.current?.(state);
    });
    opened.addEventListener('close', () => {
      area.current = null;
      setAnnotating(false);
    });
    area.current = opened;
    await annotator.current.open();
    setAnnotating(true);
  };
  // Done keeps what was drawn: MarkerJS renders it onto the chart and closes its tools.
  const done = () => void area.current?.startRenderAndClose();
  const clear = () => {
    annotator.current?.clear();
    setAnnotated(false);
    changed.current?.({ width: 0, height: 0, markers: [] });
  };

  const slots = seriesSlots(data);

  return (
    <Box component="figure" aria-label={summary} sx={{ m: 0, px: inset, pb: inset }}>
      <Box ref={ref} sx={{ height }} />
      <Stack component="ul" direction="row" sx={{ listStyle: 'none', m: 0, p: 0, pt: 1.5, columnGap: 2, rowGap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {data.map(({ category, value }, i) => {
          const slot = slots[i];
          const total = data.reduce((sum, part) => sum + part.value, 0);
          return (
            <Stack key={category} component="li" direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <Box
                aria-hidden
                sx={(theme) => {
                  const { chart } = (theme.vars ?? theme).palette;
                  return { width: 8, height: 8, flex: 'none', borderRadius: '50%', bgcolor: slot === 'negative' ? chart.seriesShade : slot === 'neutral' ? chart.neutral : chart.series[slot] };
                }}
              />
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {category}{' '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {total ? percent.format(value / total) : '–'}
                </Box>
              </Typography>
            </Stack>
          );
        })}
      </Stack>
      <Stack direction="row" sx={{ pt: 2, gap: 1, justifyContent: 'center' }}>
        {annotating ? (
          <Button variant="contained" startIcon={<Icon name="check" />} onClick={done}>
            Done
          </Button>
        ) : (
          <Button variant="outlined" startIcon={<Icon name="edit" />} onClick={() => void annotate()}>
            Annotate
          </Button>
        )}
        {annotated && !annotating && <Button onClick={clear}>Clear annotations</Button>}
      </Stack>
    </Box>
  );
}
